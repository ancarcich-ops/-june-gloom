// One-off: dump what Open-Meteo actually reported for each station's 7 AM–noon
// window today, so we can see why an index is what it is. Writes analysis/today-debug.md.

import { mkdir, writeFile } from "node:fs/promises";

const WINDOW_START = 7, WINDOW_END = 12, SOCKED = 50;
const W = { lowCloud: 0.5, sunless: 0.3, socked: 0.2 };
const STATIONS = [
  { id: "santa_monica", name: "Santa Monica", lat: 34.019, lon: -118.491 },
  { id: "manhattan_beach", name: "Manhattan Beach", lat: 33.885, lon: -118.41 },
  { id: "garden_grove", name: "Garden Grove", lat: 33.774, lon: -117.941 },
  { id: "long_beach", name: "Long Beach", lat: 33.77, lon: -118.194 },
  { id: "huntington_beach", name: "Huntington Beach", lat: 33.66, lon: -117.999 },
  { id: "newport_beach", name: "Newport Beach", lat: 33.619, lon: -117.929 },
  { id: "laguna_beach", name: "Laguna Beach", lat: 33.542, lon: -117.785 },
];
const TZ = "America/Los_Angeles";
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const today = new Date().toLocaleDateString("en-CA", { timeZone: TZ });

const p = new URLSearchParams({
  latitude: STATIONS.map((s) => s.lat).join(","),
  longitude: STATIONS.map((s) => s.lon).join(","),
  hourly: "cloud_cover_low,sunshine_duration",
  timezone: TZ,
  past_days: "1",
  forecast_days: "1",
});
const res = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`);
const json = await res.json();
const list = Array.isArray(json) ? json : [json];

let md = `# Today debug — ${today} (7 AM–noon window)\n\n`;
md += `_Generated ${new Date().toISOString()} · low-cloud % per hour, then computed index._\n\n`;
md += `| Station | 7 | 8 | 9 | 10 | 11 | meanLow | sun% | socked | Index |\n|---|---|---|---|---|---|---|---|---|---|\n`;

list.forEach((r, i) => {
  const h = r.hourly;
  const rows = [];
  for (let k = 0; k < h.time.length; k++) {
    if (h.time[k].slice(0, 10) !== today) continue;
    const hr = Number(h.time[k].slice(11, 13));
    if (hr < WINDOW_START || hr >= WINDOW_END) continue;
    rows.push({ hr, low: h.cloud_cover_low[k], sun: h.sunshine_duration?.[k] ?? 0 });
  }
  rows.sort((a, b) => a.hr - b.hr);
  const n = rows.length || 1;
  const meanLow = rows.reduce((a, b) => a + b.low, 0) / n;
  const sunFrac = clamp(rows.reduce((a, b) => a + b.sun, 0) / (n * 3600), 0, 1);
  const socked = (100 * rows.filter((b) => b.low >= SOCKED).length) / n;
  const index = clamp(W.lowCloud * meanLow + W.sunless * (1 - sunFrac) * 100 + W.socked * socked);
  const cells = [7, 8, 9, 10, 11].map((hr) => {
    const f = rows.find((b) => b.hr === hr);
    return f ? String(f.low) : "—";
  });
  md += `| ${STATIONS[i].name} | ${cells.join(" | ")} | ${meanLow.toFixed(0)} | ${(sunFrac * 100).toFixed(0)} | ${socked.toFixed(0)} | **${Math.round(index)}** |\n`;
});

await mkdir("analysis", { recursive: true });
await writeFile("analysis/today-debug.md", md);
console.log(md);
