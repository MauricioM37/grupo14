export const WHATSAPP_INTEGRATION_STATUS = {
  STUB: "stub",
} as const;

export type WhatsAppIntegrationStatus =
  (typeof WHATSAPP_INTEGRATION_STATUS)[keyof typeof WHATSAPP_INTEGRATION_STATUS];

export interface WhatsAppTextMessage {
  to: string;
  body: string;
}

export interface WhatsAppIntegration {
  status: WhatsAppIntegrationStatus;
  isEnabled: boolean;
  sendText(message: WhatsAppTextMessage): Promise<void>;
}
