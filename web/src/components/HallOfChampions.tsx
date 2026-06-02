import historyData from "../data/history.json";
import { TEAMS } from "../lib/teams";
import { Ic } from "./icons";
import type { TeamId } from "../lib/types";

interface SeasonRecord {
  year: number;
  winner: string;
  gloomWins: number;
  dogWins: number;
  margin: number;
  biggest: { date: string; winner: string; win: number; lose: number };
  scores: number[];
}

const seasons = (historyData.seasons as SeasonRecord[]).slice().sort((a, b) => a.year - b.year);
const ALLTIME = seasons.reduce((a, s) => ({ d: a.d + s.dogWins, g: a.g + s.gloomWins }), { d: 0, g: 0 });
const TITLES = seasons.reduce(
  (a, s) => (s.winner === "dogs" ? { ...a, d: a.d + 1 } : { ...a, g: a.g + 1 }),
  { d: 0, g: 0 },
);

function MiniSpark({ data, color }: { data: number[]; color: string }) {
  const W = 100, H = 26, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (W - pad * 2);
      const y = pad + (1 - (v - min) / rng) * (H - pad * 2);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 26 }} preserveAspectRatio="none">
      <path d={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function tieLabel() {
  if (ALLTIME.d === ALLTIME.g) return "DEAD EVEN";
  const lead = ALLTIME.g > ALLTIME.d ? "GLOOM" : "DOGS";
  return `${lead} +${Math.abs(ALLTIME.g - ALLTIME.d)}`;
}

export default function HallOfChampions() {
  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(20px,2.6vw,30px)" }}>
      <div className="hc-top">
        <div className="hc-alltime">
          <div className="big led" style={{ color: TEAMS.dogs.c3 }}>{ALLTIME.d}</div>
          <div className="lbl">Big Dogs · all-time</div>
          <div className="hc-titles">
            {Array.from({ length: TITLES.d }).map((_, i) => <i key={`d${i}`} style={{ background: TEAMS.dogs.c3 }} />)}
            {Array.from({ length: TITLES.g }).map((_, i) => <i key={`g${i}`} style={{ background: "var(--border-strong)" }} />)}
          </div>
        </div>
        <div className="hc-vs">
          <Ic.Trophy width="26" height="26" style={{ color: "var(--ink-faint)" }} />
          <div className="tie" style={{ marginTop: 6 }}>{tieLabel()}</div>
        </div>
        <div className="hc-alltime">
          <div className="big led" style={{ color: TEAMS.gloom.c3 }}>{ALLTIME.g}</div>
          <div className="lbl">Gloom · all-time</div>
          <div className="hc-titles">
            {Array.from({ length: TITLES.d }).map((_, i) => <i key={`d${i}`} style={{ background: "var(--border-strong)" }} />)}
            {Array.from({ length: TITLES.g }).map((_, i) => <i key={`g${i}`} style={{ background: TEAMS.gloom.c3 }} />)}
          </div>
        </div>
      </div>

      <div className="hc-cards">
        {seasons.map((s) => {
          const champ = (s.winner === "dogs" ? "dogs" : "gloom") as TeamId;
          const t = TEAMS[champ];
          const bw = s.biggest.winner === "gloom" ? "🌫️" : "🌞";
          return (
            <div key={s.year} className="hc-card">
              <span className="topbar" style={{ background: t.c3 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="hc-yr">'{String(s.year).slice(2)}</span>
                <Ic.Trophy width="16" height="16" style={{ color: t.c3 }} />
              </div>
              <div className="hc-champ" style={{ color: t.c3 }}>{t.short}</div>
              <div className="hc-rec">{champ === "dogs" ? `${s.dogWins}–${s.gloomWins}` : `${s.gloomWins}–${s.dogWins}`}</div>
              <MiniSpark data={s.scores} color={t.c3} />
              <div className="hc-mvp">
                Biggest blowout<br />
                <b>{bw} {s.biggest.win}–{s.biggest.lose} · Jun {Number(s.biggest.date.slice(8))}</b>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hc-era">
        <span className="hc-era-tag" style={{ color: TEAMS.dogs.c3, borderColor: "var(--border)" }}>☀ Dogs Dynasty · '21–'22</span>
        <span className="hc-era-tag" style={{ color: TEAMS.gloom.c3, borderColor: "var(--border)" }}>☁ Gloom Era · '23–'25</span>
        <span className="hc-era-tag" style={{ color: "var(--ink-faint)" }}>2026 · the tiebreaker season</span>
      </div>
    </div>
  );
}
