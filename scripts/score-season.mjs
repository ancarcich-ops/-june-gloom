// Replays a full June season through the EXACT Gloom Index methodology used by
// the live app (web/src/lib/gloom.ts). Fetches historical hourly data from
// Open-Meteo's archive API, computes per-beach indices, and tallies the season.
//
// Usage: node scripts/score-season.mjs [year]   (default 2025)
//
// NOTE: keep these constants in sync with web/src/lib/gloom.ts.

import { mkdir, writeFile, readFile } from "node:fs/promises";

const WINDOW_START = 8;
const WINDOW_END = 15; // exclusive (8 AM–3 PM beach-hours window)
const SOCKED_THRESHOLD = 50;
const WEIGHTS = { lowCloud: 0.5, sunless: 0.3, socked: 0.2 };
const WIN_THRESHOLD = 50;

const STATIONS = [
  { id: "santa_monica", name: "Santa Monica", county: "LA", lat: 34.019, lon: -118.491 },
  { id: "manhattan_beach", name: "Manhattan Beach", county: "LA", lat: 33.885, lon: -118.41 },
  { id: "long_beach", name: "Long Beach", county: "LA", lat: 33.77, lon: -118.194 },
  { id: "huntington_beach", name: "Huntington Beach", county: "OC", lat: 33.66, lon: -117.999 },
  { id: "newport_beach", name: "Newport Beach", county: "OC", lat: 33.619, lon: -117.929 },
  { id: "laguna_beach", name: "Laguna Beach", county: "OC", lat: 33.542, lon: -117.785 },
];

const TZ = "America/Los_Angeles";
const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

async function fetchArchive(year) {
  const params = new URLSearchParams({
    latitude: STATIONS.map((s) => s.lat).join(","),
    longitude: STATIONS.map((s) => s.lon).join(","),
    start_date: `${year}-06-01`,
    end_date: `${year}-06-30`,
    hourly: "cloud_cover_low,sunshine_duration",
    timezone: TZ,
  });
  const url = `https://archive-api.open-meteo.com/v1/archive?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return Array.isArray(json) ? json : [json];
}

function stationDayIndex(times, low, sun) {
  // Group window hours by date.
  const byDate = new Map();
  for (let k = 0; k < times.length; k++) {
    const hour = Number(times[k].slice(11, 13));
    if (hour < WINDOW_START || hour >= WINDOW_END) continue;
    const date = times[k].slice(0, 10);
    if (low[k] == null) continue;
    const arr = byDate.get(date) ?? [];
    arr.push({ low: low[k], sun: sun?.[k] ?? 0 });
    byDate.set(date, arr);
  }
  const out = new Map();
  for (const [date, hours] of byDate) {
    const n = hours.length;
    if (!n) continue;
    const meanLowCloud = hours.reduce((s, h) => s + h.low, 0) / n;
    const sunFraction = clamp(hours.reduce((s, h) => s + h.sun, 0) / (n * 3600), 0, 1);
    const pctSocked = (100 * hours.filter((h) => h.low >= SOCKED_THRESHOLD).length) / n;
    const index = clamp(
      WEIGHTS.lowCloud * meanLowCloud +
        WEIGHTS.sunless * (1 - sunFraction) * 100 +
        WEIGHTS.socked * pctSocked,
    );
    out.set(date, index);
  }
  return out;
}

async function runYear(year) {
  const raw = await fetchArchive(year);

  const perStation = STATIONS.map((s, i) => {
    const h = raw[i]?.hourly;
    return stationDayIndex(h.time, h.cloud_cover_low, h.sunshine_duration);
  });

  const dates = new Set();
  for (const m of perStation) for (const d of m.keys()) dates.add(d);

  const days = [];
  for (const date of [...dates].sort()) {
    const idxs = perStation.map((m) => m.get(date)).filter((v) => v != null);
    if (!idxs.length) continue;
    const gloomIndex = clamp(idxs.reduce((a, b) => a + b, 0) / idxs.length);
    const gloomScore = Math.round(gloomIndex);
    const winner = gloomIndex >= WIN_THRESHOLD ? "gloom" : "dogs";
    days.push({ date, gloomIndex, gloomScore, dogScore: 100 - gloomScore, winner });
  }

  let gloomWins = 0, dogWins = 0, gloomPoints = 0, dogPoints = 0;
  for (const d of days) {
    if (d.winner === "gloom") gloomWins++;
    else dogWins++;
    gloomPoints += d.gloomScore;
    dogPoints += d.dogScore;
  }

  const seasonWinner = gloomPoints > dogPoints ? "THE GLOOM + GRANT 🌫️"
    : dogPoints > gloomPoints ? "THE BIG DOGS 🌞" : "TIE";
  const biggest = [...days].sort((a, b) => Math.abs(b.gloomScore - 50) - Math.abs(a.gloomScore - 50))[0];

  // ---- Markdown report ----
  let md = `# June ${year} — replayed through the current Gloom Index methodology\n\n`;
  md += `> Source: Open-Meteo archive API · 6 LA+OC beaches · 8 AM–3 PM window · `;
  md += `weights ${WEIGHTS.lowCloud}/${WEIGHTS.sunless}/${WEIGHTS.socked} · win at ${WIN_THRESHOLD}\n\n`;
  md += `## Final score\n\n`;
  md += `| Team | Record (W–L) | Season points |\n|---|---|---|\n`;
  md += `| 🌞 Big Dogs | ${dogWins}–${gloomWins} | **${dogPoints}** |\n`;
  md += `| 🌫️ The Gloom + Grant | ${gloomWins}–${dogWins} | **${gloomPoints}** |\n\n`;
  md += `**Season winner: ${seasonWinner}** by ${Math.abs(gloomPoints - dogPoints)} points `;
  md += `over ${days.length} games.\n\n`;
  md += `Biggest blowout: June ${Number(biggest.date.slice(8))} — `;
  md += `${biggest.winner === "gloom" ? "Gloom" : "Dogs"} ${Math.max(biggest.gloomScore, biggest.dogScore)}–${Math.min(biggest.gloomScore, biggest.dogScore)}.\n\n`;
  md += `## Daily box score\n\n| Date | Gloom Index | Score (G–D) | Winner |\n|---|---|---|---|\n`;
  for (const d of days) {
    md += `| Jun ${Number(d.date.slice(8))} | ${d.gloomIndex.toFixed(1)} | ${d.gloomScore}–${d.dogScore} | ${d.winner === "gloom" ? "🌫️ Gloom" : "🌞 Dogs"} |\n`;
  }
  md += `\n_Generated ${new Date().toISOString()}._\n`;

  await mkdir("analysis", { recursive: true });
  await writeFile(`analysis/season-${year}-report.md`, md);

  // ---- Console summary ----
  console.log(`\n=== June ${year} final (current methodology) ===`);
  console.log(`Big Dogs:          ${dogWins}-${gloomWins}   ${dogPoints} pts`);
  console.log(`The Gloom + Grant: ${gloomWins}-${dogWins}   ${gloomPoints} pts`);
  console.log(`Winner: ${seasonWinner} by ${Math.abs(gloomPoints - dogPoints)} pts over ${days.length} games\n`);

  return {
    year: Number(year),
    winner: gloomPoints >= dogPoints ? "gloom" : "dogs",
    gloomWins,
    dogWins,
    gloomPoints,
    dogPoints,
    margin: Math.abs(gloomPoints - dogPoints),
    games: days.length,
    biggest: {
      date: biggest.date,
      winner: biggest.winner,
      win: Math.max(biggest.gloomScore, biggest.dogScore),
      lose: Math.min(biggest.gloomScore, biggest.dogScore),
    },
    scores: days.map((d) => d.gloomScore),
  };
}

const HISTORY_PATH = "web/src/data/history.json";

async function main() {
  const years = process.argv.slice(2);
  if (!years.length) years.push("2025");

  const summaries = [];
  for (const year of years) summaries.push(await runYear(year));

  // Merge with any existing history so a partial run never wipes other years.
  let existing = [];
  try {
    existing = JSON.parse(await readFile(HISTORY_PATH, "utf8")).seasons ?? [];
  } catch {
    /* first run */
  }
  const byYear = new Map(existing.map((s) => [s.year, s]));
  for (const s of summaries) byYear.set(s.year, s);
  const seasons = [...byYear.values()].sort((a, b) => b.year - a.year);

  await mkdir("web/src/data", { recursive: true });
  await writeFile(HISTORY_PATH, JSON.stringify({ seasons }, null, 2) + "\n");
  console.log(`Wrote ${HISTORY_PATH} (${seasons.length} seasons).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
