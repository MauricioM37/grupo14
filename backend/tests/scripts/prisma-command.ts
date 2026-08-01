import { spawn } from "node:child_process";
import { join } from "node:path";

import { resolveDatabaseUrl } from "../../src/lib/database-url";

const databaseUrl = resolveDatabaseUrl();
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

const executable = join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
const child = spawn(executable, process.argv.slice(2), {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
child.on("exit", (code) => { process.exitCode = code ?? 1; });
