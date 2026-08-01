import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import { errorResponse } from "@/app/api/_utils";
import { listPublicProjects } from "@/domain/projects/public";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  try { return NextResponse.json({ projects: await listPublicProjects(getPrismaClient()) }); }
  catch (error) { return errorResponse(error); }
}
