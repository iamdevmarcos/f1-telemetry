"use client";

import type { Driver, Session } from "@/lib/domain/types";
import { formatRaceLabel, getRacePlaceName } from "@/lib/format";

interface ReplayFiltersProps {
  sessions: Session[];
  drivers: Driver[];
  sessionId: string;
  driverId: string;
  driverBId: string;
  loadingSessions: boolean;
  loadingDrivers: boolean;
  loadingReplay: boolean;
  onSessionChange: (sessionId: string) => void;
  onDriverChange: (driverId: string) => void;
  onDriverBChange: (driverId: string) => void;
  onLoad: () => void;
}

export function ReplayFilters({
  sessions,
  drivers,
  sessionId,
  driverId,
  driverBId,
  loadingSessions,
  loadingDrivers,
  loadingReplay,
  onSessionChange,
  onDriverChange,
  onDriverBChange,
  onLoad,
}: ReplayFiltersProps) {
  const canLoad =
    Boolean(sessionId && driverId) &&
    driverId !== driverBId &&
    !loadingReplay;

  const sessionsByYear = sessions.reduce<Map<number, Session[]>>((groups, session) => {
    const yearGroup = groups.get(session.year) ?? [];
    yearGroup.push(session);
    groups.set(session.year, yearGroup);
    return groups;
  }, new Map());

  const yearGroups = Array.from(sessionsByYear.entries()).sort(
    ([yearA], [yearB]) => yearB - yearA,
  );

  return (
    <aside className="panel animate-rise flex h-fit flex-col gap-4 p-4 md:sticky md:top-4">
      <div>
        <p className="field-label">Setup</p>
        <h2 className="font-[family-name:var(--font-teko)] text-3xl uppercase leading-none tracking-wide">
          Race replay
        </h2>
      </div>

      <label>
        <span className="field-label">Race</span>
        <select
          className="select-control"
          value={sessionId}
          disabled={loadingSessions}
          onChange={(event) => onSessionChange(event.target.value)}
        >
          <option value="">
            {loadingSessions ? "Loading races…" : "Choose race"}
          </option>
          {yearGroups.map(([year, yearSessions]) => (
            <optgroup key={year} label={String(year)}>
              {yearSessions.map((session) => (
                <option
                  key={session.id}
                  value={session.id}
                  disabled={session.isUpcoming}
                >
                  {formatRaceLabel({
                    placeName: getRacePlaceName(session, yearSessions),
                    dateStart: session.dateStart,
                  })}
                  {session.isUpcoming ? " · upcoming" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Driver</span>
        <select
          className="select-control"
          value={driverId}
          disabled={!sessionId || loadingDrivers}
          onChange={(event) => onDriverChange(event.target.value)}
        >
          <option value="">
            {loadingDrivers ? "Loading drivers…" : "Choose driver"}
          </option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.acronym} · {driver.teamName}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Driver B · optional</span>
        <select
          className="select-control"
          value={driverBId}
          disabled={!sessionId || loadingDrivers || !driverId}
          onChange={(event) => onDriverBChange(event.target.value)}
        >
          <option value="">Solo replay</option>
          {drivers.map((driver) => (
            <option
              key={`b-${driver.id}`}
              value={driver.id}
              disabled={driver.id === driverId}
            >
              {driver.acronym} · {driver.teamName}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="cta-button"
        disabled={!canLoad}
        onClick={onLoad}
      >
        {loadingReplay
          ? "Building replay…"
          : driverBId
            ? "Load battle replay"
            : "Load replay"}
      </button>

      <p className="text-xs leading-relaxed text-[var(--muted)]">
        Optional second driver puts both cars on track at the same race clock.
        Battle loads take longer (~40–70s).
      </p>
    </aside>
  );
}
