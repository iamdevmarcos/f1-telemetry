"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { ComparisonPanel } from "@/components/ComparisonPanel";
import { ExplorerFilters } from "@/components/ExplorerFilters";
import { ModeNav } from "@/components/ModeNav";
import { RaceReplayPlayer } from "@/components/RaceReplayPlayer";
import { ReplayFilters } from "@/components/ReplayFilters";
import { ShareButtons } from "@/components/ShareButtons";
import { TelemetryCharts } from "@/components/TelemetryCharts";
import {
  buildCompareSharePath,
  buildReplaySharePath,
  parseExplorerShareParams,
} from "@/lib/domain/share-links";
import type {
  CompareResult,
  Driver,
  Lap,
  RaceReplay,
  Session,
} from "@/lib/domain/types";
import { formatSessionRaceLabel, getRacePlaceName } from "@/lib/format";

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

function syncBrowserPath(path: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.history.replaceState(window.history.state, "", path);
}

export function TelemetryExplorer() {
  const searchParams = useSearchParams();
  const mode: ExplorerMode =
    searchParams.get("mode") === "compare" ? "compare" : "replay";
  const [sessions, setSessions] = useState<Session[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [comparableLapNumbers, setComparableLapNumbers] = useState<number[]>(
    [],
  );
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
  const [errorMode, setErrorMode] = useState(mode);
  const [cinemaMode, setCinemaMode] = useState(false);
  const didBootstrapRef = useRef(false);

  if (mode !== errorMode) {
    setErrorMode(mode);
    setError(null);
    setCinemaMode(false);
  }

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

  const replayRacePlaceLabel = useMemo(() => {
    if (!selectedSession) {
      return undefined;
    }
    const sessionsInYear = sessions.filter(
      (session) => session.year === selectedSession.year,
    );
    return getRacePlaceName(selectedSession, sessionsInYear);
  }, [selectedSession, sessions]);

  const loadDriversForSession = useCallback(async (nextSessionId: string) => {
    setLoadingDrivers(true);
    try {
      const data = await fetchJson<{ drivers: Driver[] }>(
        `/api/sessions/${nextSessionId}/drivers`,
      );
      setDrivers(data.drivers);
      return data.drivers;
    } catch (loadError) {
      setError(toExplorerError(loadError, "Failed to load drivers"));
      return [] as Driver[];
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  const handleSessionChange = useCallback(
    async (nextSessionId: string) => {
      setSessionId(nextSessionId);
      setDriverAId("");
      setDriverBId("");
      setReplayDriverId("");
      setReplayDriverBId("");
      setLapNumber("");
      setLaps([]);
      setComparableLapNumbers([]);
      setDrivers([]);
      setResult(null);
      setReplay(null);
      setError(null);

      if (!nextSessionId) {
        return;
      }

      await loadDriversForSession(nextSessionId);
    },
    [loadDriversForSession],
  );

  const loadComparableLaps = useCallback(
    async (
      nextSessionId: string,
      driverA: string,
      driverB?: string,
      preferredLap?: string,
    ) => {
      if (!nextSessionId || !driverA) {
        return [] as number[];
      }

      setLoadingLaps(true);
      try {
        const params = new URLSearchParams({ driverId: driverA });
        if (driverB) {
          params.set("driverBId", driverB);
        }

        const data = await fetchJson<{
          laps: Lap[];
          comparableLapNumbers: number[];
        }>(`/api/sessions/${nextSessionId}/laps?${params.toString()}`);

        setLaps(data.laps);
        setComparableLapNumbers(data.comparableLapNumbers);

        if (preferredLap) {
          const lapValue = Number(preferredLap);
          setLapNumber(
            data.comparableLapNumbers.includes(lapValue) ? preferredLap : "",
          );
        } else {
          setLapNumber((current) => {
            if (
              current &&
              !data.comparableLapNumbers.includes(Number(current))
            ) {
              return "";
            }
            return current;
          });
        }

        return data.comparableLapNumbers;
      } catch (loadError) {
        setError(toExplorerError(loadError, "Failed to load laps"));
        return [] as number[];
      } finally {
        setLoadingLaps(false);
      }
    },
    [],
  );

  const handleDriverAChange = useCallback(
    async (nextDriverId: string) => {
      setDriverAId(nextDriverId);
      setLapNumber("");
      setLaps([]);
      setComparableLapNumbers([]);
      setResult(null);
      setError(null);

      if (!sessionId || !nextDriverId) {
        return;
      }

      await loadComparableLaps(
        sessionId,
        nextDriverId,
        driverBId && driverBId !== nextDriverId ? driverBId : undefined,
      );
    },
    [sessionId, driverBId, loadComparableLaps],
  );

  const handleDriverBChange = useCallback(
    async (nextDriverId: string) => {
      setDriverBId(nextDriverId);
      setLapNumber("");
      setResult(null);
      setError(null);

      if (!sessionId || !driverAId || !nextDriverId) {
        setComparableLapNumbers([]);
        return;
      }

      if (nextDriverId === driverAId) {
        setComparableLapNumbers([]);
        return;
      }

      await loadComparableLaps(sessionId, driverAId, nextDriverId);
    },
    [sessionId, driverAId, loadComparableLaps],
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
      syncBrowserPath(
        buildCompareSharePath({
          sessionId,
          driverAId,
          driverBId,
          lapNumber,
        }),
      );
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
    setCinemaMode(false);

    try {
      const params = new URLSearchParams({ driverId: replayDriverId });
      if (replayDriverBId) {
        params.set("driverBId", replayDriverBId);
      }
      const data = await fetchJson<{ replay: RaceReplay }>(
        `/api/sessions/${sessionId}/replay?${params.toString()}`,
      );
      setReplay(data.replay);
      syncBrowserPath(
        buildReplaySharePath({
          sessionId,
          driverId: replayDriverId,
          driverBId: replayDriverBId || undefined,
        }),
      );
    } catch (loadError) {
      setError(toExplorerError(loadError, "Failed to load race replay"));
    } finally {
      setLoadingReplay(false);
    }
  }, [sessionId, replayDriverId, replayDriverBId]);

  useEffect(() => {
    if (didBootstrapRef.current || loadingSessions || sessions.length === 0) {
      return;
    }

    didBootstrapRef.current = true;

    const parsed = parseExplorerShareParams(
      new URLSearchParams(searchParams.toString()),
    );

    if (!parsed.sessionId) {
      return;
    }

    void (async () => {
      const sessionExists = sessions.some(
        (session) => session.id === parsed.sessionId,
      );
      if (!sessionExists) {
        setError({
          message: "Shared race was not found in the available sessions.",
        });
        return;
      }

      setSessionId(parsed.sessionId!);
      setError(null);

      const loadedDrivers = await loadDriversForSession(parsed.sessionId!);
      if (loadedDrivers.length === 0) {
        return;
      }

      if (parsed.mode === "replay" && parsed.driverId) {
        const driverOk = loadedDrivers.some(
          (driver) => driver.id === parsed.driverId,
        );
        if (!driverOk) {
          setError({ message: "Shared driver was not found for this race." });
          return;
        }

        const driverBOk =
          !parsed.driverBId ||
          loadedDrivers.some((driver) => driver.id === parsed.driverBId);

        if (!driverBOk) {
          setError({
            message: "Shared second driver was not found for this race.",
          });
          return;
        }

        setReplayDriverId(parsed.driverId);
        setReplayDriverBId(parsed.driverBId ?? "");
        setLoadingReplay(true);
        setReplay(null);

        try {
          const params = new URLSearchParams({ driverId: parsed.driverId });
          if (parsed.driverBId) {
            params.set("driverBId", parsed.driverBId);
          }
          const data = await fetchJson<{ replay: RaceReplay }>(
            `/api/sessions/${parsed.sessionId}/replay?${params.toString()}`,
          );
          setReplay(data.replay);
          syncBrowserPath(
            buildReplaySharePath({
              sessionId: parsed.sessionId!,
              driverId: parsed.driverId,
              driverBId: parsed.driverBId ?? undefined,
            }),
          );
        } catch (loadError) {
          setError(toExplorerError(loadError, "Failed to load race replay"));
        } finally {
          setLoadingReplay(false);
        }
        return;
      }

      if (
        parsed.mode === "compare" &&
        parsed.driverAId &&
        parsed.driverBId &&
        parsed.lapNumber
      ) {
        const driverAOk = loadedDrivers.some(
          (driver) => driver.id === parsed.driverAId,
        );
        const driverBOk = loadedDrivers.some(
          (driver) => driver.id === parsed.driverBId,
        );

        if (!driverAOk || !driverBOk) {
          setError({
            message: "Shared drivers were not found for this race.",
          });
          return;
        }

        setDriverAId(parsed.driverAId);
        setDriverBId(parsed.driverBId);

        const comparable = await loadComparableLaps(
          parsed.sessionId!,
          parsed.driverAId,
          parsed.driverBId,
          parsed.lapNumber,
        );

        if (!comparable.includes(Number(parsed.lapNumber))) {
          setError({
            message:
              "Shared lap was not completed by both drivers. Choose another lap.",
          });
          return;
        }

        setComparing(true);
        setResult(null);

        try {
          const data = await fetchJson<CompareResult>(
            `/api/sessions/${parsed.sessionId}/compare?driverA=${parsed.driverAId}&driverB=${parsed.driverBId}&lap=${parsed.lapNumber}`,
          );
          setResult(data);
          syncBrowserPath(
            buildCompareSharePath({
              sessionId: parsed.sessionId!,
              driverAId: parsed.driverAId,
              driverBId: parsed.driverBId,
              lapNumber: parsed.lapNumber,
            }),
          );
        } catch (loadError) {
          setError(toExplorerError(loadError, "Failed to compare drivers"));
        } finally {
          setComparing(false);
        }
      }
    })();
  }, [
    loadingSessions,
    sessions,
    searchParams,
    loadDriversForSession,
    loadComparableLaps,
  ]);

  const compareSharePath =
    result && sessionId && driverAId && driverBId && lapNumber
      ? buildCompareSharePath({
          sessionId,
          driverAId,
          driverBId,
          lapNumber,
        })
      : null;

  const replaySharePath =
    replay && sessionId && replayDriverId
      ? buildReplaySharePath({
          sessionId,
          driverId: replayDriverId,
          driverBId: replayDriverBId || undefined,
        })
      : null;

  const compareShareTitle = result
    ? `${result.comparison.driverA.acronym} vs ${result.comparison.driverB.acronym} · Lap ${result.comparison.lapNumber}`
    : "F1 Apex compare";

  const replayShareTitle = replay
    ? replay.driverB
      ? `${replay.driver.acronym} vs ${replay.driverB.acronym} · Race replay`
      : `${replay.driver.acronym} · Race replay`
    : "F1 Apex replay";

  const visibleError = errorMode === mode ? error : null;
  const replayCinemaActive = mode === "replay" && cinemaMode && Boolean(replay);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "t" && event.key !== "T") {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }
      if (mode !== "replay" || !replay) {
        return;
      }

      event.preventDefault();
      setCinemaMode((current) => !current);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mode, replay]);

  return (
    <AppShell
      contextLabel={contextLabel}
      modeLabel={mode === "compare" ? "Lap comparison" : "Race replay"}
    >
      <ModeNav active={mode} />

      <div
        className={
          replayCinemaActive
            ? "grid gap-5"
            : "grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]"
        }
      >
        {mode === "compare" ? (
          <ExplorerFilters
            sessions={sessions}
            drivers={drivers}
            laps={laps}
            comparableLapNumbers={comparableLapNumbers}
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
            onDriverBChange={(value) => {
              void handleDriverBChange(value);
            }}
            onLapChange={setLapNumber}
            onCompare={() => {
              void handleCompare();
            }}
          />
        ) : replayCinemaActive ? null : (
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
          {visibleError ? (
            <div className="panel animate-rise border-[var(--accent)] bg-[var(--accent-soft)] p-4 text-sm">
              {visibleError.title ? (
                <p className="field-label text-[var(--accent)]">
                  {visibleError.title}
                </p>
              ) : null}
              <p className={visibleError.title ? "mt-2" : undefined}>
                {visibleError.message}
              </p>
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

              {!comparing && !result && !visibleError ? (
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

              {result && compareSharePath ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                      Share this comparison
                    </p>
                    <ShareButtons
                      title={compareShareTitle}
                      url={compareSharePath}
                    />
                  </div>
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

              {!loadingReplay && !replay && !visibleError ? (
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

              {replay && replaySharePath ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
                        {replayCinemaActive
                          ? "Cinema mode · setup hidden"
                          : "Share this replay"}
                      </p>
                      <p className="hidden text-xs text-[var(--muted)] sm:block">
                        Press{" "}
                        <kbd className="rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[0.7rem] text-white">
                          T
                        </kbd>{" "}
                        to {replayCinemaActive ? "exit" : "enter"} cinema
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCinemaMode((current) => !current)}
                        className="select-control !w-auto cursor-pointer px-4 text-xs uppercase tracking-[0.14em]"
                        style={
                          replayCinemaActive
                            ? {
                                borderColor: "var(--accent)",
                                background: "var(--accent)",
                                color: "white",
                              }
                            : undefined
                        }
                        aria-pressed={replayCinemaActive}
                        title="Toggle cinema mode (T)"
                      >
                        {replayCinemaActive ? "Exit cinema" : "Cinema"}{" "}
                        <span className="ml-1 opacity-70">T</span>
                      </button>
                      <ShareButtons
                        title={replayShareTitle}
                        url={replaySharePath}
                      />
                    </div>
                  </div>
                  <RaceReplayPlayer
                    key={`${replay.session.id}-${replay.driver.id}-${replay.driverB?.id ?? "solo"}`}
                    replay={replay}
                    cinemaMode={replayCinemaActive}
                    racePlaceLabel={replayRacePlaceLabel}
                  />
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
