import "server-only";

import { PrismaClient } from "@prisma/client";

interface PrismaGlobal {
  client?: PrismaClient;
}

const prismaGlobal = globalThis as unknown as PrismaGlobal;

/** Creates Prisma lazily so health checks do not require a database connection. */
export function getPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize Prisma");
  }

  prismaGlobal.client ??= new PrismaClient();
  return prismaGlobal.client;
}
