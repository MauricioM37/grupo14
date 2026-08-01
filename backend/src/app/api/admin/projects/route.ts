import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/app/api/_utils";
import { createProject } from "@/domain/projects/service";
import { getPrismaClient } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    requireAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "El campo file debe ser un PDF." }, { status: 400 });
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Solo se aceptan PDF." }, { status: 400 });
    const categorySlugs = String(form.get("categorySlugs") ?? "").split(",").map((slug) => slug.trim()).filter(Boolean);
    const project = await createProject(getPrismaClient(), { title: String(form.get("title") ?? ""), description: String(form.get("description") ?? ""), sourceDate: String(form.get("sourceDate") ?? "") || undefined, categorySlugs, file: Buffer.from(await file.arrayBuffer()), originalName: file.name });
    return NextResponse.json({ id: project.id, status: project.status }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try { requireAdmin(request); return NextResponse.json({ projects: await getPrismaClient().project.findMany({ include: { sources: true, summaries: true, categories: true }, orderBy: { createdAt: "desc" } }) }); }
  catch (error) { return errorResponse(error); }
}
