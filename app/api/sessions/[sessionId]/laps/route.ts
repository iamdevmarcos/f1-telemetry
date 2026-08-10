import { z } from "zod";

import { listLaps } from "@/lib/application/sessions";
import { toErrorResponse } from "@/lib/api/errors";
import { OpenF1Error } from "@/lib/infrastructure/openf1/client";

const querySchema = z.object({
  driverId: z.string().min(1),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      driverId: url.searchParams.get("driverId") ?? undefined,
    });

    if (!parsed.success) {
      throw new OpenF1Error("driverId is required", 400);
    }

    const laps = await listLaps(sessionId, parsed.data.driverId);
    return Response.json({ laps });
  } catch (error) {
    return toErrorResponse(error);
  }
}
