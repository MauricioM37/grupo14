import { PrismaClient } from "@prisma/client";

import { resolveDatabaseUrl } from "@/lib/database-url";

interface PrismaGlobal {
  client?: PrismaClient;
}

const prismaGlobal = globalThis as unknown as PrismaGlobal;

/** Creates Prisma lazily so health checks do not require a database connection. */
export function getPrismaClient(): PrismaClient {
  const databaseUrl = resolveDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
  }

  process.env.DATABASE_URL = databaseUrl;
  prismaGlobal.client ??= new PrismaClient();
  return prismaGlobal.client;
}
