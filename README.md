# F1 Telemetry Explorer

Explore and compare Formula 1 telemetry with [OpenF1](https://openf1.org/).

- **Race replay** — full-race map playback with optional head-to-head driver
- **Compare lap** — synchronized Speed / Throttle / Brake / Gear charts + sector deltas

Built by [Marcos Mendes](https://instagram.com/mendes.tsx).

## Stack

- Next.js (App Router) + TypeScript
- Route Handlers as the application API
- OpenF1 (server-side only)
- Recharts
- Vitest

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run test
npm run lint
npm run build
```

## Deploy on Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Prepare F1 Telemetry Explorer for production"
git remote add origin https://github.com/<user>/f1-telemetry.git
git push -u origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Framework preset: **Next.js** (auto-detected)
4. Root directory: `./`
5. Build command: `npm run build` (default)
6. Output: Next.js default

### 3. Environment variables

Optional — the app works without them (defaults to OpenF1 public API):

| Variable | Value | Required |
|----------|-------|----------|
| `OPENF1_BASE_URL` | `https://api.openf1.org/v1` | No |

Add in **Project → Settings → Environment Variables** for Production, Preview, and Development if you want it explicit.

### 4. Deploy

Click **Deploy**. Vercel runs `npm install` + `npm run build` and hosts the app.

### Serverless timeouts (important)

Race replay and lap compare fetch a lot of data from OpenF1. Route handlers use `maxDuration = 60` seconds.

- **Vercel Hobby**: function limit is **10s** — race replay may timeout
- **Vercel Pro**: up to **60s** — recommended for race replay / battle mode

If replay fails in production with a timeout, upgrade the plan or use compare-lap only.

### 5. Post-deploy check

- Home page loads
- Race list populates (`GET /api/sessions`)
- Race replay for a completed race (e.g. Hungary 2025)
- Compare lap for two drivers on one lap

## Architecture

```text
UI → /api/* → application → domain → OpenF1 infrastructure
```

Details: [docs/architecture/overview.md](docs/architecture/overview.md)

## API

```text
GET /api/sessions
GET /api/sessions/:sessionId/drivers
GET /api/sessions/:sessionId/laps?driverId=
GET /api/sessions/:sessionId/compare?driverA=&driverB=&lap=
GET /api/sessions/:sessionId/replay?driverId=&driverBId=
```

## Roadmap

1. **Phase 1 (now)** — Telemetry explorer, lap compare, race replay
2. **Phase 2** — Richer track visualization
3. **Phase 3** — Driving analysis (corners, braking, throttle)
4. **Phase 4** — Advanced race analytics

Product brief: [INSTRUCTIONS.md](INSTRUCTIONS.md)

## ADRs

- [ADR-001 Next.js-only](docs/adr/ADR-001-nextjs-only.md)
- [ADR-002 OpenF1](docs/adr/ADR-002-openf1.md)
- [ADR-003 Telemetry normalization](docs/adr/ADR-003-telemetry-normalization.md)
- [ADR-004 Visual + charts](docs/adr/ADR-004-visual-and-charts.md)
- [ADR-005 Analysis scope](docs/adr/ADR-005-analysis-engine.md)
