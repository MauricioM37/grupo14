export const GROQ_INTEGRATION_STATUS = {
  STUB: "stub",
} as const;

export type GroqIntegrationStatus = (typeof GROQ_INTEGRATION_STATUS)[keyof typeof GROQ_INTEGRATION_STATUS];

export interface GroqTextRequest {
  prompt: string;
}

export interface GroqTextResponse {
  text: string;
}

export interface GroqIntegration {
  status: GroqIntegrationStatus;
  isConfigured: boolean;
  generateText(request: GroqTextRequest): Promise<GroqTextResponse>;
}
