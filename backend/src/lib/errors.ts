export const DOMAIN_ERROR_CODE = {
  VALIDATION: "validation",
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  PROVIDER_UNAVAILABLE: "provider_unavailable",
  CONTEXT_TOO_LARGE: "context_too_large",
} as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODE)[keyof typeof DOMAIN_ERROR_CODE];

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly status: number;
  readonly details?: Record<string, string>;

  constructor(code: DomainErrorCode, message: string, status = 400, details?: Record<string, string>) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

export function publicErrorResponse(error: unknown): { error: string; code: DomainErrorCode | "internal" } {
  if (isDomainError(error)) return { error: error.message, code: error.code };
  return { error: "No se pudo completar la solicitud.", code: "internal" };
}
