import { PrismaClient } from "@prisma/client";

import { resolveDatabaseUrl } from "../../src/lib/database-url";

const databaseUrl = resolveDatabaseUrl();
async function main(): Promise<void> {
 if (!databaseUrl) {
  console.error("PostgreSQL smoke blocked: no supported connection configuration was found.");
  process.exitCode = 2;
  return;
 }
  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    console.log(`PostgreSQL smoke passed: SELECT 1 returned ${result[0]?.ok ?? "no row"}; no mutation performed.`);
  } catch (error) {
    console.error(`PostgreSQL smoke failed: ${error instanceof Error ? error.message : "unknown database error"}`);
    process.exitCode = 1;
  } finally { await prisma.$disconnect(); }
}

void main();
