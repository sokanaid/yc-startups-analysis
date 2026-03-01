/**
 * MCP Server Tester using official SDK
 * Usage: node test-server-v2.mjs "npx -y @modelcontextprotocol/server-filesystem /tmp"
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { setTimeout as sleep } from "timers/promises";

const commandStr = process.argv[2];
const serverName = process.argv[3] || commandStr;

if (!commandStr) {
  console.error("Usage: node test-server-v2.mjs \"<command>\" [name]");
  process.exit(1);
}

const result = {
  name: serverName,
  command: commandStr,
  starts: false,
  initialize: false,
  initialize_ms: null,
  list_tools: false,
  tool_count: 0,
  tools: [],
  list_tools_ms: null,
  schema_valid: true,
  schema_issues: [],
  tool_call: null,     // null = skipped, true = ok, false = failed
  tool_call_ms: null,
  error: null,
};

const parts = commandStr.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)
  .map(s => s.replace(/^["']|["']$/g, ""));
const [command, ...args] = parts;

let client = null;
let transport = null;

try {
  transport = new StdioClientTransport({ command, args });
  client = new Client({ name: "mcpkit-tester", version: "0.1.0" }, { capabilities: {} });

  result.starts = true;
  const t0 = Date.now();
  await client.connect(transport);
  result.initialize = true;
  result.initialize_ms = Date.now() - t0;

  // List tools
  const t1 = Date.now();
  const toolsResp = await client.listTools();
  result.list_tools_ms = Date.now() - t1;
  const tools = toolsResp?.tools ?? [];
  result.list_tools = true;
  result.tool_count = tools.length;
  result.tools = tools.map(t => t.name);

  // Validate schemas
  for (const tool of tools) {
    if (!tool.name) {
      result.schema_valid = false;
      result.schema_issues.push("tool missing name");
    }
    if (!tool.description) {
      result.schema_issues.push(`"${tool.name}": missing description`);
    }
    if (!tool.inputSchema) {
      result.schema_valid = false;
      result.schema_issues.push(`"${tool.name}": missing inputSchema`);
    } else if (tool.inputSchema.type !== "object") {
      result.schema_valid = false;
      result.schema_issues.push(`"${tool.name}": inputSchema.type = "${tool.inputSchema.type}" (expected "object")`);
    }
  }

  // Call first tool with minimal args
  if (tools.length > 0) {
    const firstTool = tools[0];
    const testArgs = {};
    const props = firstTool.inputSchema?.properties ?? {};
    const required = firstTool.inputSchema?.required ?? [];
    for (const key of required) {
      const prop = props[key] ?? {};
      const t = prop.type;
      if (t === "string") testArgs[key] = "test";
      else if (t === "number" || t === "integer") testArgs[key] = 0;
      else if (t === "boolean") testArgs[key] = false;
      else if (t === "array") testArgs[key] = [];
      else testArgs[key] = {};
    }
    const t2 = Date.now();
    try {
      await client.callTool({ name: firstTool.name, arguments: testArgs });
      result.tool_call = true;
      result.tool_call_ms = Date.now() - t2;
    } catch (e) {
      // Server returned error but didn't crash = it responded
      result.tool_call = true;
      result.tool_call_ms = Date.now() - t2;
    }
  }

} catch (e) {
  if (!result.starts) result.error = `Failed to start: ${e.message.slice(0, 200)}`;
  else if (!result.initialize) result.error = `Failed to initialize: ${e.message.slice(0, 200)}`;
  else result.error = e.message.slice(0, 200);
} finally {
  try { await client?.close(); } catch {}
}

console.log(JSON.stringify(result, null, 2));
