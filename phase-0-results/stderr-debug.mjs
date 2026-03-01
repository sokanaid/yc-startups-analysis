import { spawn } from "child_process";
import { setTimeout as sleep } from "timers/promises";

const cmd = process.argv[2];
const [bin, ...args] = cmd.split(" ");

const proc = spawn("npx", ["-y", ...cmd.replace("npx -y ","").split(" ")], {
  stdio: ["pipe","pipe","pipe"], env: { ...process.env }
});

let stderr = "";
proc.stdout.on("data", d => process.stdout.write("[OUT] " + d.toString()));
proc.stderr.on("data", d => {
  const s = d.toString();
  if (!s.includes("npm warn") && !s.includes("npm notice")) {
    stderr += s;
    process.stdout.write("[ERR] " + s);
  }
});
proc.on("exit", (code) => console.log("\n[EXIT code=" + code + "]"));
await sleep(8000);
proc.kill();
