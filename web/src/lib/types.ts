export type County = "LA" | "OC";
export type TeamId = "gloom" | "dogs";
export type DayStatus = "final" | "live" | "upcoming";

export interface Station {
  id: string;
  name: string;
  county: County;
  lat: number;
  lon: number;
}

export interface HourPoint {
  /** Local ISO hour, e.g. "2026-06-03T09:00". */
  time: string;
  hour: number;
  date: string; // YYYY-MM-DD
  lowCloud: number; // % low cloud cover
  sunshineSec: number; // seconds of sunshine in the hour
}

export interface StationSeries {
  station: Station;
  hours: HourPoint[];
}

export interface StationDay {
  station: Station;
  index: number; // 0..100 Gloom Index for this station/day
  meanLowCloud: number;
  sunFraction: number; // 0..1 of morning that was sunny
  pctSocked: number; // % of morning hours socked in
  burnOffHour: number | null; // first morning hour it cleared, or null
  morningHours: number; // how many morning hours had data
}

export interface DayResult {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  gloomIndex: number; // coastal average 0..100
  gloomScore: number; // round(index)
  dogScore: number; // 100 - gloomScore
  winner: TeamId;
  status: DayStatus;
  stations: StationDay[];
}

export interface Season {
  year: number;
  days: DayResult[]; // June 1 .. (today + forecast)
  today: DayResult | null;
  gloomWins: number;
  dogWins: number;
  gloomPoints: number; // cumulative over FINAL games
  dogPoints: number;
  streakTeam: TeamId | null;
  streakLen: number;
  finalsPlayed: number;
}
