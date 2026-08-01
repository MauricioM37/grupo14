import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { publishProject, unpublishProject } from "@/domain/projects/service";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try { requireAdmin(request); await publishProject(getPrismaClient(), (await params).id); return NextResponse.json({ published: true }); }
  catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try { requireAdmin(request); await unpublishProject(getPrismaClient(), (await params).id); return NextResponse.json({ published: false }); }
  catch (error) { return errorResponse(error); }
}
