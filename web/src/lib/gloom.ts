import type {
  StationSeries,
  StationDay,
  DayResult,
  Season,
  TeamId,
  DayStatus,
} from "./types";
import { laTodayISO, seasonYear } from "./openMeteo";

// --------------------------------------------------------------------------
// Tunable constants — the methodology page reads these so docs == reality.
// --------------------------------------------------------------------------

/** Marine-layer window: 6 AM through 11 AM local (the "night & morning low
 *  clouds" hours when the gloom either holds or burns off). */
export const MORNING_START = 6;
export const MORNING_END = 12; // exclusive

/** Low-cloud cover (%) at or above which an hour counts as "socked in". */
export const SOCKED_THRESHOLD = 50;

/** Weights for the three components of the daily Gloom Index (sum to 1). */
export const WEIGHTS = {
  lowCloud: 0.5, // how thick the marine layer was
  sunless: 0.3, // how little sun actually reached the ground
  socked: 0.2, // how much of the morning stayed socked in
} as const;

/** Index at or above this = a Gloom win; below = a Big Dogs win. */
export const WIN_THRESHOLD = 50;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

// --------------------------------------------------------------------------
// Per-station, per-day index
// --------------------------------------------------------------------------

function stationDays(series: StationSeries): Map<string, StationDay> {
  const byDate = new Map<string, typeof series.hours>();
  for (const h of series.hours) {
    if (h.hour < MORNING_START || h.hour >= MORNING_END) continue;
    const arr = byDate.get(h.date) ?? [];
    arr.push(h);
    byDate.set(h.date, arr);
  }

  const out = new Map<string, StationDay>();
  for (const [date, hours] of byDate) {
    if (hours.length === 0) continue;
    const n = hours.length;
    const meanLowCloud = hours.reduce((s, h) => s + h.lowCloud, 0) / n;
    const sunFraction = clamp(
      hours.reduce((s, h) => s + h.sunshineSec, 0) / (n * 3600),
      0,
      1,
    );
    const sockedHours = hours.filter((h) => h.lowCloud >= SOCKED_THRESHOLD).length;
    const pctSocked = (100 * sockedHours) / n;

    const index = clamp(
      WEIGHTS.lowCloud * meanLowCloud +
        WEIGHTS.sunless * (1 - sunFraction) * 100 +
        WEIGHTS.socked * pctSocked,
    );

    // First morning hour the low cloud dropped below threshold = burn-off.
    const cleared = hours
      .slice()
      .sort((a, b) => a.hour - b.hour)
      .find((h) => h.lowCloud < SOCKED_THRESHOLD);

    out.set(date, {
      station: series.station,
      index,
      meanLowCloud,
      sunFraction,
      pctSocked,
      burnOffHour: cleared ? cleared.hour : null,
      morningHours: n,
    });
  }
  return out;
}

function statusFor(date: string, today: string): DayStatus {
  if (date < today) return "final";
  if (date === today) return "live";
  return "upcoming";
}

// --------------------------------------------------------------------------
// Coastal aggregation + season build
// --------------------------------------------------------------------------

export function buildSeason(allSeries: StationSeries[]): Season {
  const today = laTodayISO();
  const year = seasonYear();
  const junePrefix = `${year}-06-`;

  const perStation = allSeries.map(stationDays);

  // Collect every June date present in the data.
  const dates = new Set<string>();
  for (const m of perStation) {
    for (const date of m.keys()) {
      if (date.startsWith(junePrefix)) dates.add(date);
    }
  }

  const days: DayResult[] = [];
  for (const date of [...dates].sort()) {
    const stations: StationDay[] = [];
    for (const m of perStation) {
      const sd = m.get(date);
      if (sd) stations.push(sd);
    }
    if (stations.length === 0) continue;

    const gloomIndex = clamp(
      stations.reduce((s, sd) => s + sd.index, 0) / stations.length,
    );
    const gloomScore = Math.round(gloomIndex);
    const winner: TeamId = gloomIndex >= WIN_THRESHOLD ? "gloom" : "dogs";

    days.push({
      date,
      dayOfMonth: Number(date.slice(8, 10)),
      gloomIndex,
      gloomScore,
      dogScore: 100 - gloomScore,
      winner,
      status: statusFor(date, today),
      stations,
    });
  }

  // Tally only FINAL games into the record + cumulative points.
  let gloomWins = 0;
  let dogWins = 0;
  let gloomPoints = 0;
  let dogPoints = 0;
  for (const d of days) {
    if (d.status !== "final") continue;
    if (d.winner === "gloom") gloomWins++;
    else dogWins++;
    gloomPoints += d.gloomScore;
    dogPoints += d.dogScore;
  }

  // Current win streak (finals only, walking backward).
  const finals = days.filter((d) => d.status === "final");
  let streakTeam: TeamId | null = null;
  let streakLen = 0;
  for (let i = finals.length - 1; i >= 0; i--) {
    if (streakTeam === null) {
      streakTeam = finals[i].winner;
      streakLen = 1;
    } else if (finals[i].winner === streakTeam) {
      streakLen++;
    } else break;
  }

  const today_ = days.find((d) => d.status === "live") ?? null;

  return {
    year,
    days,
    today: today_,
    gloomWins,
    dogWins,
    gloomPoints,
    dogPoints,
    streakTeam,
    streakLen,
    finalsPlayed: finals.length,
  };
}

export function fmtHour(h: number | null): string {
  if (h == null) return "—";
  if (h === 12) return "12 PM";
  if (h === 0) return "12 AM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}
