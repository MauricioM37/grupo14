import { NextRequest, NextResponse } from "next/server";

import { handleInboundMessage } from "@/domain/consultations/conversation";
import { errorResponse } from "@/app/api/_utils";
import { getBackendConfig } from "@/lib/config";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireAdmin(request);
    if (!getBackendConfig().whatsappFake) {
      return NextResponse.json({ error: "La ruta de inbound falso solo está disponible con WHATSAPP_FAKE=true." }, { status: 404 });
    }
    const body = await request.json() as { from?: unknown; message?: unknown; eventKey?: unknown };
    if (typeof body.from !== "string" || typeof body.message !== "string") {
      return NextResponse.json({ error: "from y message son obligatorios." }, { status: 400 });
    }
    const reply = await handleInboundMessage(getPrismaClient(), {
      from: body.from,
      body: body.message,
      eventKey: typeof body.eventKey === "string" && body.eventKey ? body.eventKey : `fake-inbound:${Date.now()}`,
    });
    return NextResponse.json(reply);
  } catch (error) { return errorResponse(error); }
}
