import { NextResponse } from "next/server";

import { titleForOpenF1Code } from "@/lib/api/openf1-messages";
import { OpenF1Error } from "@/lib/infrastructure/openf1/client";

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof OpenF1Error) {
    const status = error.status && error.status >= 400 ? error.status : 502;
    const title = titleForOpenF1Code(error.code);

    return NextResponse.json(
      {
        error: error.message,
        ...(error.code ? { code: error.code } : {}),
        ...(title ? { title } : {}),
      },
      { status },
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}
