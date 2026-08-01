import type { Prisma, PrismaClient } from "@prisma/client";

import { aggregateNotifier } from "@/lib/realtime/notifier";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

import type { ConsultationOption } from "@/domain/consultations/campaign";

export interface OpinionResult {
  duplicate: boolean;
  optionKey: string;
  aggregate: {
    counts: Record<string, number>;
    percentages: Record<string, number>;
    participantCount: number;
    version: number;
    updatedAt: string;
  };
}

function percentage(count: number, total: number): number { return total ? Math.round((count / total) * 1000) / 10 : 0; }

export async function recordOpinion(
  prisma: PrismaClient,
  input: { citizenId: string; projectId: string; consultationId: string; optionKey: string; eventKey: string },
): Promise<OpinionResult> {
  const consultation = await prisma.consultation.findUnique({ where: { id: input.consultationId }, include: { project: true } });
  if (!consultation || consultation.projectId !== input.projectId || consultation.status !== "OPEN" || consultation.project.status !== "PUBLISHED") {
    throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "La consulta no está abierta para recibir opiniones.");
  }
  const options = parseConsultationOptions(consultation.options);
  const option = options.find((candidate) => candidate.key === input.optionKey);
  if (!option) throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, `Opción inválida. Responde ${options.map((candidate) => candidate.key).join(", ")}.`);

  const outcome = await prisma.$transaction(async (tx) => {
    const existingEvent = await tx.opinionEvent.findUnique({ where: { eventKey: input.eventKey } });
    if (existingEvent) {
      const current = await tx.opinion.findUnique({ where: { citizenId_projectId: { citizenId: input.citizenId, projectId: input.projectId } } });
      if (!current) throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "El evento ya fue procesado.");
      const aggregate = await computeAggregate(tx, input.projectId, input.consultationId, options);
      return { duplicate: true, optionKey: current.optionKey, aggregate };
    }
    await tx.opinionEvent.create({ data: { eventKey: input.eventKey, citizenId: input.citizenId, projectId: input.projectId, consultationId: input.consultationId, optionKey: option.key } });
    await tx.opinion.upsert({
      where: { citizenId_projectId: { citizenId: input.citizenId, projectId: input.projectId } },
      create: { citizenId: input.citizenId, projectId: input.projectId, consultationId: input.consultationId, optionKey: option.key, optionLabel: option.label },
      update: { consultationId: input.consultationId, optionKey: option.key, optionLabel: option.label },
    });
    const aggregate = await computeAggregate(tx, input.projectId, input.consultationId, options);
    return { duplicate: false, optionKey: option.key, aggregate };
  });
  if (!outcome.duplicate) aggregateNotifier.publish({ projectId: input.projectId, consultationId: input.consultationId, ...outcome.aggregate });
  return outcome;
}

function parseConsultationOptions(value: unknown): ConsultationOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ConsultationOption => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return typeof candidate.key === "string" && typeof candidate.label === "string";
  });
}

async function computeAggregate(
  tx: Prisma.TransactionClient,
  projectId: string,
  consultationId: string,
  options: ConsultationOption[],
): Promise<OpinionResult["aggregate"]> {
  const opinions = await tx.opinion.findMany({ where: { projectId }, select: { optionKey: true } }) as Array<{ optionKey: string }>;
  const counts: Record<string, number> = Object.fromEntries(options.map((option) => [option.key, 0]));
  for (const opinion of opinions) counts[opinion.optionKey] = (counts[opinion.optionKey] ?? 0) + 1;
  const participantCount = opinions.length;
  const percentages: Record<string, number> = Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, percentage(count, participantCount)]));
  const previous = await tx.aggregateResult.findUnique({ where: { projectId } }) as { version: number } | null;
  const now = new Date();
  const result = await tx.aggregateResult.upsert({
    where: { projectId },
    create: { projectId, consultationId, counts, percentages, participantCount, version: 1 },
    update: { consultationId, counts, percentages, participantCount, version: (previous?.version ?? 0) + 1, updatedAt: now },
  }) as { version: number; updatedAt: Date };
  return { counts, percentages, participantCount, version: result.version, updatedAt: result.updatedAt.toISOString() };
}

export async function getAggregate(prisma: PrismaClient, projectId: string) {
  return prisma.aggregateResult.findUnique({ where: { projectId } });
}
