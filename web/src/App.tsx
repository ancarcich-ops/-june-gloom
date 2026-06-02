import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSeason } from "./lib/useSeason";
import type { Season } from "./lib/types";
import Scoreboard from "./components/Scoreboard";
import TodayGame from "./components/TodayGame";
import SeasonGrid from "./components/SeasonGrid";
import CityBreakdown from "./components/CityBreakdown";
import TrendChart from "./components/TrendChart";
import Methodology from "./components/Methodology";
import DynamicBackground from "./components/DynamicBackground";

type View = "scoreboard" | "methodology";

/** Today's index (live or final), else the latest finished day, else neutral. */
function currentIndex(season: Season | null): number {
  if (!season) return 50;
  if (season.todaysGame) return season.todaysGame.gloomIndex;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1].gloomIndex : 50;
}

export default function App() {
  const { season, loading, error, reload } = useSeason();
  const [view, setView] = useState<View>("scoreboard");

  return (
    <div className="min-h-screen px-4 pb-16 pt-6 sm:px-6">
      <DynamicBackground index={currentIndex(season)} />
      <Header view={view} setView={setView} />

      <AnimatePresence mode="wait">
        {view === "methodology" ? (
          <motion.main
            key="methodology"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            <Methodology />
          </motion.main>
        ) : (
          <motion.main
            key="scoreboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            {loading && <Loading />}
            {error && <ErrorCard message={error} onRetry={reload} />}
            {season && !loading && !error && (
              <>
                <Scoreboard season={season} />
                <TodayGame season={season} />
                <SeasonGrid season={season} />
                <CityBreakdown season={season} />
                <TrendChart season={season} />
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

function Header({
  view,
  setView,
}: {
  view: View;
  setView: (v: View) => void;
}) {
  return (
    <header className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="text-center sm:text-left">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl"
        >
          <span className="animate-float inline-block">🌞</span> June Gloom Bowl{" "}
          <span className="animate-float inline-block">🌫️</span>
        </motion.h1>
        <p className="text-sm text-white/45">
          Big Dogs vs The Gloom + Grant · live from the SoCal coast
        </p>
      </div>

      <nav className="flex rounded-full bg-white/5 p-1 text-sm">
        <NavBtn active={view === "scoreboard"} onClick={() => setView("scoreboard")}>
          Scoreboard
        </NavBtn>
        <NavBtn
          active={view === "methodology"}
          onClick={() => setView("methodology")}
        >
          How it works
        </NavBtn>
      </nav>
    </header>
  );
}

function NavBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-full px-4 py-1.5 font-medium transition-colors ${
        active ? "text-slate-900" : "text-white/60 hover:text-white"
      }`}
    >
      {active && (
        <motion.span
          layoutId="navpill"
          className="absolute inset-0 rounded-full bg-white"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function Loading() {
  return (
    <div className="mx-auto mt-10 w-full max-w-4xl text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-white/15 border-t-dogs-400"
      />
      <p className="text-white/50">Pulling the marine layer off the coast…</p>
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="card-glass mx-auto mt-10 w-full max-w-md rounded-2xl p-6 text-center">
      <p className="text-white/80">Couldn't load the weather data.</p>
      <p className="mt-1 text-sm text-white/45">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 rounded-full bg-dogs-500 px-5 py-2 font-semibold text-slate-900 hover:bg-dogs-400"
      >
        Try again
      </button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-4xl text-center text-xs text-white/35">
      Data:{" "}
      <a
        className="underline hover:text-white/60"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
      >
        Open-Meteo
      </a>{" "}
      · Built for fun ·{" "}
      <a
        className="underline hover:text-white/60"
        href="https://github.com/ancarcich-ops/-june-gloom"
        target="_blank"
        rel="noreferrer"
      >
        source
      </a>
    </footer>
  );
}
