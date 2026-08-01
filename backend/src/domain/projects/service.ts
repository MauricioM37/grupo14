import { randomUUID } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";
import { savePrivatePdf, readPrivatePdf } from "@/lib/storage/private-pdf";
import { createGroqIntegration, type GroqIntegration } from "@/integrations/groq";

import { extractPdfText } from "./extraction";
import { approveSummary, getOrCreateSummary } from "./summary";

export interface CreateProjectInput {
  title: string;
  description: string;
  sourceDate?: string;
  categorySlugs: string[];
  file: Buffer;
  originalName: string;
}

export async function createProject(prisma: PrismaClient, input: CreateProjectInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const categories = [...new Set(input.categorySlugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean))];
  if (!title || !description || categories.length === 0 || !input.file.length) {
    throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "Título, descripción, categorías y PDF son obligatorios.");
  }
  const categoryRows = await prisma.category.findMany({ where: { slug: { in: categories }, active: true } });
  if (categoryRows.length !== categories.length) throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "Categoría inválida.");
  const project = await prisma.project.create({
    data: {
      title,
      description,
      sourceDate: input.sourceDate ? new Date(input.sourceDate) : undefined,
      categories: { connect: categoryRows.map((category) => ({ id: category.id })) },
      sources: {
        create: {
          storageKey: `${randomUUID()}.pdf`,
          originalName: input.originalName || "project.pdf",
          mimeType: "application/pdf",
        },
      },
    },
    include: { sources: true, categories: true },
  });
  const source = project.sources[0];
  if (!source) throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "No se pudo crear la fuente privada.", 500);
  await savePrivatePdf(source.storageKey, input.file);
  return project;
}

export async function processProject(
  prisma: PrismaClient,
  projectId: string,
  groq: GroqIntegration = createGroqIntegration(),
) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { sources: { orderBy: { createdAt: "desc" }, take: 1 } } });
  const source = project?.sources[0];
  if (!project || !source) throw new DomainError(DOMAIN_ERROR_CODE.NOT_FOUND, "Proyecto no encontrado.", 404);
  await prisma.project.update({ where: { id: projectId }, data: { status: "PROCESSING" } });
  try {
    const bytes = await readPrivatePdf(source.storageKey);
    const extracted = extractPdfText(bytes);
    await prisma.projectSource.update({
      where: { id: source.id },
      data: { fingerprint: extracted.fingerprint, extractedText: extracted.text, extractedChars: extracted.characters, status: "USABLE", errorMessage: null },
    });
    const summary = await getOrCreateSummary(prisma, project.id, {
      title: project.title,
      description: project.description,
      sourceText: extracted.text,
      sourceFingerprint: extracted.fingerprint,
    }, groq);
    await prisma.project.update({ where: { id: projectId }, data: { status: "READY_FOR_REVIEW" } });
    return { source: extracted, summary };
  } catch (error) {
    await prisma.projectSource.update({
      where: { id: source.id },
      data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Error de extracción" },
    });
    await prisma.project.update({ where: { id: projectId }, data: { status: "FAILED" } });
    throw error;
  }
}

export async function reviewProjectSummary(prisma: PrismaClient, projectId: string, summaryId: string, adminId: string): Promise<void> {
  const summary = await prisma.summary.findFirst({ where: { id: summaryId, projectId } });
  if (!summary) throw new DomainError(DOMAIN_ERROR_CODE.NOT_FOUND, "Resumen no encontrado.", 404);
  await approveSummary(prisma, summary.id, adminId);
}

export async function publishProject(prisma: PrismaClient, projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { sources: { orderBy: { createdAt: "desc" }, take: 1 }, summaries: { where: { status: "APPROVED" }, orderBy: { generatedAt: "desc" }, take: 1 } },
  });
  const source = project?.sources[0];
  const summary = project?.summaries[0];
  if (!project || !source) throw new DomainError(DOMAIN_ERROR_CODE.NOT_FOUND, "Proyecto no encontrado.", 404);
  if (source.status !== "USABLE" || !source.fingerprint || !source.extractedText || !summary || summary.sourceFingerprint !== source.fingerprint) {
    throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "El proyecto requiere una fuente usable y un resumen aprobado que coincida.");
  }
  await prisma.project.update({ where: { id: projectId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
}

export async function unpublishProject(prisma: PrismaClient, projectId: string): Promise<void> {
  await prisma.project.update({ where: { id: projectId }, data: { status: "UNPUBLISHED", publishedAt: null } });
}
