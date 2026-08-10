# ADR-004 — F1 visual language + Recharts

## Status

Accepted

## Context

The MVP must feel like a paddock/broadcast tool, not a generic SaaS dashboard, while remaining simple to ship.

## Decision

- Dark motorsport UI with Teko + IBM Plex Mono and F1 red accent
- Recharts for synchronized Speed / Throttle / Brake / Gear traces
- Team colours from OpenF1 when available

## Consequences

- Strong first impression without custom WebGL
- Chart density is good enough for ~3.7 Hz lap samples after light downsampling
