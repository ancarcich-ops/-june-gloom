import { TEAMS } from "../lib/teams";
import { Ic } from "./icons";

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
