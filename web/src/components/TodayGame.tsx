import { motion } from "framer-motion";
import type { Season, DayResult } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { fmtHour } from "../lib/gloom";

function pickDay(season: Season): DayResult | null {
  if (season.today) return season.today;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1] : null;
}

export default function TodayGame({ season }: { season: Season }) {
  const day = pickDay(season);
  if (!day) {
    return (
      <section className="mx-auto mt-6 w-full max-w-4xl">
        <div className="card-glass rounded-3xl p-6 text-center text-white/60">
          The first whistle blows June 1. No game on the board yet.
        </div>
      </section>
    );
  }

  const live = day.status === "live";
  const winner = TEAMS[day.winner];
  const cleared = day.stations.filter((s) => s.burnOffHour != null);
  const stillSocked = day.stations.length - cleared.length;
  const avgBurn =
    cleared.length > 0
      ? Math.round(
          cleared.reduce((s, c) => s + (c.burnOffHour as number), 0) /
            cleared.length,
        )
      : null;

  const dateLabel = new Date(day.date + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl">
      <div className="card-glass rounded-3xl p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white/90">
            {live ? "Today's Game" : "Latest Final"}
          </h2>
          {live ? (
            <span className="flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300">
              <span className="h-2 w-2 animate-pulseglow rounded-full bg-red-400" />
              Live · {dateLabel}
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
              Final · {dateLabel}
            </span>
          )}
        </div>

        {/* Score line */}
        <div className="flex items-center justify-between">
          <div className="text-left">
            <div className="text-2xl">{TEAMS.dogs.emoji}</div>
            <div className="led text-5xl font-extrabold text-dogs-400">
              {day.dogScore}
            </div>
            <div className="text-xs uppercase tracking-wider text-white/45">
              {TEAMS.dogs.short}
            </div>
          </div>

          <div className="text-center text-white/40">
            <div className="text-xs uppercase tracking-widest">Gloom Index</div>
            <div className="led text-2xl font-bold text-white/70">
              {day.gloomScore}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl">{TEAMS.gloom.emoji}</div>
            <div className="led text-5xl font-extrabold text-gloom-400">
              {day.gloomScore}
            </div>
            <div className="text-xs uppercase tracking-wider text-white/45">
              {TEAMS.gloom.short}
            </div>
          </div>
        </div>

        {/* Tug-of-war bar */}
        <div className="relative mt-4 h-5 overflow-hidden rounded-full bg-dogs-500/70">
          <motion.div
            className="absolute right-0 top-0 h-full bg-gloom-500"
            initial={{ width: "50%" }}
            animate={{ width: `${day.gloomScore}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
          {/* midline */}
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/50" />
        </div>

        <p className="mt-4 text-center text-sm text-white/65">
          {live ? "Currently leading: " : "Winner: "}
          <span className="font-semibold" style={{ color: winner.accent }}>
            {winner.emoji} {winner.name}
          </span>
        </p>

        {/* Marine-layer status */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Cities socked in" value={`${stillSocked}/${day.stations.length}`} />
          <Stat label="Cities cleared" value={`${cleared.length}/${day.stations.length}`} />
          <Stat label="Avg burn-off" value={avgBurn != null ? fmtHour(avgBurn) : "—"} />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="led text-xl font-bold text-white/90">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-white/45">
        {label}
      </div>
    </div>
  );
}
