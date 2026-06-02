// Fetches TODAY's live data (Open-Meteo forecast endpoint, same source the app
// uses) and computes today's coastal Gloom Index on the current 7 AM–noon
// window, alongside the old 6 AM–noon window for comparison. Writes analysis/today.md.

import { mkdir, writeFile } from "node:fs/promises";

const SOCKED_THRESHOLD = 50;
const WEIGHTS = { lowCloud: 0.5, sunless: 0.3, socked: 0.2 };
const STATIONS = [
  { name: "Santa Monica", lat: 34.019, lon: -118.491 },
  { name: "Manhattan Beach", lat: 33.885, lon: -118.41 },
  { name: "Long Beach", lat: 33.77, lon: -118.194 },
  { name: "Huntington Beach", lat: 33.66, lon: -117.999 },
  { name: "Newport Beach", lat: 33.619, lon: -117.929 },
  { name: "Laguna Beach", lat: 33.542, lon: -117.785 },
];
const TZ = "America/Los_Angeles";
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const todayISO = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });

async function fetchToday() {
  const params = new URLSearchParams({
    latitude: STATIONS.map((s) => s.lat).join(","),
    longitude: STATIONS.map((s) => s.lon).join(","),
    hourly: "cloud_cover_low,sunshine_duration",
    timezone: TZ,
    past_days: "1",
    forecast_days: "1",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [json];
}

function indexFor(hourly, date, ws, we) {
  const { time, cloud_cover_low: low, sunshine_duration: sun } = hourly;
  const hrs = [];
  for (let k = 0; k < time.length; k++) {
    if (time[k].slice(0, 10) !== date) continue;
    const hour = Number(time[k].slice(11, 13));
    if (hour < ws || hour >= we) continue;
    if (low[k] == null) continue;
    hrs.push({ low: low[k], sun: sun?.[k] ?? 0 });
  }
  if (!hrs.length) return null;
  const n = hrs.length;
  const mean = hrs.reduce((s, h) => s + h.low, 0) / n;
  const sunFrac = clamp(hrs.reduce((s, h) => s + h.sun, 0) / (n * 3600), 0, 1);
  const socked = (100 * hrs.filter((h) => h.low >= SOCKED_THRESHOLD).length) / n;
  return clamp(WEIGHTS.lowCloud * mean + WEIGHTS.sunless * (1 - sunFrac) * 100 + WEIGHTS.socked * socked);
}

function coastal(raw, date, ws, we) {
  const idxs = raw.map((r) => indexFor(r.hourly, date, ws, we)).filter((v) => v != null);
  if (!idxs.length) return null;
  return clamp(idxs.reduce((a, b) => a + b, 0) / idxs.length);
}

async function main() {
  const date = todayISO();
  const raw = await fetchToday();

  const cur = coastal(raw, date, 7, 12); // current window
  const old = coastal(raw, date, 6, 12); // previous window

  const fmt = (v) =>
    v == null ? "no data yet" : `Gloom ${Math.round(v)}–${100 - Math.round(v)} Dogs (index ${v.toFixed(1)}, ${v >= 50 ? "🌫️ Gloom" : "🌞 Dogs"} lead)`;

  let md = `# Today — ${date}\n\n`;
  md += `Computed live from Open-Meteo forecast (same source as the site).\n\n`;
  md += `- **7 AM–noon (current):** ${fmt(cur)}\n`;
  md += `- **6 AM–noon (old):** ${fmt(old)}\n\n`;
  md += `## Per-beach (7 AM–noon)\n\n| Beach | Index |\n|---|---|\n`;
  raw.forEach((r, i) => {
    const v = indexFor(r.hourly, date, 7, 12);
    md += `| ${STATIONS[i].name} | ${v == null ? "—" : v.toFixed(1)} |\n`;
  });
  md += `\n_Generated ${new Date().toISOString()}._\n`;

  await mkdir("analysis", { recursive: true });
  await writeFile("analysis/today.md", md);
  console.log(md);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
