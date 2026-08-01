import { getPrismaClient } from "@/lib/prisma";
import { createWhatsAppIntegration, type WhatsAppIntegration } from "@/integrations/whatsapp";
import { handleInboundMessage } from "@/domain/consultations/conversation";

interface RuntimeGlobal { whatsapp?: WhatsAppIntegration; inboundWired?: boolean; }
const runtimeGlobal = globalThis as unknown as RuntimeGlobal;

export function getWhatsAppRuntime(): WhatsAppIntegration {
  runtimeGlobal.whatsapp ??= createWhatsAppIntegration();
  if (!runtimeGlobal.inboundWired) {
    runtimeGlobal.inboundWired = true;
    runtimeGlobal.whatsapp.onMessage(async (message) => {
      const reply = await handleInboundMessage(getPrismaClient(), { from: message.from, body: message.body, eventKey: message.id });
      await runtimeGlobal.whatsapp?.sendText({ to: message.from, body: reply.body, idempotencyKey: `reply:${message.id}` });
    });
  }
  return runtimeGlobal.whatsapp;
}
