import { motion } from "framer-motion";
import historyData from "../data/history.json";
import { TEAMS } from "../lib/teams";
import { WIN_THRESHOLD } from "../lib/gloom";

interface SeasonRecord {
  year: number;
  winner: string;
  gloomWins: number;
  dogWins: number;
  gloomPoints: number;
  dogPoints: number;
  margin: number;
  games: number;
  biggest: { date: string; winner: string; win: number; lose: number };
  scores: number[];
}

const seasons = (historyData.seasons as SeasonRecord[])
  .slice()
  .sort((a, b) => b.year - a.year);

function Sparkline({ scores, color }: { scores: number[]; color: string }) {
  const W = 160;
  const H = 38;
  const n = scores.length;
  if (n < 2) return null;
  const x = (i: number) => (i * W) / (n - 1);
  const y = (v: number) => H - (v / 100) * H;
  const line = `M ${scores.map((s, i) => `${x(i).toFixed(1)},${y(s).toFixed(1)}`).join(" L ")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-full" preserveAspectRatio="none">
      <line
        x1={0}
        x2={W}
        y1={y(WIN_THRESHOLD)}
        y2={y(WIN_THRESHOLD)}
        stroke="rgba(255,255,255,0.18)"
        strokeDasharray="3 3"
      />
      <path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}

export default function HallOfChampions() {
  if (!seasons.length) return null;

  const gloomTitles = seasons.filter((s) => s.winner === "gloom").length;
  const dogTitles = seasons.filter((s) => s.winner === "dogs").length;

  return (
    <section className="mx-auto mt-6 w-full max-w-4xl">
      <div className="card-glass rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-white/90">
            🏆 Hall of Champions
          </h2>
          <div className="flex items-center gap-3 text-sm text-white/60">
            <span>All-time titles:</span>
            <span className="led font-bold text-gloom-400">
              {TEAMS.gloom.emoji} {gloomTitles}
            </span>
            <span className="text-white/25">·</span>
            <span className="led font-bold text-dogs-400">
              {TEAMS.dogs.emoji} {dogTitles}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {seasons.map((s, i) => {
            const champ = s.winner === "gloom" ? TEAMS.gloom : TEAMS.dogs;
            return (
              <motion.div
                key={s.year}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-4"
                style={{
                  background: `linear-gradient(135deg, ${champ.accent}22, transparent 70%)`,
                  boxShadow: `inset 0 0 0 1px ${champ.accent}40`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="led text-2xl font-extrabold text-white">
                    {s.year}
                  </span>
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{ background: `${champ.accent}33`, color: champ.accent }}
                  >
                    {champ.emoji} {champ.name}
                  </span>
                </div>

                <div className="mt-2 flex items-baseline gap-3 text-sm">
                  <span className="text-white/55">
                    Gloom{" "}
                    <span className="led font-bold text-white/85">
                      {s.gloomWins}–{s.dogWins}
                    </span>
                  </span>
                  <span className="text-white/35">·</span>
                  <span className="text-white/55">
                    <span className="led font-bold text-gloom-400">
                      {s.gloomPoints}
                    </span>{" "}
                    –{" "}
                    <span className="led font-bold text-dogs-400">
                      {s.dogPoints}
                    </span>
                  </span>
                </div>

                <Sparkline scores={s.scores} color={champ.accent} />

                <div className="mt-1 text-[11px] text-white/45">
                  Won by {s.margin} pts · biggest:{" "}
                  {s.biggest.winner === "gloom" ? "🌫️" : "🌞"} {s.biggest.win}–
                  {s.biggest.lose} on Jun {Number(s.biggest.date.slice(8))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
