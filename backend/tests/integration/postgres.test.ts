import { describe, expect, it } from "vitest";

import { getPrismaClient } from "@/lib/prisma";
import { resolveDatabaseUrl } from "@/lib/database-url";

describe("PostgreSQL integration", () => {
  it("connects without mutating data", async () => {
    if (!resolveDatabaseUrl()) return;
    const prisma = getPrismaClient();
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    expect(result[0]?.ok).toBe(1);
    expect(await prisma.project.count()).toBeGreaterThanOrEqual(0);
  });
});
