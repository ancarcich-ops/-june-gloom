import type { Station, StationSeries, HourPoint } from "./types";

/**
 * LA + Orange County coastal panel. These are the marine-layer beaches that
 * decide the June Gloom Bowl — no Santa Barbara, no San Diego.
 */
export const STATIONS: Station[] = [
  { id: "santa_monica", name: "Santa Monica", county: "LA", lat: 34.019, lon: -118.491 },
  { id: "manhattan_beach", name: "Manhattan Beach", county: "LA", lat: 33.885, lon: -118.41 },
  { id: "long_beach", name: "Long Beach", county: "LA", lat: 33.77, lon: -118.194 },
  { id: "huntington_beach", name: "Huntington Beach", county: "OC", lat: 33.66, lon: -117.999 },
  { id: "newport_beach", name: "Newport Beach", county: "OC", lat: 33.619, lon: -117.929 },
  { id: "laguna_beach", name: "Laguna Beach", county: "OC", lat: 33.542, lon: -117.785 },
];

export const TZ = "America/Los_Angeles";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

/** Today's calendar date in LA, as a YYYY-MM-DD string. */
export function laTodayISO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function seasonYear(): number {
  return Number(laTodayISO().slice(0, 4));
}

/** Current hour (0–23) in LA local time. */
export function laHour(): number {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return Number(s) % 24;
}

function daysSinceJune1(): number {
  const today = new Date(laTodayISO() + "T00:00:00");
  const june1 = new Date(`${today.getFullYear()}-06-01T00:00:00`);
  const ms = today.getTime() - june1.getTime();
  return Math.floor(ms / 86_400_000);
}

interface RawHourly {
  time: string[];
  cloud_cover_low: number[];
  sunshine_duration: number[];
}
interface RawResponse {
  latitude: number;
  longitude: number;
  hourly: RawHourly;
}

/**
 * One batched request for all stations (Open-Meteo accepts comma-separated
 * coordinates and returns an array in the same order).
 */
export async function fetchSeason(): Promise<StationSeries[]> {
  const pastDays = Math.min(Math.max(daysSinceJune1() + 1, 1), 92);
  const params = new URLSearchParams({
    latitude: STATIONS.map((s) => s.lat).join(","),
    longitude: STATIONS.map((s) => s.lon).join(","),
    hourly: "cloud_cover_low,sunshine_duration",
    timezone: TZ,
    past_days: String(pastDays),
    forecast_days: "3",
  });

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const json = await res.json();
  const list: RawResponse[] = Array.isArray(json) ? json : [json];

  return STATIONS.map((station, i) => {
    const h = list[i]?.hourly;
    const hours: HourPoint[] = [];
    if (h?.time) {
      for (let k = 0; k < h.time.length; k++) {
        const t = h.time[k];
        const low = h.cloud_cover_low?.[k];
        const sun = h.sunshine_duration?.[k];
        if (low == null) continue;
        hours.push({
          time: t,
          date: t.slice(0, 10),
          hour: Number(t.slice(11, 13)),
          lowCloud: low,
          sunshineSec: sun ?? 0,
        });
      }
    }
    return { station, hours };
  });
}
