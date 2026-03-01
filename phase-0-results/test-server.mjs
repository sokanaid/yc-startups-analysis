/**
 * MCP Server Quick Tester
 * Tests a single MCP server: start → initialize → list_tools → one tool call
 * Usage: node test-server.mjs "npx -y @modelcontextprotocol/server-filesystem /tmp"
 */

import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";

const TIMEOUT_MS = 20000;
const command = process.argv[2];

if (!command) {
  console.error("Usage: node test-server.mjs \"<command>\"");
  process.exit(1);
}

const results = {
  command,
  starts: false,
  responds_to_initialize: false,
  initialize_ms: null,
  list_tools: false,
  tool_count: 0,
  list_tools_ms: null,
  schema_valid: false,
  schema_issues: [],
  tool_call: false,
  tool_call_ms: null,
  error: null,
};

let msgId = 1;
let proc = null;
let buffer = "";

function sendMsg(proc, msg) {
  const str = JSON.stringify(msg);
  proc.stdin.write(`Content-Length: ${Buffer.byteLength(str)}\r\n\r\n${str}`);
}

function parseMessages(data) {
  buffer += data;
  const messages = [];
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) break;
    const header = buffer.slice(0, headerEnd);
    const lenMatch = header.match(/Content-Length: (\d+)/);
    if (!lenMatch) { buffer = buffer.slice(headerEnd + 4); continue; }
    const len = parseInt(lenMatch[1]);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + len) break;
    const body = buffer.slice(bodyStart, bodyStart + len);
    buffer = buffer.slice(bodyStart + len);
    try { messages.push(JSON.parse(body)); } catch {}
  }
  return messages;
}

async function waitForResponse(proc, id, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for id=${id}`)), timeoutMs);
    const handler = (data) => {
      const msgs = parseMessages(data.toString());
      for (const msg of msgs) {
        if (msg.id === id) {
          clearTimeout(timer);
          proc.stdout.off("data", handler);
          if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      }
    };
    proc.stdout.on("data", handler);
  });
}

async function run() {
  const parts = command.match(/(?:[^\s"]+|"[^"]*")+/g).map(s => s.replace(/"/g, ""));
  const [cmd, ...args] = parts;

  const startTime = Date.now();
  proc = spawn(cmd, args, {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PATH: process.env.PATH },
  });

  let stderrOutput = "";
  proc.stderr.on("data", d => stderrOutput += d.toString());

  await sleep(1000);
  if (proc.exitCode !== null) {
    results.error = `Crashed on startup (exit ${proc.exitCode}): ${stderrOutput.slice(0, 200)}`;
    return;
  }
  results.starts = true;

  // Initialize
  try {
    const id = msgId++;
    sendMsg(proc, {
      jsonrpc: "2.0", id,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "mcpkit-tester", version: "0.1.0" }
      }
    });
    const t0 = Date.now();
    const initResult = await waitForResponse(proc, id, 8000);
    results.initialize_ms = Date.now() - t0;
    results.responds_to_initialize = true;

    // Send initialized notification
    sendMsg(proc, { jsonrpc: "2.0", method: "notifications/initialized", params: {} });
    await sleep(200);

    // List tools
    const id2 = msgId++;
    sendMsg(proc, { jsonrpc: "2.0", id: id2, method: "tools/list", params: {} });
    const t1 = Date.now();
    const toolsResult = await waitForResponse(proc, id2, 8000);
    results.list_tools_ms = Date.now() - t1;

    const tools = toolsResult?.tools ?? [];
    results.list_tools = true;
    results.tool_count = tools.length;

    // Validate schemas
    for (const tool of tools) {
      if (!tool.name) results.schema_issues.push(`tool missing name`);
      if (!tool.description) results.schema_issues.push(`"${tool.name}": missing description`);
      if (!tool.inputSchema) results.schema_issues.push(`"${tool.name}": missing inputSchema`);
      else if (tool.inputSchema.type !== "object") results.schema_issues.push(`"${tool.name}": inputSchema.type !== "object"`);
    }
    results.schema_valid = results.schema_issues.length === 0;

    // Try calling first tool
    if (tools.length > 0) {
      const firstTool = tools[0];
      const testArgs = {};
      const props = firstTool.inputSchema?.properties ?? {};
      const required = firstTool.inputSchema?.required ?? [];
      for (const key of required) {
        const prop = props[key] ?? {};
        if (prop.type === "string") testArgs[key] = "test";
        else if (prop.type === "number" || prop.type === "integer") testArgs[key] = 0;
        else if (prop.type === "boolean") testArgs[key] = false;
        else if (prop.type === "array") testArgs[key] = [];
        else testArgs[key] = {};
      }
      const id3 = msgId++;
      sendMsg(proc, { jsonrpc: "2.0", id: id3, method: "tools/call", params: { name: firstTool.name, arguments: testArgs } });
      const t2 = Date.now();
      try {
        await waitForResponse(proc, id3, 10000);
        results.tool_call_ms = Date.now() - t2;
        results.tool_call = true;
      } catch (e) {
        // Server responded with error — still alive = good
        if (e.message !== `timeout waiting for id=${id3}`) {
          results.tool_call = true;
          results.tool_call_ms = Date.now() - t2;
        } else {
          results.error = `tool call timeout`;
        }
      }
    } else {
      results.tool_call = null; // skip
    }

  } catch (e) {
    results.error = e.message;
  }
}

try {
  await run();
} catch (e) {
  results.error = e.message;
} finally {
  if (proc && proc.exitCode === null) proc.kill();
  console.log(JSON.stringify(results, null, 2));
}
