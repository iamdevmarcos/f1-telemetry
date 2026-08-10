import { listSessions } from "@/lib/application/sessions";
import { toErrorResponse } from "@/lib/api/errors";

export async function GET() {
  try {
    const sessions = await listSessions();
    return Response.json({ sessions });
  } catch (error) {
    return toErrorResponse(error);
  }
}
