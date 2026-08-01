import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { reviewProjectSummary } from "@/domain/projects/service";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    requireAdmin(request);
    const body = await request.json() as { summaryId?: string };
    if (!body.summaryId) return NextResponse.json({ error: "summaryId es obligatorio" }, { status: 400 });
    await reviewProjectSummary(getPrismaClient(), (await params).id, body.summaryId, "admin-bearer");
    return NextResponse.json({ accepted: true });
  } catch (error) { return errorResponse(error); }
}
