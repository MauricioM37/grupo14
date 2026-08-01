import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { setConsultationStatus } from "@/domain/consultations/campaign";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    requireAdmin(request);
    const body = await request.json() as { status?: unknown };
    if (body.status !== "OPEN" && body.status !== "CLOSED") {
      return NextResponse.json({ error: "status debe ser OPEN o CLOSED" }, { status: 400 });
    }
    await setConsultationStatus(getPrismaClient(), (await params).id, body.status);
    return NextResponse.json({ status: body.status });
  } catch (error) { return errorResponse(error); }
}
