export interface OpenF1Session {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  year: number;
  country_name: string;
  circuit_short_name: string;
  location: string;
  meeting_key: number;
  is_cancelled?: boolean;
}

export interface OpenF1Driver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  team_colour: string;
  session_key: number;
}

export interface OpenF1Lap {
  session_key: number;
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  date_start: string | null;
}

export interface OpenF1CarData {
  session_key: number;
  driver_number: number;
  date: string;
  speed: number;
  throttle: number;
  brake: number;
  n_gear: number;
  rpm: number;
}

export interface OpenF1Location {
  session_key: number;
  driver_number: number;
  date: string;
  x: number;
  y: number;
  z: number;
}

export interface OpenF1Position {
  session_key: number;
  driver_number: number;
  date: string;
  position: number;
}

export interface OpenF1Interval {
  session_key: number;
  driver_number: number;
  date: string;
  gap_to_leader: number | string | null;
  interval: number | string | null;
}

export interface OpenF1Stint {
  session_key: number;
  driver_number: number;
  stint_number: number;
  compound: string;
  lap_start: number;
  lap_end: number | null;
  tyre_age_at_start: number;
}

export interface OpenF1Weather {
  session_key: number;
  date: string;
  air_temperature: number | null;
  track_temperature: number | null;
  humidity: number | null;
  rainfall: number | boolean | null;
  wind_speed: number | null;
}
