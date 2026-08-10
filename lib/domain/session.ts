import type { Session } from "@/lib/domain/types";

export function isRaceUpcoming(session: Pick<Session, "dateStart">): boolean {
  const startMs = Date.parse(session.dateStart);
  if (!Number.isFinite(startMs)) {
    return true;
  }

  return startMs > Date.now();
}

export function isRaceAvailable(session: Pick<Session, "dateStart">): boolean {
  return !isRaceUpcoming(session);
}
