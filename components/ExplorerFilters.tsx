"use client";

import type { Driver, Lap, Session } from "@/lib/domain/types";
import { formatRaceLabel, getRacePlaceName } from "@/lib/format";

interface ExplorerFiltersProps {
  sessions: Session[];
  drivers: Driver[];
  laps: Lap[];
  sessionId: string;
  driverAId: string;
  driverBId: string;
  lapNumber: string;
  loadingSessions: boolean;
  loadingDrivers: boolean;
  loadingLaps: boolean;
  comparing: boolean;
  onSessionChange: (sessionId: string) => void;
  onDriverAChange: (driverId: string) => void;
  onDriverBChange: (driverId: string) => void;
  onLapChange: (lap: string) => void;
  onCompare: () => void;
}

export function ExplorerFilters({
  sessions,
  drivers,
  laps,
  sessionId,
  driverAId,
  driverBId,
  lapNumber,
  loadingSessions,
  loadingDrivers,
  loadingLaps,
  comparing,
  onSessionChange,
  onDriverAChange,
  onDriverBChange,
  onLapChange,
  onCompare,
}: ExplorerFiltersProps) {
  const canCompare =
    Boolean(sessionId && driverAId && driverBId && lapNumber) &&
    driverAId !== driverBId &&
    !comparing;

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
          Compare lap
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
        <span className="field-label">Driver A</span>
        <select
          className="select-control"
          value={driverAId}
          disabled={!sessionId || loadingDrivers}
          onChange={(event) => onDriverAChange(event.target.value)}
        >
          <option value="">
            {loadingDrivers ? "Loading drivers…" : "Choose driver A"}
          </option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.acronym} · {driver.teamName}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Driver B</span>
        <select
          className="select-control"
          value={driverBId}
          disabled={!sessionId || loadingDrivers}
          onChange={(event) => onDriverBChange(event.target.value)}
        >
          <option value="">
            {loadingDrivers ? "Loading drivers…" : "Choose driver B"}
          </option>
          {drivers.map((driver) => (
            <option key={`b-${driver.id}`} value={driver.id}>
              {driver.acronym} · {driver.teamName}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Lap</span>
        <select
          className="select-control"
          value={lapNumber}
          disabled={!driverAId || loadingLaps}
          onChange={(event) => onLapChange(event.target.value)}
        >
          <option value="">
            {loadingLaps ? "Loading laps…" : "Choose lap"}
          </option>
          {laps.map((lap) => (
            <option key={lap.lapNumber} value={String(lap.lapNumber)}>
              Lap {lap.lapNumber}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="cta-button"
        disabled={!canCompare}
        onClick={onCompare}
      >
        {comparing ? "Loading telemetry…" : "Load comparison"}
      </button>
    </aside>
  );
}
