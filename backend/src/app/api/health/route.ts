import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET(): NextResponse {
  return NextResponse.json({
    status: "ok",
    service: "hakia-backend",
    scope: "scaffold",
    timestamp: new Date().toISOString(),
    integrations: {
      database: "not_checked",
      groq: "stub",
      whatsapp: "stub",
    },
  });
}
