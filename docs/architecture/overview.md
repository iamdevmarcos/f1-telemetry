# Architecture overview

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

Extract Nest/Postgres when compare latency, shared cache, or heavy analysis become real problems.
