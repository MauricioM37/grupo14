import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { getWhatsAppRuntime } from "@/lib/runtime";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try { requireAdmin(request); const whatsapp = getWhatsAppRuntime(); return NextResponse.json({ enabled: whatsapp.isEnabled, status: whatsapp.status }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try { requireAdmin(request); const whatsapp = getWhatsAppRuntime(); await whatsapp.initialize(); return NextResponse.json({ enabled: whatsapp.isEnabled, status: whatsapp.status }); }
  catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try { requireAdmin(request); const whatsapp = getWhatsAppRuntime(); await whatsapp.shutdown(); return NextResponse.json({ enabled: whatsapp.isEnabled, status: whatsapp.status }); }
  catch (error) { return errorResponse(error); }
}
