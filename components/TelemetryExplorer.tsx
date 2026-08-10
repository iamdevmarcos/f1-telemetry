"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { ExplorerFilters } from "@/components/ExplorerFilters";
import { RaceReplayPlayer } from "@/components/RaceReplayPlayer";
import { ReplayFilters } from "@/components/ReplayFilters";
import { TelemetryCharts } from "@/components/TelemetryCharts";
import type {
  CompareResult,
  Driver,
  Lap,
  RaceReplay,
  Session,
} from "@/lib/domain/types";
import { formatSessionRaceLabel } from "@/lib/format";

type ExplorerMode = "compare" | "replay";

type ExplorerError = {
  title?: string;
  message: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json()) as T & {
    error?: string;
    title?: string;
  };

  if (!response.ok) {
    throw {
      title: payload.title,
      message: payload.error || "Request failed",
    } satisfies ExplorerError;
  }

  return payload;
}

function toExplorerError(
  loadError: unknown,
  fallbackMessage: string,
): ExplorerError {
  if (
    typeof loadError === "object" &&
    loadError !== null &&
    "message" in loadError &&
    typeof loadError.message === "string"
  ) {
    return {
      title:
        "title" in loadError && typeof loadError.title === "string"
          ? loadError.title
          : undefined,
      message: loadError.message,
    };
  }

  if (loadError instanceof Error) {
    return { message: loadError.message };
  }

  return { message: fallbackMessage };
}

export function TelemetryExplorer() {
  const [mode, setMode] = useState<ExplorerMode>("replay");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [driverAId, setDriverAId] = useState("");
  const [driverBId, setDriverBId] = useState("");
  const [replayDriverId, setReplayDriverId] = useState("");
  const [replayDriverBId, setReplayDriverBId] = useState("");
  const [lapNumber, setLapNumber] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [replay, setReplay] = useState<RaceReplay | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [loadingLaps, setLoadingLaps] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [loadingReplay, setLoadingReplay] = useState(false);
  const [error, setError] = useState<ExplorerError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      setLoadingSessions(true);
      setError(null);
      try {
        const data = await fetchJson<{ sessions: Session[] }>("/api/sessions");
        if (!cancelled) {
          setSessions(data.sessions);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(toExplorerError(loadError, "Failed to load sessions"));
        }
      } finally {
        if (!cancelled) {
          setLoadingSessions(false);
        }
      }
    }

    void loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === sessionId),
    [sessions, sessionId],
  );

  const contextLabel = selectedSession
    ? `${selectedSession.year} · ${formatSessionRaceLabel(selectedSession, sessions)}`
    : undefined;

  const handleSessionChange = useCallback(async (nextSessionId: string) => {
    setSessionId(nextSessionId);
    setDriverAId("");
    setDriverBId("");
    setReplayDriverId("");
    setReplayDriverBId("");
    setLapNumber("");
    setLaps([]);
    setDrivers([]);
    setResult(null);
    setReplay(null);
    setError(null);

    if (!nextSessionId) {
      return;
    }

    setLoadingDrivers(true);
    try {
      const data = await fetchJson<{ drivers: Driver[] }>(
        `/api/sessions/${nextSessionId}/drivers`,
      );
      setDrivers(data.drivers);
    } catch (loadError) {
      setError(toExplorerError(loadError, "Failed to load drivers"));
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  const handleDriverAChange = useCallback(
    async (nextDriverId: string) => {
      setDriverAId(nextDriverId);
      setLapNumber("");
      setLaps([]);
      setResult(null);
      setError(null);

      if (!sessionId || !nextDriverId) {
        return;
      }

      setLoadingLaps(true);
      try {
        const data = await fetchJson<{ laps: Lap[] }>(
          `/api/sessions/${sessionId}/laps?driverId=${nextDriverId}`,
        );
        setLaps(data.laps);
      } catch (loadError) {
        setError(toExplorerError(loadError, "Failed to load laps"));
      } finally {
        setLoadingLaps(false);
      }
    },
    [sessionId],
  );

  const handleCompare = useCallback(async () => {
    if (!sessionId || !driverAId || !driverBId || !lapNumber) {
      return;
    }

    setComparing(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchJson<CompareResult>(
        `/api/sessions/${sessionId}/compare?driverA=${driverAId}&driverB=${driverBId}&lap=${lapNumber}`,
      );
      setResult(data);
    } catch (loadError) {
      setError(toExplorerError(loadError, "Failed to compare drivers"));
    } finally {
      setComparing(false);
    }
  }, [sessionId, driverAId, driverBId, lapNumber]);

  const handleLoadReplay = useCallback(async () => {
    if (!sessionId || !replayDriverId) {
      return;
    }

    setLoadingReplay(true);
    setError(null);
    setReplay(null);

    try {
      const params = new URLSearchParams({ driverId: replayDriverId });
      if (replayDriverBId) {
        params.set("driverBId", replayDriverBId);
      }
      const data = await fetchJson<{ replay: RaceReplay }>(
        `/api/sessions/${sessionId}/replay?${params.toString()}`,
      );
      setReplay(data.replay);
    } catch (loadError) {
      setError(toExplorerError(loadError, "Failed to load race replay"));
    } finally {
      setLoadingReplay(false);
    }
  }, [sessionId, replayDriverId, replayDriverBId]);

  return (
    <AppShell
      contextLabel={contextLabel}
      modeLabel={mode === "compare" ? "Lap comparison" : "Race replay"}
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <ModeButton
          active={mode === "replay"}
          label="Race replay"
          onClick={() => {
            setMode("replay");
            setError(null);
          }}
        />
        <ModeButton
          active={mode === "compare"}
          label="Compare lap"
          onClick={() => {
            setMode("compare");
            setError(null);
          }}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        {mode === "compare" ? (
          <ExplorerFilters
            sessions={sessions}
            drivers={drivers}
            laps={laps}
            sessionId={sessionId}
            driverAId={driverAId}
            driverBId={driverBId}
            lapNumber={lapNumber}
            loadingSessions={loadingSessions}
            loadingDrivers={loadingDrivers}
            loadingLaps={loadingLaps}
            comparing={comparing}
            onSessionChange={(value) => {
              void handleSessionChange(value);
            }}
            onDriverAChange={(value) => {
              void handleDriverAChange(value);
            }}
            onDriverBChange={setDriverBId}
            onLapChange={setLapNumber}
            onCompare={() => {
              void handleCompare();
            }}
          />
        ) : (
          <ReplayFilters
            sessions={sessions}
            drivers={drivers}
            sessionId={sessionId}
            driverId={replayDriverId}
            driverBId={replayDriverBId}
            loadingSessions={loadingSessions}
            loadingDrivers={loadingDrivers}
            loadingReplay={loadingReplay}
            onSessionChange={(value) => {
              void handleSessionChange(value);
            }}
            onDriverChange={(value) => {
              setReplayDriverId(value);
              if (value === replayDriverBId) {
                setReplayDriverBId("");
              }
            }}
            onDriverBChange={setReplayDriverBId}
            onLoad={() => {
              void handleLoadReplay();
            }}
          />
        )}

        <div className="space-y-4">
          {error ? (
            <div className="panel animate-rise border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-sm">
              {error.title ? (
                <p className="field-label text-[var(--accent)]">{error.title}</p>
              ) : null}
              <p className={error.title ? "mt-2" : undefined}>{error.message}</p>
            </div>
          ) : null}

          {mode === "compare" ? (
            <>
              {comparing ? (
                <div className="space-y-3">
                  <div className="timing-skeleton" />
                  <div className="timing-skeleton" />
                </div>
              ) : null}

              {!comparing && !result && !error ? (
                <div className="panel animate-rise p-6">
                  <p className="field-label">Ready</p>
                  <h2 className="font-[family-name:var(--font-teko)] text-4xl uppercase leading-none">
                    Pick a race, two drivers, one lap
                  </h2>
                  <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
                    Load synchronized speed, throttle, brake and gear traces with
                    lap and sector deltas.
                  </p>
                </div>
              ) : null}

              {result ? (
                <>
                  <ComparisonPanel comparison={result.comparison} />
                  {result.comparison.telemetryA.length === 0 &&
                  result.comparison.telemetryB.length === 0 ? (
                    <div className="panel p-4 text-sm text-[var(--muted)]">
                      No telemetry samples available for this lap.
                    </div>
                  ) : (
                    <TelemetryCharts comparison={result.comparison} />
                  )}
                </>
              ) : null}
            </>
          ) : (
            <>
              {loadingReplay ? (
                <div className="space-y-3">
                  <div className="timing-skeleton" />
                  <div className="timing-skeleton h-64" />
                  <p className="text-sm text-[var(--muted)]">
                    Fetching location and car data across the full race…
                  </p>
                </div>
              ) : null}

              {!loadingReplay && !replay && !error ? (
                <div className="panel animate-rise p-6">
                  <p className="field-label">Ready</p>
                  <h2 className="font-[family-name:var(--font-teko)] text-4xl uppercase leading-none">
                    Watch a driver lap by lap
                  </h2>
                  <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
                    Replay the full race on the circuit map with live speed,
                    gear, throttle and brake. Add an optional second driver for
                    a battle view.
                  </p>
                </div>
              ) : null}

              {replay ? (
                <RaceReplayPlayer
                  key={`${replay.session.id}-${replay.driver.id}-${replay.driverB?.id ?? "solo"}`}
                  replay={replay}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="select-control !w-auto cursor-pointer px-4 font-[family-name:var(--font-teko)] text-xl uppercase tracking-wide"
      style={
        active
          ? {
              borderColor: "var(--accent)",
              background: "var(--accent)",
              color: "white",
            }
          : undefined
      }
    >
      {label}
    </button>
  );
}
