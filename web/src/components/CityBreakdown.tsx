import { motion } from "framer-motion";
import type { Season } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { fmtHour, WIN_THRESHOLD } from "../lib/gloom";

function pickDay(season: Season) {
  if (season.today) return season.today;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1] : null;
}

export default function CityBreakdown({ season }: { season: Season }) {
  const day = pickDay(season);
  if (!day) return null;

  const rows = [...day.stations].sort((a, b) => b.index - a.index);

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl">
      <div className="card-glass rounded-3xl p-5 sm:p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-white/90">
          City Box Score
        </h2>
        <p className="mb-4 text-xs text-white/45">
          Each beach's Gloom Index for{" "}
          {new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          . Bars past the midline go to {TEAMS.gloom.short}.
        </p>

        <div className="space-y-2.5">
          {rows.map((sd, i) => {
            const gloomy = sd.index >= WIN_THRESHOLD;
            const team = gloomy ? TEAMS.gloom : TEAMS.dogs;
            return (
              <div key={sd.station.id} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-sm text-white/75">
                  {sd.station.name}
                  <span className="ml-1 text-[10px] uppercase text-white/30">
                    {sd.station.county}
                  </span>
                </div>
                <div className="relative h-6 flex-1 overflow-hidden rounded-lg bg-white/5">
                  <div className="absolute left-1/2 top-0 z-10 h-full w-px bg-white/25" />
                  <motion.div
                    className="h-full rounded-lg"
                    style={{ background: team.accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${sd.index}%` }}
                    transition={{
                      delay: i * 0.05,
                      type: "spring",
                      stiffness: 80,
                      damping: 18,
                    }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-xs text-white/55">
                  <span className="led font-bold text-white/85">
                    {Math.round(sd.index)}
                  </span>
                  <span className="ml-2 text-white/35">
                    {sd.burnOffHour != null
                      ? `↑${fmtHour(sd.burnOffHour)}`
                      : "socked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
