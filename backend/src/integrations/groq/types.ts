export const GROQ_INTEGRATION_STATUS = {
  CONFIGURED: "configured",
  FALLBACK: "fallback",
} as const;

export type GroqIntegrationStatus = (typeof GROQ_INTEGRATION_STATUS)[keyof typeof GROQ_INTEGRATION_STATUS];

export interface GroqTextRequest {
  prompt: string;
}

export interface GroqTextResponse {
  text: string;
}

export interface GroqSummaryRequest {
  title: string;
  description: string;
  sourceText: string;
  promptVersion: string;
}

export interface GroqQuestionRequest {
  title: string;
  description: string;
  sourceText: string;
  summary: string;
  question: string;
}

export interface GroqIntegration {
  status: GroqIntegrationStatus;
  isConfigured: boolean;
  generateText(request: GroqTextRequest): Promise<GroqTextResponse>;
  summarize(request: GroqSummaryRequest): Promise<GroqTextResponse>;
  answerQuestion(request: GroqQuestionRequest): Promise<GroqTextResponse>;
}
