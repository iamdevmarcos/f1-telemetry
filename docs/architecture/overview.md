# Architecture overview

Guia completo: **[architecture.md](./architecture.md)**

## Diagrama resumido

```text
Browser UI
   │  same-origin /api/*
   ▼
Route Handlers (app/api)
   ▼
Application (lib/application)
   ▼
Domain (lib/domain)
   ▼
OpenF1 client (lib/infrastructure/openf1)
   ▼
OpenF1 API  (+ Next fetch cache)
```

## Stack

- Next.js App Router + TypeScript
- Route Handlers como API interna
- OpenF1 server-side only
- Recharts + SVG para visualização
- Vitest para testes de domínio

## ADRs

Decisões arquiteturais em [docs/adr/](../adr/).

Extract Nest/Postgres when compare latency, shared cache, or heavy analysis become real problems.
