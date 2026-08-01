export const DEFAULT_BACKEND_CONFIG = {
  port: 3000,
  groqChatModel: "llama-3.3-70b-versatile",
  whatsappEnabled: false,
} as const;

export interface BackendConfig {
  port: number;
  databaseUrl: string | undefined;
  groqApiKey: string | undefined;
  groqChatModel: string;
  whatsappEnabled: boolean;
  whatsappSessionPath: string | undefined;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? DEFAULT_BACKEND_CONFIG.port);
  return Number.isInteger(port) && port > 0 ? port : DEFAULT_BACKEND_CONFIG.port;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

export function getBackendConfig(): BackendConfig {
  return {
    port: parsePort(process.env.PORT),
    databaseUrl: process.env.DATABASE_URL,
    groqApiKey: process.env.GROQ_API_KEY,
    groqChatModel: process.env.GROQ_CHAT_MODEL ?? DEFAULT_BACKEND_CONFIG.groqChatModel,
    whatsappEnabled: parseBoolean(process.env.WHATSAPP_ENABLED, DEFAULT_BACKEND_CONFIG.whatsappEnabled),
    whatsappSessionPath: process.env.WHATSAPP_SESSION_PATH,
  };
}
