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
}

export interface CompareResult {
  session: Session;
  comparison: DriverComparison;
}

export interface TrackPoint {
  x: number;
  y: number;
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

export interface RaceReplay {
  session: Session;
  driver: Driver;
  driverB?: Driver;
  laps: Lap[];
  lapsB?: Lap[];
  trackPath: TrackPoint[];
  frames: ReplayFrame[];
  framesB?: ReplayFrame[];
  durationSeconds: number;
  totalLaps: number;
}
