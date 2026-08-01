import { spawn } from "node:child_process";
import { join } from "node:path";

import { resolveDatabaseUrl } from "../../src/lib/database-url";

const databaseUrl = resolveDatabaseUrl();
if (!databaseUrl) {
  console.error("Prisma migration blocked: no supported connection configuration was found.");
  process.exitCode = 2;
} else {
  process.env.DATABASE_URL = databaseUrl;
  const executable = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
  const command = process.argv.slice(2);
  const child = spawn(executable, command.length ? command : ["migrate", "deploy"], { stdio: "inherit", env: process.env, shell: process.platform === "win32" });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
}
