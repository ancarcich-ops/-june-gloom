import type { Season, DayResult } from "../lib/types";
import { TEAMS } from "../lib/teams";
import { fmtHour, WIN_THRESHOLD } from "../lib/gloom";
import { TZ } from "../lib/openMeteo";
import { Crest, Ic, type CrestVariant } from "./icons";

function pickDay(season: Season): DayResult | null {
  if (season.todaysGame) return season.todaysGame;
  const finals = season.days.filter((d) => d.status === "final");
  return finals.length ? finals[finals.length - 1] : null;
}

// Fraction of the 7 AM–noon scoring window elapsed, in LA local time.
function windowProgress(isLive: boolean): number {
  if (!isLive) return 1;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hh = Number(parts.find((p) => p.type === "hour")?.value) % 24;
  const mm = Number(parts.find((p) => p.type === "minute")?.value);
  const mins = hh * 60 + mm;
  return Math.max(0, Math.min(1, (mins - 7 * 60) / (12 * 60 - 7 * 60)));
}

function StatTile({ icon: Icon, v, k, s }: { icon: (typeof Ic)[keyof typeof Ic]; v: string; k: string; s?: string }) {
  return (
    <div className="tg-stat">
      <span className="ic"><Icon width="20" height="20" /></span>
      <span className="v">{v}</span>
      <span className="k">{k}</span>
      {s && <span className="s">{s}</span>}
    </div>
  );
}

export default function TodayGame({ season, crest }: { season: Season; crest: CrestVariant }) {
  const day = pickDay(season);
  if (!day) {
    return <div className="jg-card tg jg-rise">The first whistle blows June 1.</div>;
  }

  const gloomScore = day.gloomScore;
  const dogScore = day.dogScore;
  const leader = day.gloomIndex >= WIN_THRESHOLD ? "gloom" : "dogs";
  const lt = TEAMS[leader];
  const margin = Math.abs(dogScore - gloomScore);
  const live = day.status === "live";
  const isForecast = day.status === "upcoming"; // today, before the 7 AM window opens
  const progress = windowProgress(live);

  const total = day.stations.length;
  const socked = day.stations.filter((s) => s.index >= WIN_THRESHOLD).length;
  const clear = total - socked;
  const burned = day.stations.filter((s) => s.burnOffHour != null);
  const avgBurn =
    burned.length > 0
      ? Math.round(burned.reduce((a, s) => a + (s.burnOffHour as number), 0) / burned.length)
      : null;

  // Before the window closes, the score (and burn-off) is a forecast, not observed.
  const projected = day.status !== "final";
  const burnVal = avgBurn == null ? "—" : projected ? `~${fmtHour(avgBurn)}` : fmtHour(avgBurn);
  const burnSub = avgBurn == null ? "stayed socked in" : projected ? "projected clearing" : "avg. clearing time";

  const dateLabel = new Date(day.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="jg-card tg jg-rise">
      <div className="tg-hd">
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span className="jg-h2">Today's Game</span>
          <span className="jb-daychip" style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 600, letterSpacing: ".04em" }}>{dateLabel}</span>
        </div>
        {live ? (
          <span className="jg-live"><span className="dot" />Live</span>
        ) : (
          <span className="jg-pill">{isForecast ? "Forecast" : "Final"}</span>
        )}
      </div>

      <div className="tg-score">
        <div className="tg-side">
          <Crest team="dogs" variant={crest} size={62} />
          <div className="tg-meta">
            <span className="tg-team" style={{ color: TEAMS.dogs.c3 }}>Big Dogs</span>
            <span className="tg-tag">Burn it off</span>
          </div>
          <span className="tg-num led" style={{ color: TEAMS.dogs.c3, marginLeft: "auto" }}>{dogScore}</span>
        </div>

        <div className="tg-mid">
          <span className="lead-tag" style={{ background: lt.glow, color: leader === "dogs" ? "#7a4d06" : "#2b3a52" }}>
            {leader === "dogs" ? "Sun by " : "Gloom by "}{margin}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 600 }}>
            {live ? "window open" : isForecast ? "window opens 7 AM" : "final"}
          </span>
        </div>

        <div className="tg-side r">
          <Crest team="gloom" variant={crest} size={62} />
          <div className="tg-meta">
            <span className="tg-team" style={{ color: TEAMS.gloom.c3 }}>Gloom</span>
            <span className="tg-tag">Keep it grey</span>
          </div>
          <span className="tg-num led" style={{ color: TEAMS.gloom.c3, marginRight: "auto" }}>{gloomScore}</span>
        </div>
      </div>

      <div className="tg-window">
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 7, fontWeight: 600 }}>
          <span>7:00 AM</span>
          <span>
            {isForecast ? "projected" : `${Math.round(progress * 100)}% of scoring window`} · gloom index {gloomScore}
          </span>
          <span>12:00 PM</span>
        </div>
        <div className="tg-window-bar"><i style={{ width: `${progress * 100}%` }} /></div>
      </div>

      <div className="tg-stats">
        <StatTile icon={Ic.BurnOff} v={burnVal} k="Avg. burn-off" s={burnSub} />
        <StatTile icon={Ic.Fog} v={`${socked} / ${total}`} k="Beaches socked in" s="index 50 or higher" />
        <StatTile icon={Ic.Sun} v={`${clear} / ${total}`} k="Beaches cleared" s="index below 50" />
        <StatTile icon={Ic.Marine} v={`${gloomScore}`} k="Coast average" s="mean Gloom Index" />
      </div>
    </div>
  );
}
