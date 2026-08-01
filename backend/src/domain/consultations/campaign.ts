import type { Prisma, PrismaClient } from "@prisma/client";

import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";
import { decryptValue } from "@/lib/security/crypto";
import type { WhatsAppIntegration } from "@/integrations/whatsapp";
import { setConversationState } from "./conversation";

const MAX_ATTEMPTS = 3;

export interface ConsultationOption {
  key: string;
  label: string;
}

function parseOptions(value: unknown): ConsultationOption[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ConsultationOption => {
    if (!item || typeof item !== "object") return false;
    const candidate = item as Record<string, unknown>;
    return typeof candidate.key === "string" && typeof candidate.label === "string";
  });
}

export async function createConsultation(
  prisma: PrismaClient,
  input: { projectId: string; question: string; options: ConsultationOption[]; opensAt?: string; closesAt?: string },
) {
  if (!input.question.trim() || input.options.length < 2 || input.options.length > 3 || input.options.some((option) => !option.key || !option.label)) {
    throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "La consulta requiere una pregunta y entre dos y tres opciones válidas.");
  }
  const project = await prisma.project.findFirst({ where: { id: input.projectId, status: "PUBLISHED" }, include: { summaries: { where: { status: "APPROVED" }, take: 1 } } });
  if (!project?.summaries[0]) throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "Solo se puede consultar un proyecto publicado con resumen aprobado.");
  return prisma.consultation.create({
    data: {
      projectId: input.projectId,
      question: input.question.trim(),
      options: input.options as unknown as Prisma.InputJsonValue,
      status: "DRAFT",
      opensAt: input.opensAt ? new Date(input.opensAt) : new Date(),
      closesAt: input.closesAt ? new Date(input.closesAt) : undefined,
      disclaimer: "Tu respuesta es una opinión ciudadana voluntaria y no un voto legislativo oficial.",
    },
  });
}

export async function setConsultationStatus(prisma: PrismaClient, consultationId: string, status: "OPEN" | "CLOSED"): Promise<void> {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId }, include: { project: true } });
  if (!consultation || consultation.project.status !== "PUBLISHED") throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "La consulta requiere un proyecto publicado.");
  await prisma.consultation.update({ where: { id: consultationId }, data: { status } });
}

export async function snapshotAudience(prisma: PrismaClient, consultationId: string): Promise<number> {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId }, include: { project: { include: { categories: true } } } });
  if (!consultation || consultation.status !== "OPEN" || consultation.project.status !== "PUBLISHED") throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "La consulta no está disponible para despacho.");
  const categoryIds = consultation.project.categories.map((category) => category.id);
  const citizens = await prisma.citizen.findMany({ where: { subscriptions: { some: { active: true, categoryId: { in: categoryIds } } } }, include: { subscriptions: { where: { active: true, categoryId: { in: categoryIds } }, include: { category: true } } } });
  await prisma.$transaction(async (tx) => {
    for (const citizen of citizens) {
      await tx.audienceSnapshot.upsert({
        where: { consultationId_citizenId: { consultationId, citizenId: citizen.id } },
        create: { consultationId, citizenId: citizen.id, matchedSlugs: citizen.subscriptions.map((subscription) => subscription.category.slug) },
        update: { matchedSlugs: citizen.subscriptions.map((subscription) => subscription.category.slug) },
      });
    }
  });
  return citizens.length;
}

function invitation(question: string, options: ConsultationOption[]): string {
  return `Consulta ciudadana (no es un voto oficial):\n${question}\n\n${options.map((option, index) => `${index + 1}. ${option.label}`).join("\n")}\n\nResponde 1, 2 o 3 para registrar tu opinión. También puedes hacer una pregunta sobre el proyecto.`;
}

export async function dispatchConsultation(prisma: PrismaClient, consultationId: string, whatsapp: WhatsAppIntegration): Promise<{ attempted: number; sent: number; skipped: number }> {
  const consultation = await prisma.consultation.findUnique({ where: { id: consultationId }, include: { project: true } });
  if (!consultation || consultation.status !== "OPEN" || consultation.project.status !== "PUBLISHED") throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "La consulta no está abierta.");
  await snapshotAudience(prisma, consultationId);
  const snapshots = await prisma.audienceSnapshot.findMany({ where: { consultationId }, include: { citizen: true, recipient: true } });
  const options = parseOptions(consultation.options);
  let sent = 0;
  let skipped = 0;
  for (const snapshot of snapshots) {
    const idempotencyKey = `${consultationId}:${snapshot.citizenId}`;
    const recipient = snapshot.recipient ?? await prisma.campaignRecipient.create({ data: { consultationId, citizenId: snapshot.citizenId, snapshotId: snapshot.id, idempotencyKey } });
    if (["SENT", "DELIVERED"].includes(recipient.status)) continue;
    const active = await prisma.subscription.count({ where: { citizenId: snapshot.citizenId, active: true, category: { projects: { some: { id: consultation.projectId } } } } });
    if (!active) {
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "OPTED_OUT", lastError: "Consentimiento inactivo o sin categoría coincidente" } });
      skipped += 1;
      continue;
    }
    try {
      const number = decryptValue({ ciphertext: snapshot.citizen.numberCiphertext, iv: snapshot.citizen.numberIv, authTag: snapshot.citizen.numberAuthTag });
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "QUEUED", attempts: { increment: 1 } } });
      await whatsapp.sendText({ to: number, body: invitation(consultation.question, options), idempotencyKey });
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "SENT", sentAt: new Date(), lastError: null } });
      await setConversationState(prisma, snapshot.citizenId, consultation.projectId, consultationId);
      sent += 1;
    } catch (error) {
      const attempts = recipient.attempts + 1;
      await prisma.campaignRecipient.update({ where: { id: recipient.id }, data: { status: attempts >= MAX_ATTEMPTS ? "FAILED" : "QUEUED", attempts, lastError: error instanceof Error ? error.message : "Error de envío" } });
    }
  }
  return { attempted: snapshots.length, sent, skipped };
}

export { parseOptions };
