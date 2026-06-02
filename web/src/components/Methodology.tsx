import { TEAMS } from "../lib/teams";
import { Ic } from "./icons";
import {
  WEIGHTS,
  WINDOW_START,
  WINDOW_END,
  SOCKED_THRESHOLD,
  WIN_THRESHOLD,
  fmtHour,
} from "../lib/gloom";
import { STATIONS } from "../lib/openMeteo";

export function About() {
  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(20px,2.6vw,30px)" }}>
      <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "var(--ink)" }}>
        The <b>June Gloom Bowl</b> turns Southern California's famous early-summer
        marine layer into a season-long sports rivalry. Every June morning is a
        “game” between{" "}
        <b style={{ color: TEAMS.dogs.c3 }}>the Big Dogs</b> (the sun) and{" "}
        <b style={{ color: TEAMS.gloom.c3 }}>the Gloom + Grant</b> (the fog). We
        read <b>live</b> weather for seven LA &amp; OC spots (six beaches plus
        inland Garden Grove), score how socked-in the 7&nbsp;AM–noon window was on
        a 0–100 <b>Gloom Index</b>, and
        crown a daily winner. Records, points, streaks and five years of
        history — all from live data, no backend.
      </p>
      <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "16px 18px", marginTop: 18 }}>
        <div className="jg-eyebrow" style={{ marginBottom: 8 }}>Explain it like I'm 5</div>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
          Some summer mornings the beach is sunny, and some mornings it's buried
          in fog. We give the fog a score from 0 to 100. If it's really foggy, the
          Fog team wins the day. If the sun burns the fog away, the Sun team wins.
          We keep score every single day like a sports league — who won, by how
          much — and we even did it for the last five years. The two teams have
          been neck and neck, so this season could tip it!
        </p>
      </div>
    </div>
  );
}

const steps = [
  { icon: Ic.Pin, t: "Seven spots", d: "Santa Monica to Laguna, plus inland Garden Grove." },
  { icon: Ic.Marine, t: "Morning read", d: "Low-cloud cover, 7 AM–noon, the gloom's home turf." },
  { icon: Ic.BurnOff, t: "Gloom Index", d: "0 = blue sky, 100 = fully socked in. Scored per spot." },
  { icon: Ic.Wave, t: "Average them all", d: "The mean across every spot is the day's final score." },
  { icon: Ic.Crown, t: "Crown the day", d: "≥ 50 the Gloom holds; < 50 the Dogs burn it off." },
];

// ── Detailed, worked-through explanation ────────────────────────────────────
// A real example: Newport Beach's 7 AM–noon readings from a gloomy morning.
const EX_LOW = [100, 100, 100, 100, 51]; // low-cloud % per hour
const EX_SUN = [0, 0, 0, 600, 3000]; // sunshine seconds per hour
const exN = EX_LOW.length;
const exMean = EX_LOW.reduce((a, b) => a + b, 0) / exN;
const exSunFrac = Math.min(1, EX_SUN.reduce((a, b) => a + b, 0) / (exN * 3600));
const exSocked = (100 * EX_LOW.filter((v) => v >= SOCKED_THRESHOLD).length) / exN;
const exT1 = WEIGHTS.lowCloud * exMean;
const exT2 = WEIGHTS.sunless * (1 - exSunFrac) * 100;
const exT3 = WEIGHTS.socked * exSocked;
const exIndex = Math.round(exT1 + exT2 + exT3);
const nHours = WINDOW_END - WINDOW_START;

function Block({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 26 }}>
      <div className="jg-sec-num" style={{ marginBottom: 4 }}>{n}</div>
      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--ink)", marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 14.5, lineHeight: 1.65, color: "var(--ink-soft)" }}>{children}</div>
    </div>
  );
}

const codeBox: React.CSSProperties = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  padding: "14px 16px",
  marginTop: 12,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 13,
  lineHeight: 1.7,
  color: "var(--ink)",
  overflowX: "auto",
};
const td: React.CSSProperties = { padding: "9px 10px", borderTop: "1px solid var(--border)", verticalAlign: "top" };

export function Details() {
  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(20px,2.6vw,30px)" }}>
      <Block n="01" title="The window & the panel">
        Every June day is one game. We only look at the{" "}
        <b style={{ color: "var(--ink)" }}>{fmtHour(WINDOW_START)}–{fmtHour(WINDOW_END)}</b>{" "}
        hours — the {nHours} readings at{" "}
        {Array.from({ length: nHours }, (_, i) => fmtHour(WINDOW_START + i)).join(", ")} —
        the "does it burn off?" window. Pre-dawn and afternoon are ignored on
        purpose. We score <b style={{ color: "var(--ink)" }}>{STATIONS.length} spots</b>:{" "}
        {STATIONS.map((s) => s.name).join(", ")}.
      </Block>

      <Block n="02" title="Each spot gets a 0–100 Gloom Index">
        For one spot on one day we pull two hourly numbers from Open-Meteo over
        those {nHours} hours — <b style={{ color: "var(--ink)" }}>low-cloud cover (%)</b>{" "}
        and <b style={{ color: "var(--ink)" }}>sunshine (seconds)</b> — and build
        three ingredients:
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12, fontSize: 13.5 }}>
          <tbody>
            <tr>
              <td style={{ ...td, borderTop: "none", fontWeight: 700, color: "var(--ink)", width: "34%" }}>meanLowCloud</td>
              <td style={{ ...td, borderTop: "none" }}>average of the {nHours} hourly low-cloud % — how thick the marine layer was</td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: 700, color: "var(--ink)" }}>sunFraction</td>
              <td style={td}>total sunshine seconds ÷ ({nHours}&nbsp;hrs × 3600) → a 0–1 share of how much sun got through</td>
            </tr>
            <tr>
              <td style={{ ...td, fontWeight: 700, color: "var(--ink)" }}>pctSocked</td>
              <td style={td}>% of the {nHours} hours with low cloud ≥ {SOCKED_THRESHOLD}% — how stubborn the layer was</td>
            </tr>
          </tbody>
        </table>
        Then blend them with fixed weights (they sum to 1, so the result always
        lands 0–100):
        <div style={codeBox}>
          Index = <span style={{ color: TEAMS.gloom.c3 }}>{WEIGHTS.lowCloud}</span> × meanLowCloud
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;+ <span style={{ color: TEAMS.gloom.c3 }}>{WEIGHTS.sunless}</span> × (1 − sunFraction) × 100
          <span style={{ color: "var(--ink-faint)" }}>&nbsp;&nbsp;← "no sun" pushes it UP</span>
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;+ <span style={{ color: TEAMS.gloom.c3 }}>{WEIGHTS.socked}</span> × pctSocked
        </div>
        Higher = gloomier. We also note the <b style={{ color: "var(--ink)" }}>burn-off time</b> —
        the first hour low cloud drops below {SOCKED_THRESHOLD}% — just for display.
      </Block>

      <Block n="03" title="Worked example — Newport Beach, a gloomy morning">
        Low-cloud came in at{" "}
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{EX_LOW.join(", ")}</span>{" "}
        and the sun barely broke through near the end:
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
          <li>meanLowCloud = ({EX_LOW.join("+")}) / {exN} = <b style={{ color: "var(--ink)" }}>{exMean.toFixed(1)}</b></li>
          <li>sunFraction ≈ <b style={{ color: "var(--ink)" }}>{exSunFrac.toFixed(2)}</b>, so (1 − sunFraction) × 100 = <b style={{ color: "var(--ink)" }}>{((1 - exSunFrac) * 100).toFixed(0)}</b></li>
          <li>pctSocked = all {exN} hours ≥ {SOCKED_THRESHOLD} → <b style={{ color: "var(--ink)" }}>{exSocked.toFixed(0)}</b></li>
        </ul>
        <div style={codeBox}>
          Index = {WEIGHTS.lowCloud}×{exMean.toFixed(1)} + {WEIGHTS.sunless}×{((1 - exSunFrac) * 100).toFixed(0)} + {WEIGHTS.socked}×{exSocked.toFixed(0)}
          <br />
          &nbsp;&nbsp;&nbsp;&nbsp;= {exT1.toFixed(1)} + {exT2.toFixed(1)} + {exT3.toFixed(1)} ={" "}
          <span style={{ color: TEAMS.gloom.c3, fontWeight: 800 }}>{exIndex}</span>
        </div>
        That's a <b style={{ color: TEAMS.gloom.c3 }}>Gloom {exIndex}</b> –{" "}
        <b style={{ color: TEAMS.dogs.c3 }}>{100 - exIndex} Dogs</b> at Newport. A
        beach pinned at 100 all five hours with no sun scores a flat{" "}
        <b style={{ color: "var(--ink)" }}>{Math.round(WEIGHTS.lowCloud * 100 + WEIGHTS.sunless * 100 + WEIGHTS.socked * 100)}</b>.
      </Block>

      <Block n="04" title="The day's score & winner">
        The {STATIONS.length} spot indices are averaged into the day's{" "}
        <b style={{ color: "var(--ink)" }}>coastal Gloom Index</b>. That number is
        the final score:
        <div style={codeBox}>
          GLOOM score = round(coastal index)
          <br />
          DOGS score = 100 − GLOOM score
        </div>
        If the index is <b style={{ color: "var(--ink)" }}>≥ {WIN_THRESHOLD}</b>, the{" "}
        <b style={{ color: TEAMS.gloom.c3 }}>Gloom</b> win the day; below it, the{" "}
        <b style={{ color: TEAMS.dogs.c3 }}>Big Dogs</b> burn it off.
      </Block>

      <Block n="05" title="Standings & live timing">
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          <li><b style={{ color: "var(--ink)" }}>Record (W–L):</b> one win to whoever takes each finished day.</li>
          <li><b style={{ color: "var(--ink)" }}>Points:</b> each team banks its daily score; the scoreboard shows season totals, so blowouts count.</li>
          <li><b style={{ color: "var(--ink)" }}>Live timing:</b> before {fmtHour(WINDOW_START)} today is a <b style={{ color: "var(--ink)" }}>Forecast</b> (doesn't count); during the window it's <b style={{ color: "var(--ink)" }}>Live</b> and counts toward points provisionally; at {fmtHour(WINDOW_END)} it locks to <b style={{ color: "var(--ink)" }}>Final</b> and lands in the record.</li>
        </ul>
        <p style={{ marginTop: 14, fontSize: 13, color: "var(--ink-faint)" }}>
          The one judgment call is the {WEIGHTS.lowCloud}/{WEIGHTS.sunless}/{WEIGHTS.socked} weighting
          and the {fmtHour(WINDOW_START)}–{fmtHour(WINDOW_END)} window — both tuned
          so the all-time record sits near 50/50.
        </p>
      </Block>
    </div>
  );
}

export default function Methodology() {
  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(20px,2.6vw,30px)" }}>
      <div className="mt-steps">
        {steps.map((s, i) => (
          <div key={i} className="mt-step">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="mt-n">{i + 1}</span>
              <span className="mt-ic"><s.icon width="22" height="22" /></span>
            </div>
            <div className="mt-t">{s.t}</div>
            <div className="mt-d">{s.d}</div>
          </div>
        ))}
      </div>
      <div className="mt-scale">
        <div style={{ background: TEAMS.dogs.c4 }}>0 — Blue sky</div>
        <div style={{ background: TEAMS.dogs.c2, color: "#7a4d06" }}>25</div>
        <div style={{ background: "var(--ink-faint)" }}>50 — Coin-flip</div>
        <div style={{ background: TEAMS.gloom.c3 }}>75</div>
        <div style={{ background: TEAMS.gloom.c4 }}>100 — Socked in</div>
      </div>
    </div>
  );
}
