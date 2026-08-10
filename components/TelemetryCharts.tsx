"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DriverComparison, TelemetrySample } from "@/lib/domain/types";

type MetricKey = "speed" | "throttle" | "brake" | "gear";

const METRICS: Array<{ key: MetricKey; label: string; unit: string }> = [
  { key: "speed", label: "Speed", unit: "km/h" },
  { key: "throttle", label: "Throttle", unit: "%" },
  { key: "brake", label: "Brake", unit: "%" },
  { key: "gear", label: "Gear", unit: "" },
];

function downsample(samples: TelemetrySample[], maxPoints: number): TelemetrySample[] {
  if (samples.length <= maxPoints) {
    return samples;
  }

  const step = Math.ceil(samples.length / maxPoints);
  return samples.filter((_, index) => index % step === 0);
}

function buildSeries(
  telemetryA: TelemetrySample[],
  telemetryB: TelemetrySample[],
  metric: MetricKey,
) {
  const a = downsample(telemetryA, 400);
  const b = downsample(telemetryB, 400);
  const map = new Map<number, { t: number; a?: number; b?: number }>();

  for (const sample of a) {
    const t = Number(sample.relativeTimeSeconds.toFixed(2));
    map.set(t, { t, a: sample[metric] });
  }

  for (const sample of b) {
    const t = Number(sample.relativeTimeSeconds.toFixed(2));
    const existing = map.get(t) ?? { t };
    existing.b = sample[metric];
    map.set(t, existing);
  }

  return Array.from(map.values()).sort((left, right) => left.t - right.t);
}

export function TelemetryCharts({
  comparison,
}: {
  comparison: DriverComparison;
}) {
  const [activeTime, setActiveTime] = useState<number | null>(null);
  const colourA = comparison.driverA.teamColour || "var(--driver-a)";
  const colourB = comparison.driverB.teamColour || "var(--driver-b)";

  const seriesByMetric = useMemo(() => {
    return Object.fromEntries(
      METRICS.map((metric) => [
        metric.key,
        buildSeries(comparison.telemetryA, comparison.telemetryB, metric.key),
      ]),
    ) as Record<MetricKey, Array<{ t: number; a?: number; b?: number }>>;
  }, [comparison]);

  return (
    <section className="panel animate-rise space-y-2 p-3 md:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <div>
          <p className="field-label">Telemetry</p>
          <h3 className="font-[family-name:var(--font-teko)] text-3xl uppercase leading-none">
            Synchronized traces
          </h3>
        </div>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          {activeTime === null
            ? "Hover charts to sync cursor"
            : `t = ${activeTime.toFixed(2)}s`}
        </p>
      </div>

      {METRICS.map((metric, index) => (
        <div
          key={metric.key}
          className="border border-[var(--border)] bg-[var(--bg-elevated)] p-2"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="mb-1 flex items-baseline justify-between px-1">
            <p className="font-[family-name:var(--font-teko)] text-xl uppercase tracking-wide">
              {metric.label}
            </p>
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--muted)]">
              {metric.unit || "ratio"}
            </p>
          </div>
          <div className="h-[160px] w-full md:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={seriesByMetric[metric.key]}
                syncId="telemetry-sync"
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                onMouseMove={(state) => {
                  const label = state?.activeLabel;
                  if (typeof label === "number") {
                    setActiveTime(label);
                  }
                }}
                onMouseLeave={() => setActiveTime(null)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="t"
                  type="number"
                  tick={{ fill: "#8b909a", fontSize: 11 }}
                  tickFormatter={(value: number) => `${value.toFixed(0)}s`}
                  domain={["dataMin", "dataMax"]}
                />
                <YAxis
                  tick={{ fill: "#8b909a", fontSize: 11 }}
                  width={40}
                  domain={metric.key === "gear" ? [0, 8] : ["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "#101114",
                    border: "1px solid #2a2e38",
                    borderRadius: 0,
                    fontSize: 12,
                  }}
                  labelFormatter={(value) => `t = ${Number(value).toFixed(2)}s`}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) =>
                    value === "a"
                      ? comparison.driverA.acronym
                      : comparison.driverB.acronym
                  }
                />
                <Line
                  type="monotone"
                  dataKey="a"
                  stroke={colourA}
                  dot={false}
                  strokeWidth={1.8}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="b"
                  stroke={colourB}
                  dot={false}
                  strokeWidth={1.8}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </section>
  );
}
