import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { getPrismaClient } from "@/lib/prisma";
import { resolveDatabaseUrl } from "@/lib/database-url";
import { protectNumber } from "@/domain/consent/phone";
import { listPublicProjects } from "@/domain/projects/public";
import { recordOpinionInTransaction } from "@/domain/opinions/service";

describe("PostgreSQL integration", () => {
  it("connects without mutating data", async () => {
    if (!resolveDatabaseUrl()) throw new Error("PostgreSQL integration blocked: no supported connection configuration was found.");
    const prisma = getPrismaClient();
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    expect(result[0]?.ok).toBe(1);
    expect(await prisma.project.count()).toBeGreaterThanOrEqual(0);
  });

  it("keeps one current opinion and exposes only aggregate projection", async () => {
    if (!resolveDatabaseUrl()) throw new Error("PostgreSQL integration blocked: no supported connection configuration was found.");
    process.env.DATA_ENCRYPTION_KEY ??= "integration-test-data-key";
    process.env.NUMBER_HMAC_KEY ??= "integration-test-hmac-key";
    const prisma = getPrismaClient();
    const rollback = new Error("rollback integration fixture");
    await expect(prisma.$transaction(async (tx) => {
      const suffix = randomUUID();
      const category = await tx.category.create({ data: { slug: `integration-${suffix}`, name: "Integration", active: true } });
      const project = await tx.project.create({ data: { title: "Integration project", description: "Private description", status: "PUBLISHED", categories: { connect: { id: category.id } } } });
      const source = await tx.projectSource.create({ data: { projectId: project.id, storageKey: `${suffix}.pdf`, originalName: "test.pdf", mimeType: "application/pdf", fingerprint: suffix, extractedText: "Fuente de prueba suficientemente extensa.", extractedChars: 40, status: "USABLE" } });
      await tx.summary.create({ data: { projectId: project.id, sourceFingerprint: source.fingerprint ?? suffix, promptVersion: "test", modelConfiguration: "test", text: "Resumen de prueba", status: "APPROVED" } });
      const consultation = await tx.consultation.create({ data: { projectId: project.id, question: "¿Apoyas?", options: [{ key: "yes", label: "Sí" }, { key: "no", label: "No" }], status: "OPEN", disclaimer: "No es un voto oficial." } });
      const citizen = await tx.citizen.create({ data: protectNumber("+56912345678") });
      const first = await recordOpinionInTransaction(tx, { citizenId: citizen.id, projectId: project.id, consultationId: consultation.id, optionKey: "yes", eventKey: `${suffix}:one` });
      const second = await recordOpinionInTransaction(tx, { citizenId: citizen.id, projectId: project.id, consultationId: consultation.id, optionKey: "no", eventKey: `${suffix}:two` });
      expect(first.aggregate.participantCount).toBe(1);
      expect(second.aggregate.counts).toMatchObject({ yes: 0, no: 1 });
      const publicProjects = await listPublicProjects(tx as unknown as Parameters<typeof listPublicProjects>[0]);
      expect(JSON.stringify(publicProjects)).not.toContain(citizen.id);
      expect(publicProjects[0]?.consultation?.aggregate.participantCount).toBe(1);
      throw rollback;
    }, { timeout: 60_000 })).rejects.toMatchObject({ message: "rollback integration fixture" });
  }, 60_000);
});
