import { spawn } from "child_process";
const proc = spawn("npx", ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"], {
  stdio: ["pipe","pipe","pipe"],
  env: { ...process.env }
});
proc.stdout.on("data", d => console.log("STDOUT:", d.toString().slice(0,300)));
proc.stderr.on("data", d => console.log("STDERR:", d.toString().slice(0,300)));
proc.on("exit", (code) => console.log("EXIT:", code));
setTimeout(() => {
  const msg = JSON.stringify({jsonrpc:"2.0",id:1,method:"initialize",params:{protocolVersion:"2024-11-05",capabilities:{},clientInfo:{name:"test",version:"0.1"}}});
  proc.stdin.write(`Content-Length: ${Buffer.byteLength(msg)}\r\n\r\n${msg}`);
  setTimeout(() => { proc.kill(); process.exit(0); }, 5000);
}, 2000);
