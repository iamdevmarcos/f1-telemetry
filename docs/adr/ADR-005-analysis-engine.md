# ADR-005 — Analysis engine scope

## Status

Accepted

## Context

Long-term the product should explain *why* one driver is faster. That requires corner models and braking/throttle detection.

## Decision

MVP analysis is limited to deterministic lap time and sector deltas (`A - B`).

Corner, braking point and throttle-application insights are deferred to Phase 3.

## Consequences

- Correct, testable comparison now
- Clear extension point in `lib/domain` later without rewriting the UI contract
