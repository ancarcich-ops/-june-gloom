import type { TeamId } from "./types";
import { TEAMS } from "./teams";

export interface Mood {
  ink: string;
  inkSoft: string;
  inkFaint: string;
  surface: string;
  surface2: string;
  surfaceSolid: string;
  border: string;
  borderStrong: string;
  scheme: "light" | "dark";
  index: number;
  isDay: boolean;
  leader: TeamId;
  drama: number;
  dayAmt: number;
  nightAmt: number;
  leadAccent: string;
  leadGlow: string;
  pageBg: string;
  skyBase: string;
}

/**
 * One number (the day's Gloom Index, 0..100) drives the entire day↔night theme.
 * Theme (ink/surfaces) flips at the 50 boundary for legibility; background drama
 * scales continuously with distance from 50.
 */
export function moodFromIndex(index: number, intensity = 1): Mood {
  const i = Math.max(0, Math.min(100, index));
  const isDay = i < 50;
  const drama = Math.min(1, (Math.abs(i - 50) / 50) * intensity);
  const nightAmt = Math.max(0, Math.min(1, (i - 40) / 20)); // crossfade band 40..60
  const dayAmt = 1 - nightAmt;
  const leader: TeamId = isDay ? "dogs" : "gloom";

  const v = isDay
    ? {
        ink: "#1b2433",
        inkSoft: "rgba(27,36,51,0.66)",
        inkFaint: "rgba(27,36,51,0.42)",
        surface: "rgba(255,255,255,0.66)",
        surface2: "rgba(255,255,255,0.82)",
        surfaceSolid: "#ffffff",
        border: "rgba(27,36,51,0.10)",
        borderStrong: "rgba(27,36,51,0.16)",
        scheme: "light" as const,
      }
    : {
        ink: "#eaf1fb",
        inkSoft: "rgba(234,241,251,0.66)",
        inkFaint: "rgba(234,241,251,0.40)",
        surface: "rgba(255,255,255,0.055)",
        surface2: "rgba(255,255,255,0.09)",
        surfaceSolid: "#101826",
        border: "rgba(255,255,255,0.12)",
        borderStrong: "rgba(255,255,255,0.2)",
        scheme: "dark" as const,
      };

  return {
    ...v,
    index: i,
    isDay,
    leader,
    drama,
    dayAmt,
    nightAmt,
    leadAccent: TEAMS[leader].accent,
    leadGlow: TEAMS[leader].glow,
    pageBg: isDay
      ? "linear-gradient(180deg, #ffe6b6 0%, #ffd98f 11%, #f2dca0 22%, #bcdcef 46%, #cde 78%, #d6ecf5 100%)"
      : "linear-gradient(180deg, #18253e 0%, #131e33 38%, #0d1626 70%, #080e1b 100%)",
    skyBase: isDay ? "#cfe6f3" : "#0a1322",
  };
}

/** Chosen design defaults (the prototype's "Tweaks" baked in). */
export const SKY_INTENSITY = 1.4;
export const CREST_VARIANT = "orbital" as const;
