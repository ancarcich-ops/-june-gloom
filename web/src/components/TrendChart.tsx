import type { Season } from "../lib/types";
import { TEAMS } from "../lib/teams";

export default function TrendChart({ season }: { season: Season }) {
  const days = season.days.filter((d) => d.status !== "upcoming");
  if (days.length < 2) return null;

  const W = 100, H = 46, pad = 4;
  const pts = days.map((d, i) => {
    const x = pad + (i / (days.length - 1)) * (W - pad * 2);
    const y = pad + (1 - d.gloomIndex / 100) * (H - pad * 2);
    return { x, y, index: d.gloomIndex, live: d.status === "live" };
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const midY = pad + 0.5 * (H - pad * 2);
  const areaGloom = `${line} L${pts[pts.length - 1].x} ${midY} L${pts[0].x} ${midY} Z`;
  const live = pts[pts.length - 1];

  return (
    <div className="jg-card jg-rise tc-wrap" style={{ padding: "clamp(18px,2.4vw,28px)" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        <defs>
          <linearGradient id="tcg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={TEAMS.gloom.c2} stopOpacity="0.32" />
            <stop offset="1" stopColor={TEAMS.gloom.c3} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={W} height={midY} fill={TEAMS.gloom.c3} opacity="0.05" />
        <path d={areaGloom} fill="url(#tcg)" />
        <line x1={pad} y1={midY} x2={W - pad} y2={midY} stroke="var(--ink-faint)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />
        <text x={pad} y={midY - 1.4} fill="var(--ink-faint)" style={{ fontSize: 3 }}>50 · coin-flip</text>
        <path d={line} fill="none" stroke="var(--ink)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => {
          const w = p.index >= 50 ? "gloom" : "dogs";
          return <circle key={i} cx={p.x} cy={p.y} r={p.live ? 1.7 : 1.1} fill={TEAMS[w].c3} stroke="var(--surfaceSolid)" strokeWidth="0.5" />;
        })}
        <circle cx={live.x} cy={live.y} r="2.6" fill="none" stroke="#e0392b" strokeWidth="0.6">
          <animate attributeName="r" values="2;3.4;2" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="tc-legend">
        <span><i style={{ background: TEAMS.gloom.c3 }} />Above 50 = Gloom controls the day</span>
        <span><i style={{ background: TEAMS.dogs.c3 }} />Below 50 = Dogs burn it off</span>
      </div>
    </div>
  );
}
