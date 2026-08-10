# ADR-003 — Telemetry normalization

## Status

Accepted

## Context

OpenF1 `car_data` is timestamped absolute UTC. Charts need a shared relative axis per lap.

## Decision

Normalize samples into `TelemetrySample` with:

- absolute `timestamp`
- `relativeTimeSeconds` from the lap `date_start`
- speed, throttle, brake, gear, rpm

Lap windows are computed as `[date_start, date_start + lap_duration]`.

## Consequences

- Frontend never depends on OpenF1 field names
- Two drivers can be overlaid on the same relative-time axis
