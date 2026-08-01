import type { PrismaClient } from "@prisma/client";

import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

const DISCLAIMER = "Estos resultados representan opiniones ciudadanas voluntarias y no son votos legislativos oficiales.";

interface PublicOption {
  key: string;
  label: string;
}

function optionsOf(value: unknown): PublicOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is PublicOption => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return typeof candidate.key === "string" && typeof candidate.label === "string";
  });
}

function aggregateProjection(aggregate: { counts: unknown; percentages: unknown; participantCount: number; version: number; updatedAt: Date } | null) {
  return aggregate
    ? { counts: aggregate.counts, percentages: aggregate.percentages, participantCount: aggregate.participantCount, version: aggregate.version, updatedAt: aggregate.updatedAt.toISOString() }
    : { counts: {}, percentages: {}, participantCount: 0, version: 0, updatedAt: null };
}

function projectProjection(project: {
  id: string; title: string; description: string; sourceDate: Date | null; publishedAt: Date | null;
  categories: Array<{ slug: string; name: string }>;
  summaries: Array<{ text: string }>;
  consultations: Array<{ id: string; question: string; options: unknown; status: string; disclaimer: string; aggregate: { counts: unknown; percentages: unknown; participantCount: number; version: number; updatedAt: Date } | null }>;
}) {
  const consultation = project.consultations[0];
  return {
    id: project.id,
    title: project.title,
    description: project.description,
    categories: project.categories.map((category) => ({ slug: category.slug, name: category.name })),
    sourceDate: project.sourceDate?.toISOString() ?? null,
    publishedAt: project.publishedAt?.toISOString() ?? null,
    summary: project.summaries[0]?.text ?? null,
    consultation: consultation
      ? { id: consultation.id, question: consultation.question, options: optionsOf(consultation.options), status: consultation.status, disclaimer: consultation.disclaimer, aggregate: aggregateProjection(consultation.aggregate) }
      : null,
    disclaimer: DISCLAIMER,
  };
}

export async function listPublicProjects(prisma: PrismaClient) {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { categories: true, summaries: { where: { status: "APPROVED" }, orderBy: { generatedAt: "desc" }, take: 1 }, consultations: { where: { status: { in: ["OPEN", "CLOSED"] } }, orderBy: { createdAt: "desc" }, take: 1, include: { aggregate: true } } },
  });
  return projects.map(projectProjection);
}

export async function getPublicProject(prisma: PrismaClient, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, status: "PUBLISHED" },
    include: { categories: true, summaries: { where: { status: "APPROVED" }, orderBy: { generatedAt: "desc" }, take: 1 }, consultations: { where: { status: { in: ["OPEN", "CLOSED"] } }, orderBy: { createdAt: "desc" }, take: 1, include: { aggregate: true } } },
  });
  if (!project) throw new DomainError(DOMAIN_ERROR_CODE.NOT_FOUND, "Proyecto no encontrado.", 404);
  return projectProjection(project);
}

export { DISCLAIMER, aggregateProjection, optionsOf };
