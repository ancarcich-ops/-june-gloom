import type { Season, DayResult } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { WIN_THRESHOLD } from "../lib/gloom";

// Stylized coastline coords (0..1), north → south, + short labels.
const GEO: Record<string, { abbr: string; x: number; y: number }> = {
  santa_monica: { abbr: "SMO", x: 0.14, y: 0.1 },
  manhattan_beach: { abbr: "MNB", x: 0.3, y: 0.3 },
  long_beach: { abbr: "LGB", x: 0.46, y: 0.48 },
  huntington_beach: { abbr: "HUN", x: 0.6, y: 0.62 },
  newport_beach: { abbr: "NWP", x: 0.72, y: 0.74 },
  laguna_beach: { abbr: "LAG", x: 0.84, y: 0.86 },
};

function pickDay(season: Season): DayResult | null {
  if (season.todaysGame) return season.todaysGame;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1] : null;
}

export default function CityBreakdown({ season }: { season: Season }) {
  const day = pickDay(season);
  if (!day) return null;

  const rows = day.stations.map((s) => {
    const index = Math.round(s.index);
    const geo = GEO[s.station.id] ?? { abbr: s.station.id.slice(0, 3).toUpperCase(), x: 0.5, y: 0.5 };
    return { id: s.station.id, name: s.station.name, index, ...geo, winner: index >= WIN_THRESHOLD ? ("gloom" as const) : ("dogs" as const) };
  });

  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(18px,2.4vw,28px)" }}>
      <div className="cb-wrap">
        {/* coastline map */}
        <div className="cb-map">
          <svg viewBox="0 0 100 110" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="rgba(120,160,195,0.10)" />
                <stop offset="1" stopColor="rgba(90,130,170,0.20)" />
              </linearGradient>
            </defs>
            <path d="M100 0 L100 110 L8 110 C26 86 40 70 52 52 C64 34 74 18 100 0 Z" fill="rgba(125,147,171,0.07)" />
            <path d="M8 110 C26 86 40 70 52 52 C64 34 74 18 100 0 L100 0 L0 0 L0 110 Z" fill="url(#sea)" />
            <path d="M8 110 C26 86 40 70 52 52 C64 34 74 18 100 0" fill="none" stroke="var(--border-strong)" strokeWidth="0.8" strokeDasharray="2 2" />
            {rows.map((b) => {
              const t = TEAMS[b.winner];
              const r = 2.6 + (Math.abs(b.index - 50) / 50) * 2.6;
              const px = 8 + b.x * 78, py = 6 + b.y * 92;
              return (
                <g key={b.id}>
                  <circle cx={px} cy={py} r={r + 3} fill={t.glow} opacity="0.5" />
                  <circle cx={px} cy={py} r={r} fill={t.c3} stroke="#fff" strokeWidth="0.6" />
                  <text x={px + r + 2} y={py + 2.4} className="cb-pin-lbl" fill="var(--ink-soft)" style={{ fontSize: 4 }}>{b.abbr}</text>
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", left: 12, top: 12, fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: ".04em" }}>
            SoCal coast · {rows.length} beaches
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
    </div>
  );
}
