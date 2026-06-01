# June Gloom ☁️

[![CI](https://github.com/ancarcich-ops/-june-gloom/actions/workflows/ci.yml/badge.svg)](https://github.com/ancarcich-ops/-june-gloom/actions/workflows/ci.yml)

📊 **Live site:** https://ancarcich-ops.github.io/-june-gloom/ — charts, findings,
and downloadable data, rebuilt weekly by GitHub Actions.

Analyzing **June Gloom** — the persistent late-spring/early-summer marine layer
that blankets coastal Southern California in low clouds and fog, often burning
off by afternoon ("night and morning low clouds").

This project pulls historical weather observations, quantifies how "gloomy"
each June really is, and visualizes trends across years and locations.

## Questions this project explores

- How many "gloomy" days does a typical June have at a given coastal station?
- When does the marine layer typically burn off (cloud clearing time)?
- Is June Gloom getting better or worse over the years?
- How does the coast compare to a few miles inland?

## Project layout

```
june-gloom/
├── data/
│   ├── raw/            # Untouched downloaded source data (git-ignored)
│   └── processed/      # Cleaned, analysis-ready data (git-ignored)
├── notebooks/          # Jupyter notebooks for exploration
├── src/june_gloom/     # Reusable library code
│   ├── fetch.py        # Download weather observations
│   ├── analyze.py      # "Gloom" metrics & aggregations
│   └── plots.py        # Charts
├── tests/              # Unit tests
├── requirements.txt
└── README.md
```

## Getting started

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch Jupyter and open the starter notebook
jupyter lab notebooks/01_explore_june_gloom.ipynb
```

## Data sources

- **NOAA NCEI** — Global Historical Climatology Network (GHCN-Daily) and
  Local Climatological Data (LCD) for cloud cover, sky condition, and sunshine.
  https://www.ncei.noaa.gov/
- **Open-Meteo** — free historical weather API (cloud cover, no API key needed).
  https://open-meteo.com/en/docs/historical-weather-api

Candidate SoCal stations: LAX, Long Beach, Santa Monica, San Diego (Lindbergh),
Santa Barbara, Oceanside.

## License

MIT — see [LICENSE](LICENSE).
