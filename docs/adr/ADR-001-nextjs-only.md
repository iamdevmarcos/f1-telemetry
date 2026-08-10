# ADR-001 — Next.js-only on Vercel first

## Status

Accepted

## Context

The product vision describes NestJS + PostgreSQL. For a personal side project, that stack adds hosting and ops cost before product value exists.

## Decision

Ship the MVP as a single Next.js App Router app:

- UI in React client components
- Application API via Route Handlers
- OpenF1 access only on the server
- Cache via Next.js `fetch` revalidation

## Consequences

- Fast local setup and Vercel deploy
- Domain logic lives in `lib/` and can be extracted later
- No durable cross-instance cache until Postgres/Redis is introduced
