# Architecture overview

Guia completo: **[architecture.md](./architecture.md)**

## Produto

**F1 Apex** — race replay, compare lap e news briefing.

## Diagrama resumido

```text
Browser UI
   │  same-origin /api/*  (+ app/news lê JSON local)
   ▼
Route Handlers (app/api)
   ▼
Application (lib/application)
   ▼
Domain (lib/domain)
   ▼
OpenF1 client (lib/infrastructure/openf1)  +  data/news/articles.json
   ▼
OpenF1 API  (+ Next fetch cache)
```

## Stack

- Next.js App Router + TypeScript
- Route Handlers como API interna (telemetria)
- OpenF1 server-side only
- News estática (`data/news/articles.json`, `npm run scrape:news`)
- Deep links para replay/compare (`lib/domain/share-links.ts`)
- Recharts + SVG para visualização
- Vitest para testes de domínio

## ADRs

Decisões arquiteturais em [docs/adr/](../adr/).

Extract Nest/Postgres when compare latency, shared cache, or heavy analysis become real problems.
