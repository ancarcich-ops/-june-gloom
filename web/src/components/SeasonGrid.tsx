import { motion } from "framer-motion";
import type { Season, DayResult } from "../lib/types";
import { TEAMS } from "../lib/teams";

export default function SeasonGrid({ season }: { season: Season }) {
  return (
    <section className="mx-auto mt-6 w-full max-w-4xl">
      <div className="card-glass rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white/90">
            Season Ledger · June {season.year}
          </h2>
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-white/45">
            <Legend color={TEAMS.dogs.accent} label="Dogs" />
            <Legend color={TEAMS.gloom.accent} label="Gloom" />
            <Legend color="#3b4654" label="Upcoming" />
          </div>
        </div>

        <div className="thin-scroll flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((dom) => {
            const day = season.days.find((d) => d.dayOfMonth === dom);
            return (
              <DayChip key={dom} dom={dom} day={day} index={dom} />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function DayChip({
  dom,
  day,
  index,
}: {
  dom: number;
  day: DayResult | undefined;
  index: number;
}) {
  const empty = !day;
  const upcoming = day?.status === "upcoming";
  const live = day?.status === "live";
  const team = day ? TEAMS[day.winner] : null;

  let bg = "rgba(255,255,255,0.04)";
  if (day && !upcoming) bg = `${team!.accent}26`;
  if (upcoming) bg = "rgba(59,70,84,0.35)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.5), duration: 0.3 }}
      title={
        day
          ? `June ${dom} — ${team!.short} ${Math.max(
              day.dogScore,
              day.gloomScore,
            )}–${Math.min(day.dogScore, day.gloomScore)} (${day.status})`
          : `June ${dom}`
      }
      className="relative flex min-w-[52px] flex-col items-center rounded-xl px-2 py-2.5"
      style={{
        background: bg,
        boxShadow:
          day && !upcoming ? `inset 0 0 0 1px ${team!.accent}55` : "none",
      }}
    >
      <span className="text-[10px] font-semibold uppercase text-white/40">
        Jun
      </span>
      <span className="led text-base font-bold text-white/90">{dom}</span>
      {day && !empty ? (
        <span
          className="led mt-0.5 text-[11px] font-bold"
          style={{ color: team!.accent }}
        >
          {day.winner === "gloom" ? day.gloomScore : day.dogScore}
        </span>
      ) : (
        <span className="mt-0.5 text-[11px] text-white/25">·</span>
      )}
      {live && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulseglow rounded-full bg-red-400" />
      )}
    </motion.div>
  );
}
