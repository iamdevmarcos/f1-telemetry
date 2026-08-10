# F1 Telemetry Explorer — Instructions

## 1. Project Overview

**F1 Telemetry Explorer** is a personal open-source project designed to explore, visualize, compare, and analyze Formula 1 telemetry data.

The main goal is to create a technically strong and visually impressive application that allows users to understand **how Formula 1 drivers actually drive a lap**, rather than simply displaying race results.

The application should allow users to select:

* A Formula 1 session/race
* Two drivers
* A specific lap

And compare their telemetry, including:

* Speed
* Throttle
* Brake
* Gear
* RPM
* Lap time
* Sector times
* Track position
* Driving behavior

The project should progressively evolve from a telemetry visualization tool into a deeper **F1 driving analysis platform**.

---

# 2. Main Goal

The application should answer questions such as:

> Why was Driver A faster than Driver B?

For example:

> Norris gains approximately 0.42 seconds in Sector 2, mainly because he maintains a higher minimum speed through Turns 9 and 10 and reaches full throttle earlier on corner exit.

These insights should be derived from telemetry data and deterministic analysis algorithms.

The project should prioritize **data accuracy, visualization quality, performance, and software engineering**.

---

# 3. Data Source

The primary data source is **OpenF1**.

OpenF1 provides Formula 1 data such as:

* Sessions
* Drivers
* Laps
* Car telemetry
* Positions
* Stints
* Pit stops
* Weather
* Race control messages
* Intervals
* Starting grid
* Results

OpenF1 documentation should be considered the source of truth when implementing integrations.

Do not invent OpenF1 endpoints, fields, or response formats.

When implementing a new integration:

1. Check the official OpenF1 documentation.
2. Understand the endpoint and its parameters.
3. Create a typed representation of the response.
4. Keep the OpenF1 integration isolated from the domain layer.

---

# 4. Product Vision

The project should evolve through several stages.

## Phase 1 — Telemetry Explorer

The first version should focus on:

* Session selection
* Driver selection
* Lap selection
* Telemetry visualization
* Driver comparison
* Lap and sector comparison

The MVP should be simple and reliable.

---

## Phase 2 — Lap Replay

Add an interactive visualization of the track.

The user should be able to replay a lap and see the drivers moving around the circuit.

Example:

```text
Lap 34

◀ ━━━━━━━━━━━━━━━●━━━━ ▶
0s              42s
```

The track visualization should show both drivers simultaneously.

---

## Phase 3 — Driving Analysis

Introduce calculated metrics such as:

* Braking point
* Minimum corner speed
* Maximum speed
* Throttle application
* Brake application
* Corner entry speed
* Corner exit speed
* Gear usage
* Sector performance
* Time gained/lost per section

Example:

```text
VERSTAPPEN

Braking
3.2% later than Norris

Corner Entry
+6 km/h average

Throttle
+4.8% earlier on exit

Sector 2
+0.421s advantage
```

These insights should be generated through deterministic algorithms.

---

## Phase 4 — Advanced Analytics

Extend the platform with deeper F1 analysis.

Potential features:

* Tyre degradation analysis
* Stint comparison
* Race pace analysis
* Long-run pace
* Strategy comparison
* Pit stop impact
* Safety car impact
* Weather impact
* Position evolution
* Race scenario simulation
* Historical driver comparison
* Track-specific performance analysis

These features should be introduced incrementally and only when they provide meaningful analytical value.

---

# 5. Architecture

The initial architecture should remain intentionally simple.

```text
                 OpenF1 API
                     │
                     ▼
              ┌──────────────┐
              │ Data Service │
              └──────┬───────┘
                     │
                     ▼
                PostgreSQL
                     │
                     ▼
               Backend API
                     │
                     ▼
              React / Next.js
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       Track      Telemetry   Analysis
       Map        Charts      Engine
```

Recommended stack:

### Frontend

* Next.js
* React
* TypeScript

### Backend

* NestJS
* TypeScript

### Database

* PostgreSQL

### Infrastructure

* Docker
* GitHub Actions

### Testing

* Jest
* Playwright

Additional technologies should only be introduced when there is a clear engineering reason.

---

# 6. Architectural Principles

Follow these principles throughout the project.

## Separation of concerns

Keep external API integration separate from the domain.

Bad:

```text
React Component
    ↓
OpenF1 API
```

Preferred:

```text
React
  ↓
Backend API
  ↓
Application Layer
  ↓
Domain
  ↓
OpenF1 Infrastructure
```

---

## Domain-driven thinking

The main domain concepts should be explicit.

Potential entities/value objects include:

```text
Session
Driver
Lap
TelemetrySample
Sector
Stint
Tyre
Track
DriverComparison
LapAnalysis
```

Do not create abstractions simply because "Clean Architecture requires them".

Use abstractions when they protect the domain from infrastructure or make the system easier to evolve and test.

---

# 7. Data Flow

A typical telemetry request should follow this flow:

```text
User selects:

Session
Driver A
Driver B
Lap

        ↓

Frontend request

        ↓

Backend

        ↓

Application Service

        ↓

Telemetry Repository

        ↓

OpenF1 / PostgreSQL

        ↓

Domain normalization

        ↓

Telemetry analysis

        ↓

Structured response

        ↓

Frontend visualization
```

---

# 8. Telemetry Model

Telemetry samples should be represented in a normalized domain model.

Example:

```typescript
interface TelemetrySample {
  timestamp: Date;
  driverId: string;

  speed: number;
  throttle: number;
  brake: number;

  gear: number;
  rpm: number;

  x?: number;
  y?: number;
  z?: number;
}
```

The exact model may evolve according to OpenF1's actual data.

Do not blindly mirror the external API response.

The domain model should represent what the application actually needs.

---

# 9. Driver Comparison

The comparison engine should eventually calculate metrics such as:

```text
Driver A vs Driver B

Lap Time
Sector 1
Sector 2
Sector 3

Maximum Speed
Average Speed

Average Throttle
Braking Points

Minimum Corner Speed
Corner Exit Speed

Time gained/lost
```

Example output:

```typescript
interface DriverComparison {
  driverA: string;
  driverB: string;

  lapTimeDelta: number;

  sectors: SectorComparison[];

  maxSpeedDelta?: number;

  insights: DrivingInsight[];
}
```

---

# 10. Analysis Engine

The analysis engine is one of the most important parts of the project.

It should transform raw telemetry into meaningful driving metrics.

Example:

```text
Raw telemetry
      ↓
Normalize samples
      ↓
Identify corners
      ↓
Detect braking zones
      ↓
Calculate minimum speed
      ↓
Calculate throttle application
      ↓
Compare drivers
      ↓
Generate insights
```

The analysis engine should be deterministic and testable.

For example:

```typescript
analyzeCorner(
  driverTelemetry,
  cornerDefinition
)
```

should produce predictable results for the same input.

---

# 11. Track Model

A track should eventually have a representation containing:

```text
Track
 ├── Layout
 ├── Corners
 ├── Sectors
 └── DRS Zones
```

Example:

```typescript
interface TrackCorner {
  id: string;
  number: number;

  startDistance: number;
  endDistance: number;

  name?: string;
}
```

Track definitions may initially be manually configured if reliable data is unavailable.

Do not over-engineer automatic track reconstruction in the MVP.

---

# 12. Frontend UX

The application should feel like a professional motorsport analytics tool.

Prioritize:

* Dark interface
* Clear telemetry visualization
* High information density
* Smooth interactions
* Fast filtering
* Responsive charts
* Clear driver comparison

The UI should prioritize data visualization over decorative elements.

The user should immediately understand:

1. Which session is being analyzed.
2. Which drivers are being compared.
3. Which lap is being viewed.
4. Where one driver gains or loses time.

---

# 13. Visualization

Telemetry should be presented through synchronized visualizations.

Potential charts:

### Speed

```text
Speed
350 ┤       ╭──╮
300 ┤   ╭───╯  ╰────╮
250 ┤───╯           ╰──
200 ┤
    └──────────────────
```

### Throttle

```text
Throttle
100 ┤████████░░██████████
 50 ┤
  0 ┤
```

### Brake

```text
Brake
100 ┤      ███
 50 ┤     ████
  0 ┤─────    ─────────
```

### Gear

The charts should share a common time or distance axis whenever possible.

This allows users to visually correlate:

```text
Speed
Throttle
Brake
Gear
Track position
```

---

# 14. Performance

Telemetry can contain a large number of samples.

Do not send unnecessarily large datasets to the frontend.

Consider:

* Server-side filtering
* Sampling/downsampling
* Caching
* Efficient PostgreSQL queries
* Memoization
* Lazy loading

The frontend should remain responsive when visualizing telemetry.

Do not optimize prematurely.

Measure first.

---

# 15. Caching

OpenF1 data should not be unnecessarily requested repeatedly.

Potential caching strategy:

```text
Request
   ↓
Cache
 ├── HIT → return data
 │
 └── MISS
       ↓
    OpenF1
       ↓
     Cache
       ↓
    Response
```

The initial implementation can use a simple database-backed cache.

Redis should only be introduced if it solves a demonstrated problem.

---

# 16. Error Handling

External API failures are expected.

The system should gracefully handle:

* OpenF1 unavailable
* Invalid session
* Invalid driver
* Missing telemetry
* Missing lap
* Rate limits
* Network failures
* Partial telemetry

The frontend should never crash because the external API returned an unexpected or incomplete response.

---

# 17. Testing Strategy

Tests should focus on business logic.

Priorities:

### Unit tests

Test:

* Telemetry normalization
* Lap calculations
* Sector calculations
* Driver comparisons
* Corner analysis
* Braking detection
* Time delta calculations

Example:

```text
Given two telemetry datasets
When comparing drivers
Then the analysis engine should calculate
the correct time delta.
```

### Integration tests

Test:

* OpenF1 integration
* Database persistence
* Backend endpoints

### E2E tests

Use Playwright for important user flows:

```text
Select session
    ↓
Select drivers
    ↓
Select lap
    ↓
View telemetry
    ↓
Compare drivers
```

---

# 18. API Design

The backend API should expose application-oriented endpoints.

Examples:

```text
GET /sessions

GET /sessions/:sessionId/drivers

GET /sessions/:sessionId/laps

GET /sessions/:sessionId/drivers/:driverId/telemetry

GET /sessions/:sessionId/compare
    ?driverA=VER
    &driverB=NOR
    &lap=34
```

Avoid exposing raw OpenF1 endpoints directly to the frontend.

The backend is responsible for translating external data into application/domain models.

---

# 19. Observability

The project should eventually include basic observability.

Track:

* API latency
* OpenF1 request latency
* Database query latency
* Cache hit rate
* Error rate
* Telemetry processing time

The objective is to demonstrate production-oriented engineering without unnecessary infrastructure.

---

# 20. Security

Even though this is a personal project, follow good security practices.

Never:

* Commit API keys
* Commit secrets
* Hardcode credentials
* Trust user input blindly
* Expose internal errors
* Execute arbitrary user-provided queries

Use environment variables for configuration.

Example:

```text
DATABASE_URL=
OPENF1_BASE_URL=
```

---

# 21. GitHub Quality

The repository should communicate senior-level engineering.

The README should contain:

* Project overview
* Screenshots/GIFs
* Architecture diagram
* Tech stack
* Features
* Local development
* Testing
* Architecture decisions
* Future roadmap

Create an `ADR/` directory for important architectural decisions.

Example:

```text
docs/
  architecture/
  adr/
```

Potential ADRs:

```text
ADR-001 — Why PostgreSQL
ADR-002 — Why OpenF1
ADR-003 — Telemetry normalization strategy
ADR-004 — Frontend charting strategy
ADR-005 — Analysis engine architecture
```

---

# 22. Development Principles

When modifying the project:

1. Prefer simple solutions.
2. Avoid unnecessary abstractions.
3. Keep domain logic framework-independent.
4. Keep external APIs behind infrastructure boundaries.
5. Write tests for meaningful business logic.
6. Prefer typed interfaces.
7. Do not duplicate domain logic between frontend and backend.
8. Do not introduce infrastructure without a clear reason.
9. Optimize only after identifying a real bottleneck.
10. Keep the codebase understandable to another senior engineer.

---

# 23. Definition of Done

A feature is considered complete when:

* The implementation works end-to-end.
* Types are correct.
* Business logic is tested.
* Error cases are handled.
* No unnecessary technical debt is introduced.
* The UI provides useful feedback.
* The feature is documented when architectural behavior changes.
* The implementation follows the existing architecture.

---

# 24. MVP Scope

The first milestone should intentionally be limited.

### Must have

* OpenF1 integration
* Session selection
* Driver selection
* Lap selection
* Telemetry retrieval
* Speed chart
* Throttle chart
* Brake chart
* Gear chart
* Two-driver comparison
* Lap time comparison
* Sector comparison
* Basic responsive UI

### Should not be part of MVP

* AI
* Real-time race tracking
* Redis
* Kafka
* Microservices
* Kubernetes
* Machine learning
* Complex track reconstruction

The MVP should establish a strong foundation before adding complexity.

---

# 25. Roadmap

```text
Phase 1
└── Telemetry Explorer
    ├── OpenF1
    ├── Sessions
    ├── Drivers
    ├── Laps
    ├── Telemetry
    └── Comparison

Phase 2
└── Lap Replay
    ├── Track visualization
    ├── Driver positions
    └── Playback

Phase 3
└── Driving Analysis
    ├── Corners
    ├── Braking
    ├── Throttle
    ├── Sector analysis
    └── Time delta

Phase 4
└── Advanced Analytics
    ├── Tyre degradation
    ├── Stint analysis
    ├── Strategy analysis
    ├── Race pace
    ├── Pit stop impact
    ├── Safety car impact
    └── Historical comparisons
```

---

# 26. Guiding Question

Every feature should ultimately help answer:

> **"What actually happened on track, and why?"**

The application is not intended to be another F1 results dashboard.

It should be an **engineering-focused telemetry analysis platform** that turns raw Formula 1 data into understandable insights.

---

# 27. Instructions for AI Coding Agents

When working on this repository:

* Read this file before making architectural changes.
* Inspect the existing code before proposing new abstractions.
* Follow existing conventions.
* Do not rewrite working architecture unnecessarily.
* Do not introduce dependencies without justification.
* Do not invent external API behavior.
* Verify OpenF1 documentation before implementing new endpoints.
* Prefer incremental changes.
* Explain important architectural trade-offs.
* Add tests alongside meaningful business logic.
* Keep the MVP scope under control.
* Favor correctness and maintainability over complexity.

When asked to implement a feature, first determine:

```text
1. What domain problem does this solve?
2. Which layer should own the logic?
3. What data is required?
4. Does the external API already provide it?
5. What is the simplest correct implementation?
6. How should it be tested?
```

The goal is not to make the project look artificially complex.

The goal is to build a **real, maintainable F1 telemetry product that demonstrates strong Senior Software Engineering skills.**
