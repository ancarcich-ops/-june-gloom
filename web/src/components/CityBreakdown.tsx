import type { Season, DayResult } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { WIN_THRESHOLD } from "../lib/gloom";

// Short labels per beach; positions now come from real lat/long.
const ABBR: Record<string, string> = {
  santa_monica: "SMO",
  manhattan_beach: "MNB",
  long_beach: "LGB",
  huntington_beach: "HUN",
  newport_beach: "NWP",
  laguna_beach: "LAG",
};

function pickDay(season: Season): DayResult | null {
  if (season.todaysGame) return season.todaysGame;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1] : null;
}

// Smooth (Catmull-Rom → bézier) path through the points.
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export default function CityBreakdown({ season }: { season: Season }) {
  const day = pickDay(season);
  if (!day) return null;

  const stations = day.stations;
  const lats = stations.map((s) => s.station.lat);
  const lons = stations.map((s) => s.station.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const padX = 12, padR = 18, padT = 12, padB = 14;
  const W = 100, H = 110;
  const sx = (lon: number) => padX + ((lon - minLon) / (maxLon - minLon || 1)) * (W - padX - padR);
  const sy = (lat: number) => padT + ((maxLat - lat) / (maxLat - minLat || 1)) * (H - padT - padB);

  const rows = stations.map((s) => {
    const index = Math.round(s.index);
    return {
      id: s.station.id,
      name: s.station.name,
      abbr: ABBR[s.station.id] ?? s.station.id.slice(0, 3).toUpperCase(),
      index,
      px: sx(s.station.lon),
      py: sy(s.station.lat),
      winner: index >= WIN_THRESHOLD ? ("gloom" as const) : ("dogs" as const),
    };
  });

  const coast = smoothPath(rows.map((r) => ({ x: r.px, y: r.py })));
  const first = rows[0], last = rows[rows.length - 1];
  // Land sits to the NE (inland) of the coastline; sea fills the rest.
  const land = `${coast} L ${W} ${last.py.toFixed(2)} L ${W} 0 L ${first.px.toFixed(2)} 0 Z`;

  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(18px,2.4vw,28px)" }}>
      <div className="cb-wrap">
        {/* real coastline map (beaches at true lat/long) */}
        <div className="cb-map">
          <svg viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="rgba(120,160,195,0.12)" />
                <stop offset="1" stopColor="rgba(90,130,170,0.22)" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="url(#sea)" />
            <path d={land} fill="rgba(125,147,171,0.10)" />
            <path d={coast} fill="none" stroke="var(--border-strong)" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2.5 2" />
            {rows.map((b) => {
              const t = TEAMS[b.winner];
              const r = 2.6 + (Math.abs(b.index - 50) / 50) * 2.6;
              return (
                <g key={b.id}>
                  <circle cx={b.px} cy={b.py} r={r + 3} fill={t.glow} opacity="0.5" />
                  <circle cx={b.px} cy={b.py} r={r} fill={t.c3} stroke="#fff" strokeWidth="0.6" />
                  <text x={b.px + r + 2} y={b.py + 2.4} className="cb-pin-lbl" fill="var(--ink-soft)" style={{ fontSize: 4 }}>
                    {b.abbr} {b.index}
                  </text>
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", left: 12, top: 12, fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: ".04em" }}>
            LA &amp; OC coast · plotted by location
          </div>
        </div>

        {/* bars */}
        <div className="cb-rows">
          {rows.map((b) => {
            const t = TEAMS[b.winner];
            const fromMid = b.index - 50;
            const widthPct = (Math.abs(fromMid) / 50) * 50;
            const style =
              fromMid >= 0
                ? { left: "50%", width: `${widthPct}%`, background: `linear-gradient(90deg, ${TEAMS.gloom.c3}, ${TEAMS.gloom.c4})` }
                : { right: "50%", width: `${widthPct}%`, background: `linear-gradient(90deg, ${TEAMS.dogs.c4}, ${TEAMS.dogs.c2})` };
            return (
              <div key={b.id} className="cb-row">
                <div className="cb-name">{b.name}<small>{b.abbr}</small></div>
                <div className="cb-track">
                  <span className="cb-mid" />
                  <span className="cb-fill" style={style} />
                </div>
                <div className="cb-val" style={{ color: t.c3 }}>{b.index}</div>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-faint)", fontWeight: 600, marginTop: 2, paddingLeft: 136 }}>
            <span style={{ color: TEAMS.dogs.c3 }}>← Cleared (Dogs)</span>
            <span style={{ color: TEAMS.gloom.c3 }}>Socked in (Gloom) →</span>
          </div>
        </div>
      </div>

      {/* legend explaining the map */}
      <div className="cb-legend">
        <span><i style={{ background: TEAMS.dogs.c3 }} />Gold dot = sun winning that beach (index &lt; 50)</span>
        <span><i style={{ background: TEAMS.gloom.c3 }} />Slate dot = fog winning (index ≥ 50)</span>
        <span>Bigger dot = more lopsided</span>
        <span>Dashed line = the coastline</span>
      </div>
    </div>
  );
}
