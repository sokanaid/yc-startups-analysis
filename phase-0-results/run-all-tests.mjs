/**
 * Runs all 20 MCP server tests and writes results to results.json
 * Tests run sequentially to avoid npm cache conflicts
 */
import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import { setTimeout as sleep } from "timers/promises";

// 20 servers to test: 10 official + 10 community
const servers = [
  // --- OFFICIAL (Anthropic) ---
  {
    name: "filesystem",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-filesystem /tmp",
  },
  {
    name: "memory",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-memory",
  },
  {
    name: "fetch",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-fetch",
  },
  {
    name: "sequential-thinking",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-sequential-thinking",
  },
  {
    name: "everything",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-everything",
  },
  // --- COMMUNITY (high stars) ---
  {
    name: "mcp-server-sqlite",
    category: "community",
    // requires GITHUB_TOKEN - test without
    command: "npx -y mcp-server-sqlite --db-path /tmp/test.db",
  },
  {
    name: "mcp-pandoc",
    category: "community",
    command: "npx -y mcp-pandoc",
  },
  {
    name: "mcp-server-fetch",
    category: "community",
    command: "npx -y @kazuph/mcp-fetch",
  },
  {
    name: "mcp-obsidian",
    category: "community",
    command: "npx -y mcp-obsidian /tmp",
  },
  {
    name: "mcp-server-browserbase",
    category: "community",
    command: "npx -y @browserbasehq/mcp-browserbase",
  },
  {
    name: "mcp-server-brave-search",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-brave-search",
  },
  {
    name: "mcp-server-puppeteer",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-puppeteer",
  },
  {
    name: "mcp-weather",
    category: "community",
    command: "npx -y @modelcontextprotocol/server-weather",
  },
  {
    name: "mcp-everything-search",
    category: "community",
    command: "npx -y everything-mcp",
  },
  {
    name: "mcp-server-redis",
    category: "community",
    command: "npx -y @geffzhang/mcp-server-redis",
  },
  {
    name: "mcp-server-time",
    category: "community",
    command: "npx -y @modelcontextprotocol/server-time",
  },
  {
    name: "mcp-sse-shim",
    category: "community",
    command: "npx -y mcp-sse-shim",
  },
  {
    name: "mcp-server-ticketmaster",
    category: "community",
    command: "npx -y @delorenj/mcp-server-ticketmaster",
  },
  {
    name: "mcp-server-postgres",
    category: "official",
    command: "npx -y @modelcontextprotocol/server-postgres postgresql://localhost/test",
  },
  {
    name: "mcp-server-git",
    category: "community",
    command: "npx -y @cyanheads/git-mcp-server",
  },
];

function runTest(server) {
  return new Promise((resolve) => {
    const child = spawn(
      "node",
      ["test-server-v2.mjs", server.command, server.name],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env },
      }
    );

    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", () => {}); // ignore

    child.on("exit", () => {
      try {
        const parsed = JSON.parse(stdout);
        resolve({ ...server, ...parsed });
      } catch {
        resolve({ ...server, starts: false, error: "tester script failed", tool_count: 0 });
      }
    });

    // Hard timeout per server
    setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ ...server, starts: false, error: "hard timeout (30s)", tool_count: 0 });
    }, 30000);
  });
}

console.log(`Testing ${servers.length} MCP servers...\n`);

const results = [];
for (const server of servers) {
  process.stdout.write(`  Testing ${server.name.padEnd(35)} `);
  const r = await runTest(server);
  results.push(r);

  const status = r.error
    ? `❌  ${r.error.slice(0, 60)}`
    : r.initialize && r.list_tools && r.tool_call !== false
    ? `✅  ${r.tool_count} tools (init ${r.initialize_ms}ms)`
    : r.initialize && r.list_tools
    ? `⚠️   ${r.tool_count} tools, tool_call failed`
    : r.initialize
    ? `⚠️   initialized but list_tools failed`
    : r.starts
    ? `❌  starts but no initialize response`
    : `❌  won't start`;

  console.log(status);
}

// Save raw results
await writeFile("results.json", JSON.stringify(results, null, 2));

// Summary stats
const total = results.length;
const starts = results.filter((r) => r.starts).length;
const inits = results.filter((r) => r.initialize).length;
const listTools = results.filter((r) => r.list_tools).length;
const toolCallOk = results.filter((r) => r.tool_call === true).length;
const fullyWorking = results.filter(
  (r) => r.initialize && r.list_tools && r.tool_call === true
).length;
const broken = total - fullyWorking;
const brokenPct = Math.round((broken / total) * 100);

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESULTS: ${total} servers tested
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Starts:          ${starts}/${total}
  Initialize:      ${inits}/${total}
  List tools:      ${listTools}/${total}
  Tool call works: ${toolCallOk}/${total}
  Fully working:   ${fullyWorking}/${total}
  BROKEN:          ${broken}/${total} (${brokenPct}%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Broken server list
const brokenServers = results.filter(
  (r) => !(r.initialize && r.list_tools && r.tool_call === true)
);
if (brokenServers.length > 0) {
  console.log("Broken/incomplete servers:");
  for (const s of brokenServers) {
    const reason = !s.starts
      ? "won't start"
      : !s.initialize
      ? "no initialize response"
      : !s.list_tools
      ? "list_tools failed"
      : "tool_call timeout/fail";
    console.log(`  ❌ ${s.name}: ${reason} — ${s.error || ""}`);
  }
}
