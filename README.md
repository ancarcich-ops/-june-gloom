# June Gloom Bowl 🌞🌫️

[![CI](https://github.com/ancarcich-ops/-june-gloom/actions/workflows/ci.yml/badge.svg)](https://github.com/ancarcich-ops/-june-gloom/actions/workflows/ci.yml)

🏆 **Live scoreboard:** https://ancarcich-ops.github.io/-june-gloom/

A fun, animated **scoreboard** that tracks a season-long rivalry over Southern
California's **June Gloom** — the late-spring marine layer that socks the coast
in low cloud each morning:

- **🌞 The Big Dogs** score when the sun wins (the layer burns off).
- **🌫️ The Gloom + Grant** score when the gloom holds.

Every June day is a "game." Over the 7 AM–noon burn-off window we compute a **Gloom Index (0–100)** for
six LA & Orange County beaches from live weather data; the coastal average is the
day's final score and decides the winner. The site shows a cumulative scoreboard,
today's live game, a season ledger, per-city box score, and an index trend — plus
a full [**methodology**](https://ancarcich-ops.github.io/-june-gloom/) page
explaining the math.

## The Gloom Index (short version)

Per beach, over the 7 AM–noon burn-off window:

```
Index = 0.5 · meanLowCloud
      + 0.3 · (1 − sunFraction) · 100
      + 0.2 · pctMorningSocked
```

Index ≥ 50 → Gloom wins the day; below → Big Dogs. The six beaches are averaged
into the official daily score. Full details, thresholds, and a worked example
live on the in-app **How it works** page.

## Tech

- **Frontend** (`web/`): Vite + React + TypeScript, with a broadcast-style design
  and a day↔night "mood engine" (CSS variables driven by today's Gloom Index —
  light & warm when the sun leads, dark & foggy when the gloom holds).
  Fetches live weather **client-side** from Open-Meteo (no server, no API key).
- **Deploy**: GitHub Actions builds `web/` and publishes to GitHub Pages.
- **Python library** (`src/june_gloom/`): the original historical analysis
  toolkit (cloud-cover fetch + gloom metrics) with a pytest suite, still used for
  notebook-based exploration.

## Run the scoreboard locally

```bash
cd web
npm install
npm run dev        # open the printed localhost URL
npm run build      # production build into web/dist
```

## Run the Python analysis (optional)

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
jupyter lab notebooks/01_explore_june_gloom.ipynb
```

## Data source

- **Open-Meteo** — free weather API, no API key. The scoreboard uses the
  *forecast* endpoint (recent hourly observations + short forecast) for live
  low-cloud and sunshine data; the Python library can also use the *archive*
  endpoint for multi-year history. https://open-meteo.com/

Scoreboard panel (LA + Orange County beaches): Santa Monica, Manhattan Beach,
Long Beach, Huntington Beach, Newport Beach, Laguna Beach.

## License

MIT — see [LICENSE](LICENSE).
