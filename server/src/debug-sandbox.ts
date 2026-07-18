/** Inspect a running sandbox: session logs + local port check. Usage: tsx src/debug-sandbox.ts <sandboxId> */
import { Daytona } from "@daytona/sdk";
import { config } from "./config.js";

const id = process.argv[2];
if (!id) throw new Error("pass sandbox id");

const daytona = new Daytona({ apiKey: config.daytona.apiKey, apiUrl: config.daytona.apiUrl });

const sandbox = await daytona.get(id);
const root = (await sandbox.getUserRootDir()) ?? "/home/daytona";

console.log("=== processes listening ===");
const ss = await sandbox.process.executeCommand("ss -tlnp 2>/dev/null | head -10 || netstat -tlnp 2>/dev/null | head -10", root);
console.log(ss.result);

console.log("=== session 'dev' commands + logs ===");
try {
  const session = await sandbox.process.getSession("dev");
  for (const cmd of session.commands ?? []) {
    console.log(`--- cmd: ${cmd.command} (exit: ${cmd.exitCode ?? "running"})`);
    try {
      const logs = await sandbox.process.getSessionCommandLogs("dev", cmd.id!);
      console.log(String(logs).slice(-3000));
    } catch (e) {
      console.log("  (no logs:", (e as Error).message, ")");
    }
  }
} catch (e) {
  console.log("session err:", (e as Error).message);
}

console.log("=== curl inside sandbox ===");
const curl = await sandbox.process.executeCommand(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 --max-time 5`, root);
console.log("localhost:3100 →", curl.result);
