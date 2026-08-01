import { createHash } from "node:crypto";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";

export interface ExtractedPdf {
  text: string;
  fingerprint: string;
  characters: number;
}

export function utf8Length(value: string): number {
  return Buffer.byteLength(value, "utf8");
}

function decodePdfString(value: string): string {
  const decoded = value
    .replace(/\\([\\()])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([0-7]{1,3})/g, (_match, octal: string) => String.fromCharCode(Number.parseInt(octal, 8)));
  return /Ã|Â/.test(decoded) ? Buffer.from(decoded, "latin1").toString("utf8") : decoded;
}

function textFromPdfOperators(source: string): string {
  const fragments: string[] = [];
  const literalPattern = /\((?:\\.|[^\\)])*\)\s*T[jJ]/g;
  for (const match of source.matchAll(literalPattern)) {
    const literal = match[0].replace(/\s*T[jJ]$/, "");
    fragments.push(decodePdfString(literal.slice(1, -1)));
  }
  const arrayPattern = /\[([\s\S]*?)\]\s*TJ/g;
  for (const match of source.matchAll(arrayPattern)) {
    const literals = match[1].match(/\((?:\\.|[^\\)])*\)/g) ?? [];
    fragments.push(literals.map((literal) => decodePdfString(literal.slice(1, -1))).join(""));
  }
  return fragments.join(" ");
}

export function normalizeExtractedText(text: string): string {
  return text.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim();
}

export function extractPdfText(bytes: Buffer): ExtractedPdf {
  if (bytes.length < 5 || bytes.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new DomainError(DOMAIN_ERROR_CODE.VALIDATION, "El archivo debe ser un PDF válido.");
  }
  const fingerprint = createHash("sha256").update(bytes).digest("hex");
  const text = normalizeExtractedText(textFromPdfOperators(bytes.toString("latin1")));
  const minimum = getBackendConfig().minExtractedChars;
  if (utf8Length(text) < minimum) {
    throw new DomainError(
      DOMAIN_ERROR_CODE.VALIDATION,
      `El PDF no contiene suficiente texto seleccionable (mínimo ${minimum} caracteres). Los PDF escaneados no están soportados en v1.`,
    );
  }
  if (utf8Length(text) > getBackendConfig().directContextMaxChars) {
    throw new DomainError(
      DOMAIN_ERROR_CODE.CONTEXT_TOO_LARGE,
      `El texto extraído supera el máximo de ${getBackendConfig().directContextMaxChars} caracteres.`,
    );
  }
  return { text, fingerprint, characters: utf8Length(text) };
}
