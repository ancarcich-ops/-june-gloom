import type { SVGProps } from "react";
import { TEAMS } from "../lib/teams";
import type { TeamId } from "../lib/types";

type IconProps = SVGProps<SVGSVGElement>;
export type CrestVariant = "orbital" | "shield" | "mono";

// ── Small weather / beach icons (inherit currentColor) ──────────────────────
export const Ic = {
  Sun: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="4.2" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line key={i} x1={12 + Math.cos(a) * 7} y1={12 + Math.sin(a) * 7} x2={12 + Math.cos(a) * 9.2} y2={12 + Math.sin(a) * 9.2} />
        );
      })}
    </svg>
  ),
  Fog: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}>
      <path d="M4 8h13M6 8a4 4 0 0 1 7.6-1.7A3.2 3.2 0 0 1 19 8" />
      <line x1="3" y1="12.5" x2="21" y2="12.5" /><line x1="5" y1="16" x2="19" y2="16" />
      <line x1="7" y1="19.5" x2="16" y2="19.5" />
    </svg>
  ),
  Marine: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}>
      <path d="M2 9c2.5-2 5-2 7.5 0S15 11 17.5 9 22 7 22 7" />
      <path d="M2 14c2.5-2 5-2 7.5 0s5.5 2 8 0" opacity="0.7" />
      <path d="M3 19c2-1.6 4-1.6 6 0s4 1.6 6 0 3-1 3-1" opacity="0.45" />
    </svg>
  ),
  BurnOff: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3c1.5 2.5.5 4-1 5.5S8.5 12 10 14.5c.8 1.3 2.4 1.6 3.6.8" />
      <path d="M16 9c1.2 1.6 2 3.3 2 5a6 6 0 1 1-12 0c0-1 .2-1.9.6-2.8" />
    </svg>
  ),
  Wave: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}>
      <path d="M2 16c2-3 4-4.5 6.5-4.5 3 0 3.5 3 6 3 2 0 3-1.5 3.5-3" />
      <path d="M2 20c2-2 4-3 6.5-3 3 0 3.5 2.5 6 2.5 2 0 3-1 3.5-2" opacity="0.5" />
    </svg>
  ),
  Crown: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M3 8l3.5 3L12 5l5.5 6L21 8l-1.6 9.5a1 1 0 0 1-1 .85H5.6a1 1 0 0 1-1-.85L3 8z" />
    </svg>
  ),
  Trophy: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v3M9 20h6M10 20l.5-4h3l.5 4" />
    </svg>
  ),
  Flame: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2c.6 3-1.8 4.2-1.8 7 0 1.3 1 2.3 1 3.6 0 .9-.6 1.6-1.4 1.8.2-1.5-.9-2.4-.9-3.8C7 12 6 13.7 6 15.6 6 19.1 8.7 22 12 22s6-2.9 6-6.4c0-4.6-4.2-5.8-6-13.6z" />
    </svg>
  ),
  Pin: (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
      <circle cx="12" cy="9" r="2.6" fill="#fff" />
    </svg>
  ),
};

interface CrestProps {
  team: TeamId;
  variant?: CrestVariant;
  size?: number;
  glow?: boolean;
}

// ── Crest — team badge in orbital / shield / mono variants ──────────────────
export function Crest({ team, variant = "orbital", size = 96, glow = true }: CrestProps) {
  const t = TEAMS[team];
  const uid = `${team}-${variant}`;
  const isDogs = team === "dogs";

  const Core = isDogs ? (
    <g>
      <circle cx="50" cy="50" r="11" fill={`url(#core-${uid})`} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        const r0 = 15, r1 = i % 2 ? 20 : 23;
        return (
          <line key={i} x1={50 + Math.cos(a) * r0} y1={50 + Math.sin(a) * r0} x2={50 + Math.cos(a) * r1} y2={50 + Math.sin(a) * r1} stroke={t.c2} strokeWidth="2.4" strokeLinecap="round" />
        );
      })}
    </g>
  ) : (
    <g>
      <path d="M31 44c4-3 7-3 9.5-1S46 46 50 44s5-3 9.5-1 5.5 1 9.5-1" fill="none" stroke={t.c1} strokeWidth="2.6" strokeLinecap="round" opacity="0.95" />
      <path d="M31 51c4-3 7-3 9.5-1S46 53 50 51s5-3 9.5-1 5.5 1 9.5-1" fill="none" stroke={t.c2} strokeWidth="2.6" strokeLinecap="round" opacity="0.8" />
      <path d="M31 58c4-3 7-3 9.5-1S46 60 50 58s5-3 9.5-1 5.5 1 9.5-1" fill="none" stroke={t.c3} strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
    </g>
  );

  const glowStyle = glow ? { filter: `drop-shadow(0 6px 18px ${t.glow})` } : undefined;

  if (variant === "mono") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={glow ? { filter: `drop-shadow(0 6px 16px ${t.glow})` } : undefined}>
        <defs>
          <linearGradient id={`mono-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={t.c1} /><stop offset="1" stopColor={t.c4} />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="80" height="80" rx="22" fill={`url(#mono-${uid})`} />
        <rect x="10" y="10" width="80" height="80" rx="22" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontFamily="'JetBrains Mono', monospace" fontWeight="800" fontSize="34" fill="#fff" letterSpacing="-1">{isDogs ? "BD" : "G+"}</text>
      </svg>
    );
  }

  if (variant === "shield") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" style={glow ? { filter: `drop-shadow(0 6px 16px ${t.glow})` } : undefined}>
        <defs>
          <linearGradient id={`sh-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.c2} stopOpacity="0.28" /><stop offset="1" stopColor={t.c4} stopOpacity="0.05" />
          </linearGradient>
          <radialGradient id={`core-${uid}`}><stop offset="0" stopColor={t.c1} /><stop offset="1" stopColor={t.c3} /></radialGradient>
        </defs>
        <path d="M50 8l34 11v26c0 22-16 36-34 47C32 81 16 67 16 45V19L50 8z" fill={`url(#sh-${uid})`} stroke={t.c3} strokeWidth="2.4" />
        <path d="M50 8l34 11v26c0 22-16 36-34 47C32 81 16 67 16 45V19L50 8z" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        {Core}
      </svg>
    );
  }

  // orbital (default)
  const ringO = { stroke: t.c3, opacity: 0.85 };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={glowStyle}>
      <defs>
        <radialGradient id={`core-${uid}`}><stop offset="0" stopColor={t.c1} /><stop offset="1" stopColor={t.c3} /></radialGradient>
        <radialGradient id={`halo-${uid}`}>
          <stop offset="0" stopColor={t.c2} stopOpacity="0.22" /><stop offset="1" stopColor={t.c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#halo-${uid})`} />
      <circle cx="50" cy="50" r="44" fill="none" stroke={t.c4} strokeWidth="1" opacity="0.5" />
      <circle cx="50" cy="50" r="38" fill="none" {...ringO} strokeWidth="2.2" />
      <circle cx="50" cy="50" r="29" fill="none" stroke={t.c3} strokeWidth="1" opacity="0.45" strokeDasharray="2 5" />
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i * Math.PI) / 12;
        const r0 = 38, r1 = i % 6 === 0 ? 33 : 35.5;
        return (
          <line key={i} x1={50 + Math.cos(a) * r0} y1={50 + Math.sin(a) * r0} x2={50 + Math.cos(a) * r1} y2={50 + Math.sin(a) * r1} stroke={t.c3} strokeWidth={i % 6 === 0 ? 1.6 : 0.8} opacity="0.55" />
        );
      })}
      {Core}
    </svg>
  );
}

// Compact wordmark lockup for the Bowl
export function BowlMark({ size = 1, ink = "#1b2433" }: { size?: number; ink?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 * size }}>
      <svg width={34 * size} height={34 * size} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke={TEAMS.dogs.accent} strokeWidth="2.2" />
        <path d="M2 22a18 18 0 0 0 36 0z" fill={TEAMS.gloom.accent} opacity="0.9" />
        <circle cx="20" cy="17" r="6.5" fill={TEAMS.dogs.c2} />
      </svg>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 * size, letterSpacing: "-0.01em", color: ink }}>
        June Gloom Bowl
      </div>
    </div>
  );
}
