# ADR-002 — OpenF1 as data source

## Status

Accepted

## Context

The app needs historical Formula 1 sessions, drivers, laps and car telemetry.

## Decision

Use the public OpenF1 HTTP API (`https://api.openf1.org/v1`) as the only external data source in the MVP.

OpenF1 response shapes stay inside `lib/infrastructure/openf1` and are mapped into domain models before leaving the server.

## Consequences

- No invented endpoints or fields
- External outages and missing telemetry must be handled gracefully
- Historical data can be queried without an API key
