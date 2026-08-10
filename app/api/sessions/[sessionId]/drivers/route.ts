import { listDrivers } from "@/lib/application/sessions";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await context.params;
    const drivers = await listDrivers(sessionId);
    return Response.json({ drivers });
  } catch (error) {
    return toErrorResponse(error);
  }
}
