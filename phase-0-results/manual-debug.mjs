import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";

// Test server-fetch manually — watch every event
const proc = spawn("npx", ["-y", "@modelcontextprotocol/server-fetch"], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env }
});

console.log("Process spawned, pid:", proc.pid);

proc.stdout.on("data", d => console.log("[STDOUT]", JSON.stringify(d.toString())));
proc.stderr.on("data", d => {
  const s = d.toString();
  if (!s.includes("npm warn")) console.log("[STDERR]", s.trim());
});
proc.on("exit", (code, sig) => console.log("[EXIT]", code, sig));
proc.on("error", e => console.log("[ERROR]", e.message));

// Wait for download + startup
console.log("Waiting 15s for npx to download and start...");
await sleep(15000);
console.log("Proc exit code so far:", proc.exitCode);

if (proc.exitCode === null) {
  console.log("Process is still running. Sending initialize...");
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");

  // Don't spawn a new process — reuse the existing one
  // StdioClientTransport doesn't support attaching to existing process
  // so let's just send raw JSON-RPC
  const msg = JSON.stringify({jsonrpc:"2.0",id:1,method:"initialize",params:{
    protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"test",version:"1.0"}
  }});
  proc.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
  console.log("Sent initialize, waiting 5s for response...");
  await sleep(5000);
  console.log("No response received via stdout");
}

proc.kill();
process.exit(0);
