import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import { errorResponse } from "@/app/api/_utils";
import { revokeSubscription } from "@/domain/consent/service";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    return NextResponse.json(await revokeSubscription(getPrismaClient(), { number: typeof body.number === "string" ? body.number : "", categorySlugs: Array.isArray(body.categorySlugs) ? body.categorySlugs.filter((value): value is string => typeof value === "string") : undefined, source: "portal" }));
  } catch (error) { return errorResponse(error); }
}
