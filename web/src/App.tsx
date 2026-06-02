import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSeason } from "./lib/useSeason";
import { moodFromIndex, SKY_INTENSITY, CREST_VARIANT, type Mood } from "./lib/mood";
import { TEAMS } from "./lib/teams";
import { celebrate } from "./lib/confetti";
import type { Season, TeamId } from "./lib/types";
import { Crest } from "./components/icons";
import DynamicBackground from "./components/DynamicBackground";
import Scoreboard from "./components/Scoreboard";
import TodayGame from "./components/TodayGame";
import SeasonGrid from "./components/SeasonGrid";
import CityBreakdown from "./components/CityBreakdown";
import TrendChart from "./components/TrendChart";
import HallOfChampions from "./components/HallOfChampions";
import Methodology, { About, Details } from "./components/Methodology";

type View = "board" | "how";

const CONFETTI: Record<TeamId, string[]> = {
  gloom: [TEAMS.gloom.c1, TEAMS.gloom.c3, "#ffffff", TEAMS.gloom.c4],
  dogs: [TEAMS.dogs.c1, TEAMS.dogs.c3, "#ffffff", TEAMS.dogs.c4],
};

function currentIndex(season: Season | null): number {
  if (!season) return 50;
  if (season.todaysGame) return season.todaysGame.gloomIndex;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1].gloomIndex : 50;
}

function Header({ mood, view, setView }: { mood: Mood; view: View; setView: (v: View) => void }) {
  const leadName = mood.isDay ? "Sun" : "Gloom";
  return (
    <header className="jg-header" style={{ background: mood.isDay ? "rgba(255,250,238,0.5)" : "rgba(8,13,22,0.45)" }}>
      <div className="jg-wrap jg-header-in">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="30" height="30" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="18" fill="none" stroke={TEAMS.dogs.accent} strokeWidth="2.4" />
            <path d="M2 21a18 18 0 0 0 36 0z" fill={TEAMS.gloom.accent} opacity="0.92" />
            <circle cx="20" cy="16" r="6.2" fill={TEAMS.dogs.c2} />
          </svg>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" }}>June Gloom Bowl</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="jg-moodchip">
            <Crest team={mood.leader} variant={CREST_VARIANT} size={22} glow={false} />
            <span className="hidem">{leadName} leading</span>
            <b style={{ color: mood.leadAccent }}>{Math.round(mood.index)}</b>
          </span>
          <nav className="jg-nav">
            <button data-on={view === "board" ? "1" : "0"} onClick={() => setView("board")}>Scoreboard</button>
            <button data-on={view === "how" ? "1" : "0"} onClick={() => setView("how")}>How it works</button>
          </nav>
        </div>
      </div>
    </header>
  );
}

function SectionHead({ n, title, sub }: { n: string; title: string; sub?: string }) {
  return (
    <div className="jg-sec-hd">
      <div>
        <div className="jg-sec-num">{n}</div>
        <h2 className="jg-h2" style={{ marginTop: 6 }}>{title}</h2>
      </div>
      {sub && <p className="jg-sub" style={{ maxWidth: 320, textAlign: "right" }}>{sub}</p>}
    </div>
  );
}

export default function App() {
  const { season, loading, error, reload } = useSeason();
  const [view, setView] = useState<View>("board");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const mood = moodFromIndex(currentIndex(season), SKY_INTENSITY);

  // Celebrate the day's winner once today's game is final.
  const fired = useRef(false);
  useEffect(() => {
    const g = season?.todaysGame;
    if (!fired.current && g && g.status === "final") {
      fired.current = true;
      celebrate(CONFETTI[g.winner]);
    }
  }, [season]);

  const rootStyle: Record<string, string> = {
    "--ink": mood.ink,
    "--ink-soft": mood.inkSoft,
    "--ink-faint": mood.inkFaint,
    "--surface": mood.surface,
    "--surface2": mood.surface2,
    "--surfaceSolid": mood.surfaceSolid,
    "--border": mood.border,
    "--border-strong": mood.borderStrong,
    "--lead": mood.leadAccent,
    "--lead-glow": mood.leadGlow,
    background: mood.pageBg,
    backgroundColor: mood.skyBase,
    backgroundAttachment: "fixed",
  };

  return (
    <div className="jg-root" style={rootStyle as unknown as CSSProperties}>
      <DynamicBackground mood={mood} texture />

      <div className="jg-content">
        <Header mood={mood} view={view} setView={setView} />

        <div className="jg-wrap">
          {view === "board" ? (
            <>
              <div className="jg-hero-eyebrow jg-rise">
                <span className="jg-eyebrow">Sun vs. Marine Layer · SoCal Coast</span>
                <h1>The June Gloom Bowl</h1>
                <p className="jg-sub">A season-long rivalry. Every June morning is a game — does the
                  gloom hold, or do the Big Dogs burn it off?</p>
              </div>

              {loading && <Loading />}
              {error && <ErrorCard message={error} onRetry={reload} />}

              {season && !loading && !error && (
                <>
                  <Scoreboard season={season} crest={CREST_VARIANT} run={mounted} />

                  <section className="jg-sec">
                    <SectionHead n="01 · LIVE" title="Today's Game" sub="The marquee. The whole sky moves with today's index." />
                    <TodayGame season={season} crest={CREST_VARIANT} />
                  </section>

                  <section className="jg-sec">
                    <SectionHead n="02" title="Season Ledger" sub="30 mornings, one per day." />
                    <SeasonGrid season={season} />
                  </section>

                  <section className="jg-sec">
                    <SectionHead n="03" title="City Box Score" sub="Per-beach Gloom Index, north to south. Midline is the coin-flip." />
                    <CityBreakdown season={season} dark={mood.scheme === "dark"} />
                  </section>

                  <section className="jg-sec">
                    <SectionHead n="04" title="Gloom Index Trend" sub="Above the line the Gloom rules; below it the Dogs do." />
                    <TrendChart season={season} />
                  </section>

                  <section className="jg-sec">
                    <SectionHead n="05" title="Hall of Champions" sub="Five seasons in the books — does 2026 tip the balance?" />
                    <HallOfChampions />
                  </section>
                </>
              )}
            </>
          ) : (
            <>
              <div className="jg-hero-eyebrow jg-rise">
                <span className="jg-eyebrow">The rulebook</span>
                <h1>How the Bowl is scored</h1>
                <p className="jg-sub">No opinions — just the morning marine layer over six beaches, turned into one number.</p>
              </div>
              <section className="jg-sec" style={{ marginTop: 8 }}>
                <SectionHead n="01" title="What is this?" sub="The gist, plus a plain-English version." />
                <About />
              </section>
              <section className="jg-sec">
                <SectionHead n="02" title="From fog to final score" sub="The five steps, at a glance." />
                <Methodology />
              </section>
              <section className="jg-sec">
                <SectionHead n="03" title="The calculation, in detail" sub="The exact formula, with a worked example." />
                <Details />
              </section>
              <section className="jg-sec">
                <SectionHead n="04" title="Hall of Champions" />
                <HallOfChampions />
              </section>
            </>
          )}

          <footer className="jg-footer">
            <span>Gloom Index from live morning low-cloud cover · 7 LA &amp; OC locations · a concept, not a forecast.</span>
            <span>June Gloom Bowl · {season?.year ?? 2026} season</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="jg-card jg-rise" style={{ padding: 40, textAlign: "center", color: "var(--ink-soft)" }}>
      Pulling the marine layer off the coast…
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="jg-card jg-rise" style={{ padding: 28, textAlign: "center" }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Couldn't load the weather data.</p>
      <p className="jg-sub" style={{ margin: "6px 0 16px" }}>{message}</p>
      <button className="jg-pill" style={{ cursor: "pointer" }} onClick={onRetry}>Try again</button>
    </div>
  );
}
