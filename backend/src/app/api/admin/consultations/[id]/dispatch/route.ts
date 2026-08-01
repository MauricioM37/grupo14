import { NextRequest, NextResponse } from "next/server";

import { dispatchConsultation } from "@/domain/consultations/campaign";
import { errorResponse } from "@/app/api/_utils";
import { getPrismaClient } from "@/lib/prisma";
import { getWhatsAppRuntime } from "@/lib/runtime";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    requireAdmin(request);
    const whatsapp = getWhatsAppRuntime();
    if (!whatsapp.isEnabled) {
      return NextResponse.json({ error: "WhatsApp está deshabilitado; activa el adaptador falso para el demo local." }, { status: 503 });
    }
    await whatsapp.initialize();
    const result = await dispatchConsultation(getPrismaClient(), (await params).id, whatsapp);
    return NextResponse.json(result);
  } catch (error) { return errorResponse(error); }
}
