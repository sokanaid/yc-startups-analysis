import { spawn } from "child_process";

const proc = spawn("npx", ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"], {
  stdio: ["pipe","pipe","pipe"],
  env: { ...process.env }
});

let stdout = "";
proc.stdout.on("data", d => {
  stdout += d.toString();
  console.log("STDOUT chunk:", JSON.stringify(d.toString().slice(0, 200)));
});
proc.stderr.on("data", d => {
  const s = d.toString();
  if (!s.includes("npm warn")) console.log("STDERR:", s.trim());
});

// Wait for server to start, then send
setTimeout(() => {
  const msg = JSON.stringify({
    jsonrpc:"2.0", id:1, method:"initialize",
    params: {
      protocolVersion:"2024-11-05",
      capabilities: {},
      clientInfo: { name:"test", version:"1.0" }
    }
  });
  const frame = `Content-Length: ${Buffer.byteLength(msg, "utf8")}\r\n\r\n${msg}`;
  console.log("Sending:", frame.slice(0, 100));
  proc.stdin.write(frame);

  setTimeout(() => {
    console.log("\nFull stdout received:", JSON.stringify(stdout.slice(0, 500)));
    proc.kill();
    process.exit(0);
  }, 6000);
}, 2000);
