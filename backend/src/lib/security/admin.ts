import { NextRequest } from "next/server";

import { getBackendConfig } from "@/lib/config";
import { DomainError, DOMAIN_ERROR_CODE } from "@/lib/errors";
import { safeEqual } from "@/lib/security/crypto";

export function requireAdmin(request: NextRequest): void {
  const configured = getBackendConfig().adminBearerToken;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!configured || !token || !safeEqual(configured, token)) {
    throw new DomainError(DOMAIN_ERROR_CODE.UNAUTHORIZED, "Se requiere autorización de administrador.", 401);
  }
}
