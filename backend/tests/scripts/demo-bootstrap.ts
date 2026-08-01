import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { PrismaClient, Prisma } from "@prisma/client";

import { extractPdfText } from "../../src/domain/projects/extraction";
import { savePrivatePdf } from "../../src/lib/storage/private-pdf";
import { resolveDatabaseUrl } from "../../src/lib/database-url";

const DATABASE_ERROR = "Demo bootstrap blocked: no supported PostgreSQL connection configuration was found.";
const databaseUrl = resolveDatabaseUrl();

async function main(): Promise<void> {
  if (!databaseUrl) {
    console.error(DATABASE_ERROR);
    process.exitCode = 2;
    return;
  }
  process.env.DATABASE_URL = databaseUrl;
  const prisma = new PrismaClient();
  const pdf = await readFile(join(process.cwd(), "tests", "fixtures", "text.pdf"));
  const extracted = extractPdfText(pdf);
  try {
    const category = await prisma.category.upsert({
      where: { slug: "movilidad" },
      create: { id: "demo-category-movilidad", slug: "movilidad", name: "Movilidad", active: true },
      update: { name: "Movilidad", active: true },
    });
    await prisma.admin.upsert({
      where: { email: "demo-admin@example.invalid" },
      create: { id: "demo-admin-v1", email: "demo-admin@example.invalid", displayName: "Demo administrator" },
      update: { displayName: "Demo administrator", active: true },
    });
    const project = await prisma.project.upsert({
      where: { id: "demo-project-v1" },
      create: {
        id: "demo-project-v1",
        title: "Proyecto de transporte público",
        description: "Mejora de recorridos y frecuencia del transporte público local.",
        sourceDate: new Date("2026-01-15T00:00:00.000Z"),
        status: "PUBLISHED",
        publishedAt: new Date("2026-01-16T00:00:00.000Z"),
        categories: { connect: { id: category.id } },
      },
      update: {
        title: "Proyecto de transporte público",
        description: "Mejora de recorridos y frecuencia del transporte público local.",
        status: "PUBLISHED",
        publishedAt: new Date("2026-01-16T00:00:00.000Z"),
        categories: { set: [{ id: category.id }] },
      },
    });
    await savePrivatePdf("demo-project-v1.pdf", pdf);
    await prisma.projectSource.upsert({
      where: { id: "demo-source-v1" },
      create: {
        id: "demo-source-v1",
        projectId: project.id,
        storageKey: "demo-project-v1.pdf",
        originalName: "transporte-publico.pdf",
        mimeType: "application/pdf",
        fingerprint: extracted.fingerprint,
        extractedText: extracted.text,
        extractedChars: extracted.characters,
        status: "USABLE",
      },
      update: {
        storageKey: "demo-project-v1.pdf",
        fingerprint: extracted.fingerprint,
        extractedText: extracted.text,
        extractedChars: extracted.characters,
        status: "USABLE",
        errorMessage: null,
      },
    });
    await prisma.summary.upsert({
      where: {
        projectId_sourceFingerprint_promptVersion_modelConfiguration: {
          projectId: project.id,
          sourceFingerprint: extracted.fingerprint,
          promptVersion: "citizen-summary-v1",
          modelConfiguration: "demo-fake-v1",
        },
      },
      create: {
        id: "demo-summary-v1",
        projectId: project.id,
        sourceFingerprint: extracted.fingerprint,
        promptVersion: "citizen-summary-v1",
        modelConfiguration: "demo-fake-v1",
        text: "El proyecto propone mejorar el transporte público local mediante cambios en recorridos y frecuencia. La información es orientativa y debe revisarse en el documento fuente.",
        status: "APPROVED",
        approvedAt: new Date("2026-01-16T00:00:00.000Z"),
        approvedBy: "demo-admin-v1",
      },
      update: {
        text: "El proyecto propone mejorar el transporte público local mediante cambios en recorridos y frecuencia. La información es orientativa y debe revisarse en el documento fuente.",
        status: "APPROVED",
        approvedAt: new Date("2026-01-16T00:00:00.000Z"),
        approvedBy: "demo-admin-v1",
        errorMessage: null,
      },
    });
    const consultation = await prisma.consultation.upsert({
      where: { id: "demo-consultation-v1" },
      create: {
        id: "demo-consultation-v1",
        projectId: project.id,
        question: "¿Apoyas mejorar los recorridos y la frecuencia del transporte público?",
        options: [
          { key: "support", label: "Sí, apoyo la propuesta" },
          { key: "reject", label: "No, no la apoyo" },
          { key: "unsure", label: "Necesito más información" },
        ] as Prisma.InputJsonValue,
        status: "OPEN",
        opensAt: new Date("2026-01-17T00:00:00.000Z"),
        disclaimer: "Tu respuesta es una opinión ciudadana voluntaria y no un voto legislativo oficial.",
      },
      update: { projectId: project.id, status: "OPEN" },
    });
    await prisma.aggregateResult.upsert({
      where: { projectId: project.id },
      create: { projectId: project.id, consultationId: consultation.id, counts: { support: 0, reject: 0, unsure: 0 }, percentages: { support: 0, reject: 0, unsure: 0 }, participantCount: 0, version: 1 },
      update: { consultationId: consultation.id },
    });
    console.log("Demo bootstrap completed: deterministic published project and open consultation are ready.");
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(`Demo bootstrap failed: ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
