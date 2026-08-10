import { NextResponse } from "next/server";

import { OpenF1Error } from "@/lib/infrastructure/openf1/client";

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof OpenF1Error) {
    const status = error.status && error.status >= 400 ? error.status : 502;
    return NextResponse.json({ error: error.message }, { status });
  }

  console.error(error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}
