import { randomUUID } from "node:crypto";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

import { WHATSAPP_CLIENT_STATE, type WhatsAppInboundMessage, type WhatsAppIntegration, type WhatsAppTextMessage } from "./types";

type InboundHandler = (message: WhatsAppInboundMessage) => Promise<void>;

export function createFakeWhatsAppIntegration(): WhatsAppIntegration & {
  sent: WhatsAppTextMessage[];
  receive(message: WhatsAppInboundMessage): Promise<void>;
} {
  const sent: WhatsAppTextMessage[] = [];
  const handlers = new Set<InboundHandler>();
  let status: WhatsAppIntegration["status"] = WHATSAPP_CLIENT_STATE.DISABLED;
  return {
    get status() { return status; },
    isEnabled: true,
    sent,
    async initialize() { status = WHATSAPP_CLIENT_STATE.READY; },
    async shutdown() { status = WHATSAPP_CLIENT_STATE.DISCONNECTED; },
    async sendText(message) { sent.push(message); },
    onMessage(handler) { handlers.add(handler); return () => handlers.delete(handler); },
    async receive(message) { for (const handler of handlers) await handler(message); },
  };
}

class WhatsAppLifecycle implements WhatsAppIntegration {
  private client: { initialize: () => Promise<void>; destroy: () => Promise<void>; sendMessage: (to: string, body: string) => Promise<unknown>; on: (event: string, handler: (...args: unknown[]) => void) => void } | undefined;
  private state: WhatsAppIntegration["status"];
  private readonly handlers = new Set<InboundHandler>();
  private registeredShutdown = false;

  constructor(private readonly enabled: boolean, private readonly sessionPath: string | undefined) {
    this.state = enabled ? WHATSAPP_CLIENT_STATE.INITIALIZING : WHATSAPP_CLIENT_STATE.DISABLED;
  }

  get status(): WhatsAppIntegration["status"] { return this.state; }
  get isEnabled(): boolean { return this.enabled; }

  async initialize(): Promise<void> {
    if (!this.enabled) { this.state = WHATSAPP_CLIENT_STATE.DISABLED; return; }
    if (this.client) return;
    this.state = WHATSAPP_CLIENT_STATE.INITIALIZING;
    try {
      const whatsapp = await import("whatsapp-web.js");
      const client = new whatsapp.Client({ authStrategy: new whatsapp.LocalAuth({ dataPath: this.sessionPath }) });
      this.client = client;
      client.on("qr", () => { this.state = WHATSAPP_CLIENT_STATE.QR; });
      client.on("ready", () => { this.state = WHATSAPP_CLIENT_STATE.READY; });
      client.on("disconnected", () => { this.state = WHATSAPP_CLIENT_STATE.DISCONNECTED; });
      client.on("auth_failure", () => { this.state = WHATSAPP_CLIENT_STATE.FAILED; });
      client.on("message", (message: unknown) => { void this.handleInbound(message); });
      if (!this.registeredShutdown) {
        this.registeredShutdown = true;
        process.once("SIGTERM", () => { void this.shutdown(); });
        process.once("SIGINT", () => { void this.shutdown(); });
      }
      await client.initialize();
    } catch (error) {
      this.state = WHATSAPP_CLIENT_STATE.FAILED;
      throw new DomainError(DOMAIN_ERROR_CODE.PROVIDER_UNAVAILABLE, error instanceof Error ? error.message : "No se pudo iniciar WhatsApp.", 503);
    }
  }

  private async handleInbound(raw: unknown): Promise<void> {
    if (!raw || typeof raw !== "object") return;
    const message = raw as { id?: { _serialized?: string }; from?: string; body?: string };
    if (!message.from || typeof message.body !== "string") return;
    const from = message.from.endsWith("@c.us") ? `+${message.from.slice(0, -5)}` : message.from;
    const inbound: WhatsAppInboundMessage = { id: message.id?._serialized ?? randomUUID(), from, body: message.body };
    for (const handler of this.handlers) await handler(inbound);
  }

  async shutdown(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.client = undefined;
    }
    this.state = WHATSAPP_CLIENT_STATE.DISCONNECTED;
  }

  async sendText(message: WhatsAppTextMessage): Promise<void> {
    if (!this.enabled || !this.client || this.state !== WHATSAPP_CLIENT_STATE.READY) {
      throw new DomainError(DOMAIN_ERROR_CODE.PROVIDER_UNAVAILABLE, "WhatsApp no está listo para enviar mensajes.", 503);
    }
    await this.client.sendMessage(`${message.to.replace(/^\+/, "")}@c.us`, message.body);
  }

  onMessage(handler: InboundHandler): () => void { this.handlers.add(handler); return () => this.handlers.delete(handler); }
}

export function createWhatsAppIntegration(): WhatsAppIntegration {
  const config = getBackendConfig();
  return new WhatsAppLifecycle(config.whatsappEnabled, config.whatsappSessionPath);
}

export type { WhatsAppInboundMessage, WhatsAppIntegration, WhatsAppTextMessage } from "./types";
