// Sweeps candidate scoring windows against 5 years of June data and reports the
// all-time Gloom win% / mean index / points% for each, so we can pick the
// window that makes the rivalry closest to a coin flip. Writes a markdown table
// to analysis/window-sweep.md.
//
// Usage: node scripts/window-sweep.mjs [years...]   (default 2021-2025)

import { mkdir, writeFile } from "node:fs/promises";

const SOCKED_THRESHOLD = 50;
const WEIGHTS = { lowCloud: 0.5, sunless: 0.3, socked: 0.2 };
const WIN_THRESHOLD = 50;

const STATIONS = [
  { lat: 34.019, lon: -118.491 },
  { lat: 33.885, lon: -118.41 },
  { lat: 33.77, lon: -118.194 },
  { lat: 33.66, lon: -117.999 },
  { lat: 33.619, lon: -117.929 },
  { lat: 33.542, lon: -117.785 },
];
const TZ = "America/Los_Angeles";
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// Candidate windows as [startHour, endHourExclusive].
const WINDOWS = [
  [6, 12], [7, 12], [8, 12],
  [6, 13], [7, 13], [8, 13],
  [7, 14], [8, 14], [9, 14],
  [8, 15], [9, 15], [10, 16],
  [9, 12], [10, 13], [9, 13],
];

async function fetchYear(year) {
  const params = new URLSearchParams({
    latitude: STATIONS.map((s) => s.lat).join(","),
    longitude: STATIONS.map((s) => s.lon).join(","),
    start_date: `${year}-06-01`,
    end_date: `${year}-06-30`,
    hourly: "cloud_cover_low,sunshine_duration",
    timezone: TZ,
  });
  const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const list = Array.isArray(json) ? json : [json];
  return list.map((r) => r.hourly); // [{time, cloud_cover_low, sunshine_duration}]
}

function stationDayIndices(hourly, ws, we) {
  const byDate = new Map();
  const { time, cloud_cover_low: low, sunshine_duration: sun } = hourly;
  for (let k = 0; k < time.length; k++) {
    const hour = Number(time[k].slice(11, 13));
    if (hour < ws || hour >= we) continue;
    if (low[k] == null) continue;
    const date = time[k].slice(0, 10);
    const arr = byDate.get(date) ?? [];
    arr.push({ low: low[k], sun: sun?.[k] ?? 0 });
    byDate.set(date, arr);
  }
  const out = new Map();
  for (const [date, hrs] of byDate) {
    const n = hrs.length;
    if (!n) continue;
    const mean = hrs.reduce((s, h) => s + h.low, 0) / n;
    const sunFrac = clamp(hrs.reduce((s, h) => s + h.sun, 0) / (n * 3600), 0, 1);
    const socked = (100 * hrs.filter((h) => h.low >= SOCKED_THRESHOLD).length) / n;
    out.set(
      date,
      clamp(WEIGHTS.lowCloud * mean + WEIGHTS.sunless * (1 - sunFrac) * 100 + WEIGHTS.socked * socked),
    );
  }
  return out;
}

function evalWindow(yearsData, ws, we) {
  let gW = 0, dW = 0, gP = 0, dP = 0, sum = 0, count = 0;
  for (const stationsHourly of yearsData) {
    const perStation = stationsHourly.map((h) => stationDayIndices(h, ws, we));
    const dates = new Set();
    for (const m of perStation) for (const d of m.keys()) dates.add(d);
    for (const date of dates) {
      const idxs = perStation.map((m) => m.get(date)).filter((v) => v != null);
      if (!idxs.length) continue;
      const coastal = clamp(idxs.reduce((a, b) => a + b, 0) / idxs.length);
      const g = Math.round(coastal);
      if (coastal >= WIN_THRESHOLD) gW++;
      else dW++;
      gP += g;
      dP += 100 - g;
      sum += coastal;
      count++;
    }
  }
  return {
    ws, we, games: count,
    gloomWinPct: (100 * gW) / count,
    record: `${gW}-${dW}`,
    meanIndex: sum / count,
    gloomPtsPct: (100 * gP) / (gP + dP),
  };
}

function label(h) {
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

async function main() {
  const years = process.argv.slice(2);
  if (!years.length) for (let y = 2021; y <= 2025; y++) years.push(String(y));

  const yearsData = [];
  for (const y of years) yearsData.push(await fetchYear(y));

  const rows = WINDOWS.map(([ws, we]) => evalWindow(yearsData, ws, we)).sort(
    (a, b) => Math.abs(a.gloomWinPct - 50) - Math.abs(b.gloomWinPct - 50),
  );

  let md = `# Scoring-window sweep — ${years.join(", ")}\n\n`;
  md += `Goal: find the window where the all-time record is closest to 50/50. `;
  md += `Sorted by |Gloom win% − 50|.\n\n`;
  md += `| Window | Gloom record | Gloom win% | Mean index | Gloom points% |\n`;
  md += `|---|---|---|---|---|\n`;
  for (const r of rows) {
    md += `| ${label(r.ws)}–${label(r.we)} | ${r.record} | ${r.gloomWinPct.toFixed(1)}% | ${r.meanIndex.toFixed(1)} | ${r.gloomPtsPct.toFixed(1)}% |\n`;
  }
  md += `\n_Generated ${new Date().toISOString()} · ${rows[0] ? `closest: ${label(rows[0].ws)}–${label(rows[0].we)}` : ""}._\n`;

  await mkdir("analysis", { recursive: true });
  await writeFile("analysis/window-sweep.md", md);
  console.log(md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
