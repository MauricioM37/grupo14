import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import { errorResponse } from "@/app/api/_utils";
import { getPublicProject } from "@/domain/projects/public";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try { return NextResponse.json(await getPublicProject(getPrismaClient(), (await params).id)); }
  catch (error) { return errorResponse(error); }
}
