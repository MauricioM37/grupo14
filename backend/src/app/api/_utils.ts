import { NextResponse } from "next/server";

import { isDomainError, publicErrorResponse } from "@/lib/errors";

export function errorResponse(error: unknown): NextResponse {
  const body = publicErrorResponse(error);
  return NextResponse.json(body, { status: isDomainError(error) ? error.status : 500 });
}
