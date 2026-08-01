import { digestValue } from "@/lib/security/crypto";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";
import type { PrismaClient } from "@prisma/client";
import type { GroqIntegration } from "@/integrations/groq";
import { answerProjectQuestion } from "./context";
import { recordOpinion } from "@/domain/opinions/service";
import { normalizeWhatsAppNumber } from "@/domain/consent/phone";

const STATE_TTL_MS = 24 * 60 * 60 * 1000;

export interface ConversationReply { body: string; }

export async function handleInboundMessage(
  prisma: PrismaClient,
  input: { from: string; body: string; eventKey: string },
  groq?: GroqIntegration,
): Promise<ConversationReply> {
  const number = normalizeWhatsAppNumber(input.from);
  const digest = digestValue(number);
  const citizen = await prisma.citizen.findUnique({ where: { numberDigest: digest } });
  const body = input.body.trim();
  if (/^(BAJA|STOP|CANCELAR)$/i.test(body)) {
    if (citizen) await prisma.subscription.updateMany({ where: { citizenId: citizen.id }, data: { active: false } });
    return { body: "Listo. No enviaremos nuevas consultas a este número. Puedes volver a suscribirte desde el portal." };
  }
  if (!citizen) return { body: "Para participar, suscríbete en el portal y acepta explícitamente recibir consultas por WhatsApp." };
  const state = await prisma.conversationState.findUnique({ where: { citizenId: citizen.id }, include: { consultation: true } });
  if (/^[123]$/.test(body)) {
    if (!state?.consultationId || !state.consultation || state.activeUntil <= new Date()) return { body: "Tu selección expiró. Abre nuevamente una consulta desde el portal." };
    try {
      const options = Array.isArray(state.consultation.options) ? state.consultation.options.filter((item): item is { key: string } => typeof item === "object" && item !== null && "key" in item && typeof item.key === "string") : [];
      const option = options[Number(body) - 1];
      const optionKey = option?.key ?? "";
      const result = await recordOpinion(prisma, { citizenId: citizen.id, projectId: state.projectId ?? "", consultationId: state.consultationId, optionKey, eventKey: input.eventKey });
      return { body: `Tu opinión (${result.optionKey}) fue registrada. Es una opinión ciudadana voluntaria, no un voto legislativo oficial.\n\nResultados: ${JSON.stringify(result.aggregate.counts)}` };
    } catch (error) {
      if (error instanceof DomainError) return { body: error.message };
      throw error;
    }
  }
  if (!state?.projectId || !state.consultationId || state.activeUntil <= new Date()) return { body: "No tengo una consulta activa seleccionada. Abre una consulta desde el portal o responde a una invitación vigente." };
  if (body.length < 3) return { body: "Puedes responder 1, 2 o 3 para opinar, o escribir una pregunta sobre el proyecto." };
  try {
    return { body: await answerProjectQuestion(prisma, state.projectId, body, groq) };
  } catch (error) {
    if (error instanceof DomainError) return { body: error.message };
    throw error;
  }
}

export async function setConversationState(prisma: PrismaClient, citizenId: string, projectId: string, consultationId: string, lastInboundKey?: string): Promise<void> {
  await prisma.conversationState.upsert({
    where: { citizenId },
    create: { citizenId, projectId, consultationId, activeUntil: new Date(Date.now() + STATE_TTL_MS), lastInboundKey },
    update: { projectId, consultationId, activeUntil: new Date(Date.now() + STATE_TTL_MS), lastInboundKey },
  });
}
