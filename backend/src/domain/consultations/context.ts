import type { PrismaClient } from "@prisma/client";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";
import { createGroqIntegration, type GroqIntegration } from "@/integrations/groq";
import { utf8Length } from "@/domain/projects/extraction";

export async function answerProjectQuestion(
  prisma: PrismaClient,
  projectId: string,
  question: string,
  groq: GroqIntegration = createGroqIntegration(),
): Promise<string> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, status: "PUBLISHED" },
    include: {
      sources: { where: { status: "USABLE" }, orderBy: { createdAt: "desc" }, take: 1 },
      summaries: { where: { status: "APPROVED" }, orderBy: { generatedAt: "desc" }, take: 1 },
    },
  });
  if (!project) throw new DomainError(DOMAIN_ERROR_CODE.NOT_FOUND, "No se encontró el proyecto seleccionado.", 404);
  const source = project.sources[0];
  const summary = project.summaries[0];
  if (!source?.extractedText || !summary?.text) throw new DomainError(DOMAIN_ERROR_CODE.CONFLICT, "El proyecto aún no tiene contexto aprobado.");
  const contextSize = [project.title, project.description, source.extractedText, summary.text, question]
    .reduce((total, value) => total + utf8Length(value), 0);
  if (contextSize > getBackendConfig().directContextMaxChars) {
    throw new DomainError(DOMAIN_ERROR_CODE.CONTEXT_TOO_LARGE, "El contexto es demasiado extenso. Formula una pregunta sobre una sección más acotada.");
  }
  try {
    return (await groq.answerQuestion({ title: project.title, description: project.description, sourceText: source.extractedText, summary: summary.text, question })).text;
  } catch (error) {
    if (error instanceof DomainError && error.code === DOMAIN_ERROR_CODE.PROVIDER_UNAVAILABLE) {
      return `El proveedor de respuestas no está disponible temporalmente. Resumen aprobado:\n${summary.text}`;
    }
    throw error;
  }
}
