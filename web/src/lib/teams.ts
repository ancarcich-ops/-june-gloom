import type { TeamId } from "./types";

export interface TeamTheme {
  id: TeamId;
  name: string;
  short: string;
  emoji: string;
  tagline: string;
  /** Tailwind-ready color tokens. */
  accent: string; // hex
  text: string; // tailwind text class
  ring: string; // tailwind ring class
  gradFrom: string;
  gradTo: string;
  glow: string; // box-shadow color
}

export const TEAMS: Record<TeamId, TeamTheme> = {
  gloom: {
    id: "gloom",
    name: "The Gloom + Grant",
    short: "GLOOM",
    emoji: "🌫️",
    tagline: "Keep it grey",
    accent: "#7d93ab",
    text: "text-gloom-400",
    ring: "ring-gloom-500",
    gradFrom: "from-slate-600/40",
    gradTo: "to-indigo-900/30",
    glow: "rgba(125,147,171,0.55)",
  },
  dogs: {
    id: "dogs",
    name: "The Big Dogs",
    short: "DOGS",
    emoji: "🌞",
    tagline: "Burn it off",
    accent: "#f59e0b",
    text: "text-dogs-400",
    ring: "ring-dogs-500",
    gradFrom: "from-amber-500/30",
    gradTo: "to-orange-700/20",
    glow: "rgba(245,158,11,0.55)",
  },
};
