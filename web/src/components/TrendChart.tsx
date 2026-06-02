import type { Season } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { WIN_THRESHOLD } from "../lib/gloom";

/**
 * Lightweight inline-SVG sparkline of the daily coastal Gloom Index across the
 * season. No charting dependency — just a path with a 50-line baseline.
 */
export default function TrendChart({ season }: { season: Season }) {
  const days = season.days.filter((d) => d.status !== "upcoming");
  if (days.length < 2) return null;

  const W = 720;
  const H = 180;
  const padX = 8;
  const padY = 16;
  const n = days.length;

  const x = (i: number) => padX + (i * (W - 2 * padX)) / Math.max(n - 1, 1);
  const y = (v: number) => padY + ((100 - v) * (H - 2 * padY)) / 100;

  const pts = days.map((d, i) => `${x(i)},${y(d.gloomIndex)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${x(n - 1)},${H - padY} L ${x(0)},${H - padY} Z`;
  const midY = y(WIN_THRESHOLD);

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl">
      <div className="card-glass rounded-3xl p-5 sm:p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-white/90">
          Gloom Index Trend
        </h2>
        <p className="mb-3 text-xs text-white/45">
          Daily coastal index. Above the line is {TEAMS.gloom.short} territory,
          below is {TEAMS.dogs.short}.
        </p>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="gloomFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAMS.gloom.accent} stopOpacity="0.35" />
              <stop offset="100%" stopColor={TEAMS.gloom.accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 50-line */}
          <line
            x1={padX}
            x2={W - padX}
            y1={midY}
            y2={midY}
            stroke="rgba(255,255,255,0.25)"
            strokeDasharray="4 4"
          />
          <path d={area} fill="url(#gloomFill)" />
          <path
            d={line}
            fill="none"
            stroke={TEAMS.gloom.accent}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {days.map((d, i) => (
            <circle
              key={d.date}
              cx={x(i)}
              cy={y(d.gloomIndex)}
              r={2.5}
              fill={TEAMS[d.winner].accent}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
