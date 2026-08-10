import { z } from "zod";

import { listComparableLaps } from "@/lib/application/sessions";
import { toErrorResponse } from "@/lib/api/errors";
import { OpenF1Error } from "@/lib/infrastructure/openf1/client";

const querySchema = z.object({
  driverId: z.string().min(1),
  driverBId: z.string().optional(),
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
      driverBId: url.searchParams.get("driverBId") ?? undefined,
    });

    if (!parsed.success) {
      throw new OpenF1Error("driverId is required", 400);
    }

    const result = await listComparableLaps(
      sessionId,
      parsed.data.driverId,
      parsed.data.driverBId,
    );
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
