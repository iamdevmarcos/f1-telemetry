import { z } from "zod";

import { getRaceReplay } from "@/lib/application/replay";
import { toErrorResponse } from "@/lib/api/errors";
import { OpenF1Error } from "@/lib/infrastructure/openf1/client";

export const maxDuration = 60;

const querySchema = z.object({
  driverId: z.string().min(1),
  driverBId: z.string().min(1).optional(),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const url = new URL(request.url);
    const driverBParam = url.searchParams.get("driverBId");
    const parsed = querySchema.safeParse({
      driverId: url.searchParams.get("driverId") ?? undefined,
      driverBId: driverBParam && driverBParam.length > 0 ? driverBParam : undefined,
    });

    if (!parsed.success) {
      throw new OpenF1Error("driverId is required", 400);
    }

    const replay = await getRaceReplay({
      sessionId,
      driverId: parsed.data.driverId,
      driverBId: parsed.data.driverBId,
    });

    return Response.json({ replay });
  } catch (error) {
    return toErrorResponse(error);
  }
}
