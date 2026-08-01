import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { ensureCategories } from "@/domain/consent/service";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try { requireAdmin(request); return NextResponse.json({ categories: await getPrismaClient().category.findMany({ where: { active: true }, orderBy: { name: "asc" } }) }); }
  catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireAdmin(request);
    const body = await request.json() as { slug?: string; name?: string };
    if (!body.slug || !body.name) return NextResponse.json({ error: "slug y name son obligatorios" }, { status: 400 });
    await ensureCategories(getPrismaClient(), [{ slug: body.slug, name: body.name }]);
    return NextResponse.json({ accepted: true }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
