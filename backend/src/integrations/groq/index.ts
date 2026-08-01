import Groq from "groq-sdk";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

import { GROQ_INTEGRATION_STATUS, type GroqIntegration, type GroqQuestionRequest, type GroqSummaryRequest } from "./types";

function textFromCompletion(content: string | null | undefined): string {
  if (!content?.trim()) throw new DomainError(DOMAIN_ERROR_CODE.PROVIDER_UNAVAILABLE, "Groq no devolvió contenido.", 503);
  return content.trim();
}

function createConfiguredClient(): Groq | undefined {
  const key = getBackendConfig().groqApiKey;
  return key ? new Groq({ apiKey: key }) : undefined;
}

export function createGroqIntegration(): GroqIntegration {
  const client = createConfiguredClient();
  const config = getBackendConfig();
  const status = client ? GROQ_INTEGRATION_STATUS.CONFIGURED : GROQ_INTEGRATION_STATUS.FALLBACK;

  async function complete(system: string, user: string): Promise<string> {
    if (!client) throw new DomainError(DOMAIN_ERROR_CODE.PROVIDER_UNAVAILABLE, "El proveedor de IA no está configurado.", 503);
    const response = await client.chat.completions.create({
      model: config.groqChatModel,
      temperature: 0.1,
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return textFromCompletion(response.choices[0]?.message?.content);
  }

  return {
    status,
    isConfigured: Boolean(client),
    async generateText(request) {
      return { text: await complete("Responde en español claro y no inventes información.", request.prompt) };
    },
    async summarize(request) {
      return {
        text: await complete(
          "Eres un asistente de participación ciudadana. Resume en español claro, separa hechos del documento de cualquier interpretación, no prometas efectos legales y no inventes datos.",
          `Título: ${request.title}\nDescripción: ${request.description}\nVersión de plantilla: ${request.promptVersion}\nDocumento fuente:\n${request.sourceText}`,
        ),
      };
    },
    async answerQuestion(request) {
      return {
        text: await complete(
          "Responde en español claro usando exclusivamente el contexto proporcionado. Si la respuesta no está sustentada, dilo explícitamente. No inventes efectos legales, fechas, costos, requisitos ni promesas. Recuerda que esto es información ciudadana no vinculante.",
          `Proyecto: ${request.title}\nDescripción: ${request.description}\nResumen aprobado:\n${request.summary}\nFuente:\n${request.sourceText}\nPregunta: ${request.question}`,
        ),
      };
    },
  };
}

export function createFakeGroqIntegration(overrides: Partial<GroqIntegration> = {}): GroqIntegration {
  return {
    status: GROQ_INTEGRATION_STATUS.CONFIGURED,
    isConfigured: true,
    async generateText(request) { return { text: `Respuesta de prueba: ${request.prompt}` }; },
    async summarize(request) { return { text: `Resumen de prueba: ${request.title}\n${request.sourceText.slice(0, 500)}` }; },
    async answerQuestion(request) { return { text: `Respuesta de prueba sobre ${request.title}: ${request.question}` }; },
    ...overrides,
  };
}

export type {
  GroqIntegration,
  GroqQuestionRequest,
  GroqSummaryRequest,
  GroqTextRequest,
  GroqTextResponse,
} from "./types";
