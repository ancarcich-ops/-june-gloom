# 🎨 June Gloom Bowl — Design Handoff

A brief for improving this app **visually**. Hand this to a design-focused
session. It captures what the product is, the current visual system, where
everything lives, honest weaknesses, hard constraints, and specific asks.

> **TL;DR:** It's a fun, animated, sports-style **scoreboard** for a season-long
> rivalry between the sun and the marine layer over the SoCal coast. It works
> and the data is solid — now make it look like a polished sports broadcast /
> premium weather app, not a dev prototype.

- **Live site:** https://ancarcich-ops.github.io/-june-gloom/
- **Repo:** `ancarcich-ops/-june-gloom` · frontend lives in **`web/`**
- **Run it:** `cd web && npm install && npm run dev`

---

## 1. The concept

Every June day is a "game" in the **June Gloom Bowl**:

| Team | Emoji | Identity | Color | Tagline | Wins when… |
|---|---|---|---|---|---|
| **The Big Dogs** | 🌞 | the sun | gold/amber | "Burn it off" | the marine layer burns off |
| **The Gloom + Grant** | 🌫️ | the marine layer | cool slate/indigo | "Keep it grey" | the gloom holds |

We compute a 0–100 **Gloom Index** each morning (7 AM–noon) across six LA &
Orange County beaches; the average is the day's final score. ≥50 → Gloom win,
else Big Dogs. Season-long W–L record, cumulative points, streaks, and a 5-year
Hall of Champions (currently a balanced 75–75 all-time).

**Tone:** playful, competitive, a little dramatic — ESPN-meets-weather-app.
SoCal beach culture. Should feel *fun* and *shareable*, never sterile.

---

## 2. Current tech & where styles live

- **Stack:** Vite + React 18 + TypeScript + **Tailwind CSS v3.4** + **Framer
  Motion 11**. `canvas-confetti` for celebrations. No backend — data is fetched
  client-side from the Open-Meteo API. Deployed static to GitHub Pages.
- **Design-relevant files:**
  - `web/tailwind.config.js` — color tokens, fonts, keyframe animations
  - `web/src/index.css` — base background gradient, `.led`, `.card-glass`, scrollbars
  - `web/index.html` — Google Fonts, favicon, `<title>`/meta
  - `web/src/lib/teams.ts` — team identities, accent colors, gradients, glow
  - `web/src/components/*` — all UI (see §5)

> **Constraint:** redesigns should be implementable in Tailwind v3 + Framer
> Motion. SVG/CSS welcome; avoid heavy new dependencies or anything needing a
> server.

---

## 3. Current visual system (the tokens)

**Fonts** (Google Fonts)
- Display / UI: **Space Grotesk** (400–700)
- Numerals / scoreboard: **JetBrains Mono** (600–800), via `.led` class
  (`tabular-nums`, tight tracking) — meant to read like a stadium LED scoreboard.

**Colors**
- Gloom (cool slate/indigo): `#8aa0bb` / `#5f7794` / `#475a73`; team accent `#7d93ab`
- Dogs (gold/amber): `#fbbf24` / `#f59e0b` / `#d97706`; team accent `#f59e0b`
- Surfaces: translucent white over a dark blue-black gradient (`.card-glass` =
  `rgba(255,255,255,0.04)` + 1px white border + blur)
- Background: dark radial+linear gradient (navy → slate → black) with warm/cool
  glows.

**Motion**
- Count-up numbers, spring card entrances, staggered grids, pulsing "LIVE" dots,
  rotating sun rays, drifting fog, confetti on a day's winner.
- Keyframes: `pulseglow`, `float`.

**⚠️ Critical constraint — the mood-reactive background**
`web/src/components/DynamicBackground.tsx` changes the whole page mood based on
today's score: **warm/bright/golden + sun + rays** when the Dogs lead, **cool/
dark/foggy** when the Gloom leads, with drama scaling by distance from 50. Any
visual redesign **must keep content legible across both extremes** (a bright
gold wash *and* a dark gray fog). This is the trickiest design constraint.

---

## 4. Layout today

Single centered column, `max-w-4xl`, stacked glass cards on the dark gradient.
Top: title + a pill nav (`Scoreboard` | `How it works`). Order on the
Scoreboard view:

1. Scoreboard hero → 2. Today's Game → 3. Season Ledger → 4. City Box Score →
5. Gloom Index Trend → 6. Hall of Champions. Footer with data credit.

---

## 5. Component-by-component: current → opportunity

| Component | What it is now | Opportunity |
|---|---|---|
| `App.tsx` | Header, pill nav, view switch, loading/error, footer | Stronger header/branding; real logo lockup; richer empty/loading states |
| `DynamicBackground.tsx` | Full-screen sun/fog mood layer | Add depth/texture, parallax, beach/sky motifs; ensure legibility both extremes |
| `Scoreboard.tsx` | Two team panels (Dogs L / Gloom R) + VS, LED points, W–L, 👑 leader, streak | **The hero — make it a jumbotron.** Team crests, better VS treatment, more "stadium" energy |
| `TodayGame.tsx` | Live/final card: score line, tug-of-war bar, socked/cleared/burn-off stats | Make "today" feel like the marquee live event; clearer live state |
| `SeasonGrid.tsx` | 30 day-chips, winner-colored, live dot | Rhythm/legibility; could be a calendar or a "season schedule" strip |
| `CityBreakdown.tsx` | Per-beach index bars w/ midline | Map-based or more spatial treatment; beach identity |
| `TrendChart.tsx` | SVG sparkline, 50 baseline | Richer chart styling, axis/labels, gloom-vs-dogs shading |
| `HallOfChampions.tsx` | Per-season cards + mini sparklines + title tally | Trophy-case feel; champion badges; era storytelling (Dogs '21–'22, Gloom '23–'25) |
| `Methodology.tsx` | Long-form text explainer | Visual explainers/diagrams instead of walls of text |
| `Count.tsx` | Animated number | — (utility) |

---

## 6. Honest weaknesses / where it looks "dev-made"

1. **Sameness.** Every section is the same glass card stacked vertically — no
   hierarchy, no rhythm, no hero moment that dominates.
2. **No brand identity.** No logos/crests for the two teams or the "Bowl"
   itself. Emojis (🌞/🌫️) are doing all the identity work.
3. **Flat palette.** Dark + two accents; lacks depth, texture, and illustration.
   No beach/sky/SoCal iconography.
4. **Scoreboard doesn't feel like a scoreboard.** It's tasteful but reads like a
   dashboard, not a jumbotron/broadcast graphic.
5. **Typography hierarchy is weak.** Section headers are near-identical; numbers
   are the only strong type.
6. **Mobile.** The 3-column Dogs/VS/Gloom hero gets cramped; team names wrap.
   Needs a deliberate mobile-first layout.
7. **Dark-only.** No day/night or light treatment (could be tied to the score).
8. **No social/share visual** (OG image, share card).

---

## 7. Goals / north star

> A first-time visitor should instantly get *"oh, it's a fun sports rivalry —
> sun vs. fog — and here's today's score,"* and want to screenshot/share it.

Specifically: a **hero that dominates**, **team brand identity**, **depth &
texture** (without hurting legibility over the dynamic background), and a
confident **mobile** experience.

---

## 8. Specific design asks

1. **Team brand identity** — crests/badges/wordmarks for 🌞 The Big Dogs and
   🌫️ The Gloom + Grant, plus a "June Gloom Bowl" logo lockup. SVG preferred.
2. **Jumbotron hero** — redesign `Scoreboard` to feel like a broadcast/stadium
   scoreboard (the LED-mono numerals are a good starting hook).
3. **Visual hierarchy & section rhythm** — vary section treatments so the page
   has a beginning/middle/end, not six identical cards.
4. **Iconography & texture** — a small weather/beach icon set (sun, fog, marine
   layer, burn-off, beaches), subtle texture/depth.
5. **Mobile-first layouts** for the hero, today's game, and season grid.
6. **Color & elevation system** — refine into Tailwind tokens that stay legible
   over **both** the bright-sun and dark-fog background states.
7. **Today's Game marquee** — make the live/most-recent game the clear star.
8. **Hall of Champions** — a proper trophy case with champion badges + the era
   narrative.
9. **Share card / OG image** design (we'll wire up the implementation).
10. *(Stretch)* a day↔night visual tied to who's winning today.

---

## 9. Deliverables that help us most

Any of: annotated mockups/screens, a refined **Tailwind token set** (exact
hex/spacing/radii/shadows to drop into `tailwind.config.js`), per-component
redesign specs, and **SVG assets** (logos, crests, icons). If you produce code,
target the existing stack (Tailwind v3 + Framer Motion) and the file map in §5.

## 10. Please don't change

- The **scoring engine / methodology** (`web/src/lib/gloom.ts`) — it's
  calibrated; visual work shouldn't alter numbers.
- The **two-team concept**, names, and emoji shorthand (🌞/🌫️) — brand *around*
  them, don't replace them.
- The **client-only, static** architecture (no backend/API keys).

---

_Questions for the requester before diving in: (a) any existing brand colors/
fonts you love? (b) playful-cartoony or sleek-broadcast? (c) must it stay
dark-mode, or is a light/day treatment welcome?_
