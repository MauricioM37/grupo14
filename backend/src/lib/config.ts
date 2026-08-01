export const DEFAULT_BACKEND_CONFIG = {
  port: 3000,
  groqChatModel: "llama-3.3-70b-versatile",
  whatsappEnabled: false,
  directContextMaxChars: 80_000,
  minExtractedChars: 80,
  consentTextVersion: "v1",
  consentText:
    "Acepto recibir consultas ciudadanas no vinculantes por WhatsApp, con una frecuencia limitada. Mi número se protege y puedo cancelar los mensajes en cualquier momento respondiendo BAJA.",
} as const;

export interface BackendConfig {
  port: number;
  databaseUrl: string | undefined;
  groqApiKey: string | undefined;
  groqChatModel: string;
  whatsappEnabled: boolean;
  whatsappFake: boolean;
  whatsappSessionPath: string | undefined;
  adminBearerToken: string | undefined;
  dataEncryptionKey: string | undefined;
  numberHmacKey: string | undefined;
  pdfStoragePath: string;
  directContextMaxChars: number;
  minExtractedChars: number;
  consentTextVersion: string;
  consentText: string;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? DEFAULT_BACKEND_CONFIG.port);
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_BACKEND_CONFIG.port;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getBackendConfig(): BackendConfig {
  return {
    port: parsePort(process.env.PORT),
    databaseUrl: resolveDatabaseUrl(),
    groqApiKey: process.env.GROQ_API_KEY,
    groqChatModel: process.env.GROQ_CHAT_MODEL ?? DEFAULT_BACKEND_CONFIG.groqChatModel,
    whatsappEnabled: parseBoolean(process.env.WHATSAPP_ENABLED, DEFAULT_BACKEND_CONFIG.whatsappEnabled),
    whatsappFake: parseBoolean(process.env.WHATSAPP_FAKE, false),
    whatsappSessionPath: process.env.WHATSAPP_SESSION_PATH,
    adminBearerToken: process.env.ADMIN_BEARER_TOKEN,
    dataEncryptionKey: process.env.DATA_ENCRYPTION_KEY,
    numberHmacKey: process.env.NUMBER_HMAC_KEY,
    pdfStoragePath: process.env.PDF_STORAGE_PATH ?? "./.data/private-pdfs",
    directContextMaxChars: parsePositiveInteger(
      process.env.DIRECT_CONTEXT_MAX_CHARS,
      DEFAULT_BACKEND_CONFIG.directContextMaxChars,
    ),
    minExtractedChars: parsePositiveInteger(process.env.MIN_EXTRACTED_CHARS, DEFAULT_BACKEND_CONFIG.minExtractedChars),
    consentTextVersion: process.env.CONSENT_TEXT_VERSION ?? DEFAULT_BACKEND_CONFIG.consentTextVersion,
    consentText: process.env.CONSENT_TEXT ?? DEFAULT_BACKEND_CONFIG.consentText,
  };
}
import { resolveDatabaseUrl } from "@/lib/database-url";
