import { NextResponse } from "next/server";

import { getPrismaClient } from "@/lib/prisma";
import { errorResponse } from "@/app/api/_utils";
import { createOrUpdateSubscription } from "@/domain/consent/service";
import { getBackendConfig } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const config = getBackendConfig();
    const result = await createOrUpdateSubscription(getPrismaClient(), {
      number: typeof body.number === "string" ? body.number : "",
      categorySlugs: Array.isArray(body.categorySlugs) ? body.categorySlugs.filter((value): value is string => typeof value === "string") : [],
      consentAccepted: body.consentAccepted === true,
      consentTextVersion: typeof body.consentTextVersion === "string" ? body.consentTextVersion : "",
      consentText: typeof body.consentText === "string" ? body.consentText : "",
      source: typeof body.source === "string" ? body.source : "portal",
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) { return errorResponse(error); }
}
