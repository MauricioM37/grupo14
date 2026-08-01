import { NextResponse } from "next/server";

import { getBackendConfig } from "@/lib/config";
import { getWhatsAppRuntime } from "@/lib/runtime";

export const runtime = "nodejs";

export function GET(): NextResponse {
  const config = getBackendConfig();
  return NextResponse.json({
    status: "ok",
    service: "hakia-backend",
    scope: "participacion-ciudadana-v1",
    timestamp: new Date().toISOString(),
    integrations: { database: config.databaseUrl ? "configured" : "not_configured", groq: config.groqApiKey ? "configured" : "disabled", whatsapp: getWhatsAppRuntime().status },
  });
}
