import type {
  StationSeries,
  StationDay,
  HourPoint,
  DayResult,
  Season,
  TeamId,
  DayStatus,
} from "./types";
import { laTodayISO, laHour, seasonYear } from "./openMeteo";

// --------------------------------------------------------------------------
// Tunable constants — the methodology page reads these so docs == reality.
// --------------------------------------------------------------------------

/** Scoring window: 7 AM through 11 AM local (the 7 AM–noon span) — the burn-off
 *  hours. We skip the always-gray pre-dawn 6 AM hour and the reliably-sunny
 *  afternoon, leaving the window where the marine layer actually decides whether
 *  to hold or clear. Calibrated against 5 years so the rivalry is ~50/50. */
export const WINDOW_START = 7;
export const WINDOW_END = 12; // exclusive (window closes at noon)

/** Low-cloud cover (%) at or above which an hour counts as "socked in". */
export const SOCKED_THRESHOLD = 50;

/** Weights for the three components of the daily Gloom Index (sum to 1). */
export const WEIGHTS = {
  lowCloud: 0.5, // how thick the marine layer was
  sunless: 0.3, // how little sun actually reached the ground
  socked: 0.2, // how much of the window stayed socked in
} as const;

/** Index at or above this = a Gloom win; below = a Big Dogs win. */
export const WIN_THRESHOLD = 50;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

// --------------------------------------------------------------------------
// Per-station, per-day index
// --------------------------------------------------------------------------

/**
 * The pure Gloom Index math for a single beach-day. Takes a day's worth of
 * hourly points, keeps only the scoring window, and returns the index plus its
 * component stats — or null if no window hours have data. Exported for testing.
 */
export function windowIndex(
  dayHours: HourPoint[],
): Omit<StationDay, "station"> | null {
  const hours = dayHours.filter(
    (h) => h.hour >= WINDOW_START && h.hour < WINDOW_END,
  );
  if (hours.length === 0) return null;

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

  // First window hour the low cloud dropped below threshold = burn-off.
  const cleared = hours
    .slice()
    .sort((a, b) => a.hour - b.hour)
    .find((h) => h.lowCloud < SOCKED_THRESHOLD);

  return {
    index,
    meanLowCloud,
    sunFraction,
    pctSocked,
    burnOffHour: cleared ? cleared.hour : null,
    windowHours: n,
  };
}

function stationDays(series: StationSeries): Map<string, StationDay> {
  const byDate = new Map<string, HourPoint[]>();
  for (const h of series.hours) {
    const arr = byDate.get(h.date) ?? [];
    arr.push(h);
    byDate.set(h.date, arr);
  }

  const out = new Map<string, StationDay>();
  for (const [date, hours] of byDate) {
    const stats = windowIndex(hours);
    if (stats) out.set(date, { station: series.station, ...stats });
  }
  return out;
}

function statusFor(date: string, today: string, nowHour: number): DayStatus {
  if (date < today) return "final";
  if (date > today) return "upcoming";
  // Today: the scoring window closes at noon (WINDOW_END), so once it's past
  // noon PT every window hour is observed and the game is final.
  return nowHour >= WINDOW_END ? "final" : "live";
}

// --------------------------------------------------------------------------
// Coastal aggregation + season build
// --------------------------------------------------------------------------

export function buildSeason(allSeries: StationSeries[]): Season {
  const today = laTodayISO();
  const nowHour = laHour();
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
      status: statusFor(date, today, nowHour),
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

  // Count today's in-progress game provisionally so the board is never blank on
  // opening day. It contributes points live but only becomes a W/L at midnight.
  const liveDay = days.find((d) => d.status === "live");
  if (liveDay) {
    gloomPoints += liveDay.gloomScore;
    dogPoints += liveDay.dogScore;
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
  const todaysGame = days.find((d) => d.date === today) ?? null;

  return {
    year,
    days,
    today: today_,
    todaysGame,
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
