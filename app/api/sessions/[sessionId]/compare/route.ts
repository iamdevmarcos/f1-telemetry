import { z } from "zod";

import { compareDrivers } from "@/lib/application/compare";
import { toErrorResponse } from "@/lib/api/errors";
import { OpenF1Error } from "@/lib/infrastructure/openf1/client";

export const maxDuration = 60;

const querySchema = z.object({
  driverA: z.string().min(1),
  driverB: z.string().min(1),
  lap: z.coerce.number().int().positive(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      driverA: url.searchParams.get("driverA") ?? undefined,
      driverB: url.searchParams.get("driverB") ?? undefined,
      lap: url.searchParams.get("lap") ?? undefined,
    });

    if (!parsed.success) {
      throw new OpenF1Error("driverA, driverB and lap are required", 400);
    }

    const result = await compareDrivers({
      sessionId,
      driverAId: parsed.data.driverA,
      driverBId: parsed.data.driverB,
      lapNumber: parsed.data.lap,
    });

    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
