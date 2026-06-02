import type { Season } from "../lib/types";
import { TEAMS } from "../lib/teams";

export default function SeasonGrid({ season }: { season: Season }) {
  const byDay = new Map(season.days.map((d) => [d.dayOfMonth, d]));
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(18px,2.4vw,28px)" }}>
      <div className="ss-grid" style={{ marginBottom: 18 }}>
        {days.map((d) => {
          const g = byDay.get(d);
          if (!g || g.status === "upcoming") {
            return (
              <div key={d} className="ss-chip up">
                <span className="d">{String(d).padStart(2, "0")}</span>
                <span className="idx">—</span>
              </div>
            );
          }
          const t = TEAMS[g.winner];
          const live = g.status === "live";
          return (
            <div
              key={d}
              className={`ss-chip${live ? " live" : ""}`}
              title={`June ${d} · Gloom Index ${g.gloomScore} · ${t.name} ${live ? "(live)" : "win"}`}
            >
              <span className="d">{String(d).padStart(2, "0")}{live ? " ●" : ""}</span>
              <span className="idx" style={{ color: t.c3 }}>{g.gloomScore}</span>
              <span className="bar" style={{ background: t.c3 }} />
            </div>
          );
        })}
      </div>
      <div className="ss-legend">
        <span><i style={{ background: TEAMS.dogs.c3 }} />Dogs day (index &lt; 50)</span>
        <span><i style={{ background: TEAMS.gloom.c3 }} />Gloom day (index ≥ 50)</span>
        <span style={{ color: "var(--ink-faint)" }}>Number = day's Gloom Index</span>
      </div>
    </div>
  );
}
