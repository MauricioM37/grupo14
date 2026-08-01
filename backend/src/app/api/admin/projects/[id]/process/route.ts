import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { processProject } from "@/domain/projects/service";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try { requireAdmin(request); return NextResponse.json(await processProject(getPrismaClient(), (await params).id)); }
  catch (error) { return errorResponse(error); }
}
