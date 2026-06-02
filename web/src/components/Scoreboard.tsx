import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Season, TeamId } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { celebrate } from "../lib/confetti";
import Count from "./Count";

const CONFETTI: Record<TeamId, string[]> = {
  gloom: [TEAMS.gloom.accent, "#c3d0de", "#ffffff", "#4f6076"],
  dogs: [TEAMS.dogs.accent, "#fde68a", "#ffffff", "#ea580c"],
};

function TeamPanel({
  team,
  points,
  wins,
  losses,
  leading,
  align,
}: {
  team: TeamId;
  points: number;
  wins: number;
  losses: number;
  leading: boolean;
  align: "left" | "right";
}) {
  const t = TEAMS[team];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 16 }}
      className={`relative flex-1 rounded-2xl bg-gradient-to-b ${t.gradFrom} ${t.gradTo} p-5 sm:p-7 ${
        align === "right" ? "text-right" : "text-left"
      }`}
      style={
        leading
          ? { boxShadow: `0 0 0 1px ${t.accent}55, 0 0 60px ${t.glow}` }
          : { boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }
      }
    >
      <div
        className={`flex items-center gap-2 ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <span className="text-3xl sm:text-4xl" aria-hidden>
          {t.emoji}
        </span>
        <div className={align === "right" ? "text-right" : "text-left"}>
          <div className={`font-display font-bold leading-tight ${t.text}`}>
            {t.name}
          </div>
          <div className="text-[11px] uppercase tracking-widest text-white/40">
            {t.tagline}
          </div>
        </div>
      </div>

      <div className="mt-3 led text-6xl sm:text-7xl font-extrabold text-white">
        <Count value={points} />
      </div>

      <div
        className={`mt-1 flex items-center gap-3 text-sm text-white/60 ${
          align === "right" ? "justify-end" : "justify-start"
        }`}
      >
        <span className="led font-bold text-white/80">
          {wins}–{losses}
        </span>
        <span className="uppercase tracking-wider text-[11px]">record</span>
      </div>

      {leading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute -top-3 ${
            align === "right" ? "right-4" : "left-4"
          } rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-900`}
        >
          👑 Leading
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Scoreboard({ season }: { season: Season }) {
  const gLead = season.gloomPoints > season.dogPoints;
  const dLead = season.dogPoints > season.gloomPoints;
  const diff = Math.abs(season.gloomPoints - season.dogPoints);
  const leader = gLead ? TEAMS.gloom : dLead ? TEAMS.dogs : null;

  // Celebrate the day's winner once, as soon as today's game is final.
  const fired = useRef(false);
  useEffect(() => {
    const g = season.todaysGame;
    if (!fired.current && g && g.status === "final") {
      fired.current = true;
      celebrate(CONFETTI[g.winner]);
    }
  }, [season.todaysGame]);

  const replay = () => {
    const g = season.todaysGame;
    const team = g && g.status === "final" ? g.winner : leader?.id;
    if (team) celebrate(CONFETTI[team]);
  };

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="card-glass rounded-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] text-white/45">
          <button
            onClick={replay}
            title="Replay celebration"
            className="transition-colors hover:text-white/80"
          >
            🏆 June Gloom Bowl · {season.year}
          </button>
          <span>
            {season.finalsPlayed} final
            {season.today ? " · 1 live" : ""}
          </span>
        </div>

        <div className="flex items-stretch gap-3 sm:gap-5">
          <TeamPanel
            team="dogs"
            points={season.dogPoints}
            wins={season.dogWins}
            losses={season.gloomWins}
            leading={dLead}
            align="left"
          />

          <div className="flex flex-col items-center justify-center px-1">
            <span className="led text-xl font-bold text-white/30">VS</span>
          </div>

          <TeamPanel
            team="gloom"
            points={season.gloomPoints}
            wins={season.gloomWins}
            losses={season.dogWins}
            leading={gLead}
            align="right"
          />
        </div>

        <div className="mt-4 text-center text-sm text-white/55">
          {leader ? (
            <span>
              <span className="font-semibold text-white/80">
                {leader.short}
              </span>{" "}
              lead by <span className="led font-bold">{diff}</span> points
              {season.streakTeam && season.streakLen > 1 && (
                <>
                  {" · "}
                  {TEAMS[season.streakTeam].short} on a{" "}
                  <span className="led font-bold">{season.streakLen}</span>-game
                  streak {TEAMS[season.streakTeam].emoji}
                </>
              )}
            </span>
          ) : (
            <span>All square. 🤝</span>
          )}
          {season.today && (
            <div className="mt-1 text-xs text-white/40">
              🔴 Game {season.finalsPlayed + 1} live now — today's score locks
              when the scoring window closes at noon PT.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
