import type { TeamId } from "./types";

export interface Team {
  id: TeamId;
  name: string;
  short: string;
  emoji: string;
  who: string;
  tagline: string;
  winsWhen: string;
  /** Palette: c1 lightest → c4 darkest, plus the headline accent + glow. */
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  accent: string;
  glow: string;
}

export const TEAMS: Record<TeamId, Team> = {
  dogs: {
    id: "dogs",
    name: "The Big Dogs",
    short: "DOGS",
    emoji: "🌞",
    who: "the sun",
    tagline: "Burn it off",
    winsWhen: "the marine layer burns off",
    c1: "#fcd34d",
    c2: "#fbbf24",
    c3: "#f59e0b",
    c4: "#d97706",
    accent: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.55)",
  },
  gloom: {
    id: "gloom",
    name: "The Gloom + Grant",
    short: "GLOOM",
    emoji: "🌫️",
    who: "the marine layer",
    tagline: "Keep it grey",
    winsWhen: "the gloom holds",
    c1: "#aebfd6",
    c2: "#8aa0bb",
    c3: "#5f7794",
    c4: "#475a73",
    accent: "#7d93ab",
    glow: "rgba(125, 147, 171, 0.5)",
  },
};
