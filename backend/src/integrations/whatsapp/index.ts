import { getBackendConfig } from "@/lib/config";

import { WHATSAPP_INTEGRATION_STATUS, type WhatsAppIntegration } from "./types";

const NOT_IMPLEMENTED_MESSAGE =
  "WhatsApp integration is scaffold-only; whatsapp-web.js is not initialized yet.";

export function createWhatsAppIntegration(): WhatsAppIntegration {
  const config = getBackendConfig();

  return {
    status: WHATSAPP_INTEGRATION_STATUS.STUB,
    isEnabled: config.whatsappEnabled,
    async sendText(): Promise<void> {
      throw new Error(NOT_IMPLEMENTED_MESSAGE);
    },
  };
}

export type { WhatsAppIntegration, WhatsAppTextMessage } from "./types";
