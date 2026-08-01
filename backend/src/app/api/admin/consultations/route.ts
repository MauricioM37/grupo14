import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { createConsultation } from "@/domain/consultations/campaign";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireAdmin(request);
    const body = await request.json() as { projectId?: string; question?: string; options?: Array<{ key: string; label: string }>; opensAt?: string; closesAt?: string };
    const consultation = await createConsultation(getPrismaClient(), { projectId: body.projectId ?? "", question: body.question ?? "", options: body.options ?? [], opensAt: body.opensAt, closesAt: body.closesAt });
    return NextResponse.json(consultation, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
