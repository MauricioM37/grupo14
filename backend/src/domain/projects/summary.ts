import type { PrismaClient } from "@prisma/client";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";
import { createGroqIntegration, type GroqIntegration } from "@/integrations/groq";
import { utf8Length } from "./extraction";

export const SUMMARY_PROMPT_VERSION = "citizen-summary-v1";

export interface SummaryInputs {
  title: string;
  description: string;
  sourceText: string;
  sourceFingerprint: string;
}

export async function getOrCreateSummary(
  prisma: PrismaClient,
  projectId: string,
  inputs: SummaryInputs,
  groq: GroqIntegration = createGroqIntegration(),
): Promise<{ text: string; cached: boolean; id: string }> {
  const config = getBackendConfig();
  if (utf8Length(inputs.sourceText) > config.directContextMaxChars) {
    throw new DomainError(DOMAIN_ERROR_CODE.CONTEXT_TOO_LARGE, "El contexto del proyecto supera el máximo permitido.");
  }
  const modelConfiguration = `${config.groqChatModel}:${groq.isConfigured ? "configured" : "fallback"}`;
  const cached = await prisma.summary.findUnique({
    where: {
      projectId_sourceFingerprint_promptVersion_modelConfiguration: {
        projectId,
        sourceFingerprint: inputs.sourceFingerprint,
        promptVersion: SUMMARY_PROMPT_VERSION,
        modelConfiguration,
      },
    },
  });
  if (cached?.status === "APPROVED" || cached?.status === "GENERATED") {
    return { text: cached.text, cached: true, id: cached.id };
  }

  try {
    const response = await groq.summarize({
      title: inputs.title,
      description: inputs.description,
      sourceText: inputs.sourceText,
      promptVersion: SUMMARY_PROMPT_VERSION,
    });
    const summary = await prisma.summary.upsert({
      where: {
        projectId_sourceFingerprint_promptVersion_modelConfiguration: {
          projectId,
          sourceFingerprint: inputs.sourceFingerprint,
          promptVersion: SUMMARY_PROMPT_VERSION,
          modelConfiguration,
        },
      },
      create: {
        projectId,
        sourceFingerprint: inputs.sourceFingerprint,
        promptVersion: SUMMARY_PROMPT_VERSION,
        modelConfiguration,
        text: response.text,
        status: "GENERATED",
      },
      update: { text: response.text, status: "GENERATED", errorMessage: null },
    });
    return { text: summary.text, cached: false, id: summary.id };
  } catch (error) {
    await prisma.summary.upsert({
      where: {
        projectId_sourceFingerprint_promptVersion_modelConfiguration: {
          projectId,
          sourceFingerprint: inputs.sourceFingerprint,
          promptVersion: SUMMARY_PROMPT_VERSION,
          modelConfiguration,
        },
      },
      create: {
        projectId,
        sourceFingerprint: inputs.sourceFingerprint,
        promptVersion: SUMMARY_PROMPT_VERSION,
        modelConfiguration,
        text: "",
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Groq no disponible",
      },
      update: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Groq no disponible" },
    });
    throw error;
  }
}

export async function approveSummary(prisma: PrismaClient, summaryId: string, adminId: string): Promise<void> {
  const summary = await prisma.summary.findUnique({ where: { id: summaryId } });
  if (!summary || summary.status === "FAILED" || !summary.text.trim()) {
    throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "El resumen no está disponible para revisión.");
  }
  await prisma.summary.update({ where: { id: summaryId }, data: { status: "APPROVED", approvedAt: new Date(), approvedBy: adminId } });
}
