import type { Mood } from "../lib/mood";

/**
 * Full-page day↔night mood layer. Day gradient + sun rays crossfade with the
 * night gradient + drifting fog; intensity scales with distance from 50.
 * The base sky wash is painted on .jg-root (full document height); this layer
 * carries only viewport-fixed decoration so the wash always reads through.
 */
export default function DynamicBackground({ mood, texture = true }: { mood: Mood; texture?: boolean }) {
  const { nightAmt, drama, isDay } = mood;
  const sunRay = isDay ? Math.max(0.12, drama) : 0;
  const fog = !isDay ? Math.max(0.18, drama) : 0.08;

  return (
    <div className="jg-bg" aria-hidden="true">
      {/* SUN: glow halo */}
      <div
        className="jg-layer"
        style={{
          opacity: isDay ? Math.max(0.18, drama) : 0,
          background:
            "radial-gradient(38% 32% at 50% 4%, rgba(255,214,120,0.9) 0%, rgba(255,191,90,0.4) 36%, rgba(255,191,90,0) 70%)",
        }}
      />
      {/* SUN: rotating rays */}
      <svg className="jg-rays" viewBox="0 0 100 100" style={{ opacity: sunRay * 0.45 }}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 360) / 24;
          return (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <path d="M50 50 L48.4 0 L51.6 0 Z" fill="rgba(255,220,140,0.5)" />
            </g>
          );
        })}
      </svg>

      {/* GLOOM: cool cast from the top */}
      <div
        className="jg-layer"
        style={{
          opacity: nightAmt * 0.5,
          background: "linear-gradient(180deg, rgba(78,99,130,0.4) 0%, rgba(20,30,48,0) 55%)",
        }}
      />
      {/* GLOOM: drifting fog banks */}
      <div
        className="jg-fog a"
        style={{
          opacity: fog,
          background:
            "radial-gradient(60% 100% at 50% 100%, rgba(190,205,224,0.55) 0%, rgba(150,170,196,0.2) 45%, rgba(150,170,196,0) 75%)",
        }}
      />
      <div
        className="jg-fog b"
        style={{
          opacity: fog * 0.8,
          background:
            "radial-gradient(60% 100% at 40% 100%, rgba(205,218,232,0.45) 0%, rgba(160,180,205,0) 70%)",
        }}
      />

      {/* Horizon band at the bottom of the viewport */}
      <div
        className="jg-layer"
        style={{
          inset: "auto -10% -10% -10%",
          height: "36%",
          opacity: 0.45 + nightAmt * 0.35,
          background: isDay
            ? "linear-gradient(180deg, rgba(120,170,200,0) 0%, rgba(86,140,178,0.45) 60%, rgba(60,110,150,0.6) 100%)"
            : "linear-gradient(180deg, rgba(20,34,56,0) 0%, rgba(12,22,40,0.6) 70%, rgba(8,14,26,0.92) 100%)",
        }}
      />

      {texture && <div className="jg-grain" />}
    </div>
  );
}
