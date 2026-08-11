export interface Session {
  id: string;
  year: number;
  countryName: string;
  circuitShortName: string;
  location: string;
  sessionName: string;
  sessionType: string;
  dateStart: string;
  dateEnd: string;
  isUpcoming: boolean;
}

export interface Driver {
  id: string;
  number: number;
  acronym: string;
  fullName: string;
  teamName: string;
  teamColour: string;
}

export interface Lap {
  driverId: string;
  lapNumber: number;
  lapTimeSeconds: number | null;
  sector1Seconds: number | null;
  sector2Seconds: number | null;
  sector3Seconds: number | null;
  dateStart: string | null;
}

export interface TelemetrySample {
  timestamp: string;
  relativeTimeSeconds: number;
  driverId: string;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
}

export interface LapDrivingMetrics {
  maxSpeedKph: number | null;
  avgSpeedKph: number | null;
  avgThrottlePercent: number | null;
  fullThrottlePercent: number | null;
  brakingPercent: number | null;
}

export interface SectorComparison {
  sector: 1 | 2 | 3;
  timeA: number | null;
  timeB: number | null;
  deltaSeconds: number | null;
}

export interface DriverComparison {
  driverA: Driver;
  driverB: Driver;
  lapNumber: number;
  lapTimeA: number | null;
  lapTimeB: number | null;
  lapTimeDelta: number | null;
  sectors: SectorComparison[];
  telemetryA: TelemetrySample[];
  telemetryB: TelemetrySample[];
  metricsA: LapDrivingMetrics;
  metricsB: LapDrivingMetrics;
}

export interface CompareResult {
  session: Session;
  comparison: DriverComparison;
}

export interface TrackPoint {
  x: number;
  y: number;
}

export interface TrackSectorPath {
  sector: 1 | 2 | 3;
  points: TrackPoint[];
}

export interface ReplayFrame {
  timestamp: string;
  relativeTimeSeconds: number;
  lapNumber: number;
  x: number;
  y: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
}

export type RaceGap =
  | { type: "leader" }
  | { type: "seconds"; value: number }
  | { type: "laps"; value: number };

export interface PositionSample {
  relativeTimeSeconds: number;
  driverId: string;
  position: number;
}

export interface IntervalSample {
  relativeTimeSeconds: number;
  driverId: string;
  gapToLeader: RaceGap;
  interval: RaceGap;
}

export interface TyreStint {
  driverId: string;
  stintNumber: number;
  compound: string;
  lapStart: number;
  lapEnd: number | null;
  tyreAgeAtStart: number;
}

export interface WeatherSample {
  relativeTimeSeconds: number;
  airTempC: number | null;
  trackTempC: number | null;
  humidityPercent: number | null;
  rainfall: boolean;
  windSpeed: number | null;
}

export interface FastestLapInfo {
  driverId: string;
  lapNumber: number;
  lapTimeSeconds: number;
}

export interface PitStop {
  driverId: string;
  relativeTimeSeconds: number;
  lapNumber: number;
  stopDurationSeconds: number | null;
  laneDurationSeconds: number | null;
}

export type SectorTone = "purple" | "green" | "yellow" | "none";

export interface SectorTiming {
  seconds: number | null;
  tone: SectorTone;
}

export interface RaceDashboard {
  drivers: Driver[];
  raceStartMs: number;
  positions: PositionSample[];
  intervals: IntervalSample[];
  stints: TyreStint[];
  pits: PitStop[];
  weather: WeatherSample[];
  sessionLaps: Lap[];
  fastestLap: FastestLapInfo | null;
}

export interface LeaderboardRow {
  position: number;
  driver: Driver;
  gapToLeader: RaceGap;
  interval: RaceGap;
  compound: string | null;
  tyreAgeLaps: number | null;
  lastLapSeconds: number | null;
  bestLapSeconds: number | null;
  pitCount: number;
  lastPitLap: number | null;
  sectors: [SectorTiming, SectorTiming, SectorTiming];
  currentLapNumber: number | null;
}

export interface DriverLiveTiming {
  driverId: string;
  currentLapNumber: number | null;
  currentLapElapsedSeconds: number | null;
  lastLapSeconds: number | null;
  bestLapSeconds: number | null;
  deltaToBestSeconds: number | null;
  compound: string | null;
  tyreAgeLaps: number | null;
  position: number | null;
  gapToLeader: RaceGap | null;
  interval: RaceGap | null;
}

export interface RaceDashboardSnapshot {
  leaderboard: LeaderboardRow[];
  weather: WeatherSample | null;
  fastestLap: FastestLapInfo | null;
  focused: DriverLiveTiming | null;
  focusedB: DriverLiveTiming | null;
}

export interface RaceReplay {
  session: Session;
  driver: Driver;
  driverB?: Driver;
  laps: Lap[];
  lapsB?: Lap[];
  trackPath: TrackPoint[];
  trackSectors?: TrackSectorPath[];
  frames: ReplayFrame[];
  framesB?: ReplayFrame[];
  durationSeconds: number;
  totalLaps: number;
  dashboard?: RaceDashboard;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  scrapedAt: string;
}

export interface NewsArticleTeaser {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
}
