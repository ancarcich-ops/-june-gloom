import { TEAMS } from "../lib/teams";
import { Ic } from "./icons";

export function About() {
  return (
    <div className="jg-card jg-rise" style={{ padding: "clamp(20px,2.6vw,30px)" }}>
      <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: "var(--ink)" }}>
        The <b>June Gloom Bowl</b> turns Southern California's famous early-summer
        marine layer into a season-long sports rivalry. Every June morning is a
        “game” between{" "}
        <b style={{ color: TEAMS.dogs.c3 }}>the Big Dogs</b> (the sun) and{" "}
        <b style={{ color: TEAMS.gloom.c3 }}>the Gloom + Grant</b> (the fog). We
        read <b>live</b> weather for six LA &amp; Orange County beaches, score how
        socked-in the 7&nbsp;AM–noon window was on a 0–100 <b>Gloom Index</b>, and
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
          much — and we even did it for the last five years. Right now the two
          teams are perfectly tied, so this year decides it!
        </p>
      </div>
    </div>
  );
}

const steps = [
  { icon: Ic.Pin, t: "Six beaches", d: "Santa Monica to Laguna — the SoCal marine-layer front line." },
  { icon: Ic.Marine, t: "Morning read", d: "Low-cloud cover, 7 AM–noon, the gloom's home turf." },
  { icon: Ic.BurnOff, t: "Gloom Index", d: "0 = blue sky, 100 = fully socked in. Scored per beach." },
  { icon: Ic.Wave, t: "Average the six", d: "The mean across all beaches is the day's final score." },
  { icon: Ic.Crown, t: "Crown the day", d: "≥ 50 the Gloom holds; < 50 the Dogs burn it off." },
];

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
