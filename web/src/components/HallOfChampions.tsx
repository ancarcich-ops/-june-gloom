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

// Fixed 0–100 scale + a 50 midline, with the area shaded gloom (above) vs dogs
// (below) so you can read who controlled the season at a glance.
function MiniSpark({ data, uid }: { data: number[]; uid: string }) {
  const W = 100, H = 30, pad = 2;
  const n = data.length;
  const x = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad);
  const y = (v: number) => pad + (1 - v / 100) * (H - 2 * pad);
  const midY = y(50);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const areaDown = `${line} L ${x(n - 1).toFixed(1)} ${H} L ${x(0).toFixed(1)} ${H} Z`;
  const areaUp = `${line} L ${x(n - 1).toFixed(1)} 0 L ${x(0).toFixed(1)} 0 Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 30 }} preserveAspectRatio="none">
      <defs>
        <clipPath id={`up-${uid}`}><rect x="0" y="0" width={W} height={midY} /></clipPath>
        <clipPath id={`dn-${uid}`}><rect x="0" y={midY} width={W} height={H - midY} /></clipPath>
      </defs>
      {/* gloom shading above the 50-line, dogs shading below */}
      <path d={areaDown} fill={TEAMS.gloom.c3} fillOpacity="0.34" clipPath={`url(#up-${uid})`} />
      <path d={areaUp} fill={TEAMS.dogs.c3} fillOpacity="0.34" clipPath={`url(#dn-${uid})`} />
      <line x1="0" x2={W} y1={midY} y2={midY} stroke="var(--ink-faint)" strokeWidth="0.5" strokeDasharray="2 2" />
      <path d={line} fill="none" stroke="var(--ink)" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
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
          const bt = s.biggest.winner === "dogs" ? TEAMS.dogs : TEAMS.gloom;
          return (
            <div key={s.year} className="hc-card">
              <span className="topbar" style={{ background: t.c3 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="hc-yr">'{String(s.year).slice(2)}</span>
                <Ic.Trophy width="16" height="16" style={{ color: t.c3 }} />
              </div>
              <div className="hc-champ" style={{ color: t.c3 }}>{t.short}</div>
              <div className="hc-rec">{champ === "dogs" ? `${s.dogWins}–${s.gloomWins}` : `${s.gloomWins}–${s.dogWins}`}</div>
              <MiniSpark data={s.scores} uid={String(s.year)} />
              <div className="hc-mvp">
                Biggest blowout<br />
                <b><span style={{ color: bt.c3 }}>{bt.short}</span> {s.biggest.win}–{s.biggest.lose} · Jun {Number(s.biggest.date.slice(8))}</b>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 14, lineHeight: 1.5 }}>
        Each spark is that June's daily Gloom Index on a fixed 0–100 scale ·{" "}
        <span style={{ color: TEAMS.gloom.c3, fontWeight: 600 }}>above the line = Gloom days</span> ·{" "}
        <span style={{ color: TEAMS.dogs.c3, fontWeight: 600 }}>below = Dogs days</span>
      </div>

      <div className="hc-era">
        <span className="hc-era-tag" style={{ color: TEAMS.dogs.c3, borderColor: "var(--border)" }}>● Dogs Dynasty · '21–'22</span>
        <span className="hc-era-tag" style={{ color: TEAMS.gloom.c3, borderColor: "var(--border)" }}>● Gloom Era · '23–'25</span>
        <span className="hc-era-tag" style={{ color: "var(--ink-faint)" }}>2026 · the tiebreaker season</span>
      </div>
    </div>
  );
}
