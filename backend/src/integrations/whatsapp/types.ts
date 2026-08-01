export const WHATSAPP_CLIENT_STATE = {
  DISABLED: "disabled",
  INITIALIZING: "initializing",
  QR: "qr",
  READY: "ready",
  DISCONNECTED: "disconnected",
  FAILED: "failed",
} as const;

export type WhatsAppClientState = (typeof WHATSAPP_CLIENT_STATE)[keyof typeof WHATSAPP_CLIENT_STATE];

export interface WhatsAppTextMessage {
  to: string;
  body: string;
  idempotencyKey?: string;
}

export interface WhatsAppInboundMessage {
  id: string;
  from: string;
  body: string;
  interactiveOption?: string;
}

export interface WhatsAppIntegration {
  status: WhatsAppClientState;
  isEnabled: boolean;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  sendText(message: WhatsAppTextMessage): Promise<void>;
  onMessage(handler: (message: WhatsAppInboundMessage) => Promise<void>): () => void;
}
