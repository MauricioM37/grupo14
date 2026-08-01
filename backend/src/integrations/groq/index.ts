import { getBackendConfig } from "@/lib/config";

import { GROQ_INTEGRATION_STATUS, type GroqIntegration } from "./types";

const NOT_IMPLEMENTED_MESSAGE =
  "Groq integration is scaffold-only; no provider request is implemented yet.";

export function createGroqIntegration(): GroqIntegration {
  const config = getBackendConfig();

  return {
    status: GROQ_INTEGRATION_STATUS.STUB,
    isConfigured: Boolean(config.groqApiKey),
    async generateText(): Promise<never> {
      throw new Error(NOT_IMPLEMENTED_MESSAGE);
    },
  };
}

export type { GroqIntegration, GroqTextRequest, GroqTextResponse } from "./types";
