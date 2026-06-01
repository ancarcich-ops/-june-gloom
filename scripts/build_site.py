"""Build the static GitHub Pages site for June Gloom.

Fetches June cloud-cover data for a few SoCal stations across several years,
computes the gloom metrics, renders charts + a data table, and writes a
self-contained ``docs/`` folder that GitHub Pages serves.

Run locally with::

    python scripts/build_site.py

Needs network access to the Open-Meteo API (available on GitHub Actions
runners). Set ``JUNE_GLOOM_SAMPLE=1`` to render from synthetic data instead,
which is handy for offline testing of the layout.
"""

from __future__ import annotations

import os
import sys
import pathlib
import datetime as dt

import pandas as pd

import matplotlib

matplotlib.use("Agg")  # headless / no display
import matplotlib.pyplot as plt

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

from june_gloom.fetch import fetch_june, STATIONS  # noqa: E402
from june_gloom import analyze, plots  # noqa: E402

STATIONS_TO_USE = ["santa_monica", "san_diego", "riverside_inland"]

# Only include Junes that have fully passed (June ends in month 6), so we never
# render a partial/empty bar for the current year.
_today = dt.date.today()
_last_full_year = _today.year if _today.month > 6 else _today.year - 1
YEARS = list(range(2015, _last_full_year + 1))

DOCS = ROOT / "docs"


# --------------------------------------------------------------------------- #
# Data gathering
# --------------------------------------------------------------------------- #
def _sample_frame() -> pd.DataFrame:
    """Synthetic June data for offline layout testing (JUNE_GLOOM_SAMPLE=1)."""
    import numpy as np

    rng = np.random.default_rng(42)
    rows = []
    for st in STATIONS_TO_USE:
        # Inland is far less gloomy than the coast.
        base = 25 if "inland" in st else 75
        for year in YEARS:
            for day in range(1, 31):
                for hour in range(24):
                    # Overcast mornings that burn off by early afternoon.
                    morning = hour < 12
                    mean = base + (15 if morning else -25)
                    cloud = float(min(100, max(0, rng.normal(mean, 18))))
                    rows.append(
                        (pd.Timestamp(year, 6, day, hour), cloud, st)
                    )
    return pd.DataFrame(rows, columns=["time", "cloud_cover", "station"])


def gather() -> pd.DataFrame:
    if os.environ.get("JUNE_GLOOM_SAMPLE") == "1":
        print("Using synthetic sample data (JUNE_GLOOM_SAMPLE=1).")
        return _sample_frame()

    frames = []
    for station in STATIONS_TO_USE:
        for year in YEARS:
            try:
                frames.append(fetch_june(station, year))
                print(f"  fetched {station} {year}")
            except Exception as exc:  # keep going if one year is unavailable
                print(f"  WARN: {station} {year}: {exc}")
    if not frames:
        raise RuntimeError("No data fetched; cannot build site.")
    return pd.concat(frames, ignore_index=True)


# --------------------------------------------------------------------------- #
# HTML rendering
# --------------------------------------------------------------------------- #
def _nice(station: str) -> str:
    return station.replace("_", " ").title()


def render_html(by_year: pd.DataFrame, burn_off: pd.DataFrame) -> str:
    built = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    latest = by_year["year"].max()

    # Headline findings -----------------------------------------------------
    latest_rows = by_year[by_year["year"] == latest].sort_values(
        "gloomy_days", ascending=False
    )
    gloomiest = latest_rows.iloc[0]
    least = latest_rows.iloc[-1]
    avg_burn = burn_off.groupby("station")["burn_off_hour"].mean()

    findings = [
        f"In June {latest}, <strong>{_nice(gloomiest['station'])}</strong> "
        f"was the gloomiest with <strong>{int(gloomiest['gloomy_days'])} "
        f"gloomy mornings</strong> "
        f"({gloomiest['gloomy_pct']:.0f}% of the month).",
        f"<strong>{_nice(least['station'])}</strong> was the clearest "
        f"({int(least['gloomy_days'])} gloomy mornings).",
    ]
    for station, hour in avg_burn.items():
        if pd.notna(hour):
            findings.append(
                f"The marine layer over <strong>{_nice(station)}</strong> "
                f"typically burned off around <strong>{hour:.0f}:00</strong> "
                f"local time."
            )

    # Data table ------------------------------------------------------------
    pivot = (
        by_year.pivot(index="year", columns="station", values="gloomy_days")
        .sort_index()
    )
    cols = "".join(f"<th>{_nice(c)}</th>" for c in pivot.columns)
    body_rows = ""
    for year, row in pivot.iterrows():
        cells = "".join(
            f"<td>{'' if pd.isna(v) else int(v)}</td>" for v in row
        )
        body_rows += f"<tr><th>{year}</th>{cells}</tr>"

    findings_html = "".join(f"<li>{f}</li>" for f in findings)

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>June Gloom — SoCal Marine Layer Analysis</title>
<style>
  :root {{ --ink:#1d2733; --muted:#5b6b7b; --bg:#f4f7fa; --card:#fff;
           --accent:#3b6ea5; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; font-family:-apple-system,Segoe UI,Roboto,Helvetica,
          Arial,sans-serif; color:var(--ink); background:var(--bg);
          line-height:1.55; }}
  header {{ background:linear-gradient(135deg,#6b8cae,#9fb6cd); color:#fff;
            padding:3rem 1.5rem; text-align:center; }}
  header h1 {{ margin:0 0 .3rem; font-size:2.4rem; }}
  header p {{ margin:0; opacity:.9; }}
  main {{ max-width:920px; margin:0 auto; padding:1.5rem; }}
  .card {{ background:var(--card); border-radius:12px; padding:1.5rem 1.75rem;
           margin:1.25rem 0; box-shadow:0 1px 3px rgba(0,0,0,.08); }}
  h2 {{ color:var(--accent); margin-top:0; }}
  img {{ max-width:100%; height:auto; border-radius:8px; }}
  table {{ border-collapse:collapse; width:100%; margin-top:.5rem;
           font-variant-numeric:tabular-nums; }}
  th,td {{ padding:.5rem .7rem; text-align:center;
           border-bottom:1px solid #e6edf3; }}
  thead th {{ color:var(--muted); font-weight:600; }}
  tbody th {{ color:var(--ink); }}
  ul.findings li {{ margin:.35rem 0; }}
  .muted {{ color:var(--muted); font-size:.9rem; }}
  a {{ color:var(--accent); }}
  footer {{ text-align:center; padding:2rem 1rem; color:var(--muted);
            font-size:.85rem; }}
</style>
</head>
<body>
<header>
  <h1>☁️ June Gloom</h1>
  <p>How grey are Southern California's June mornings, really?</p>
</header>
<main>
  <div class="card">
    <h2>Key findings</h2>
    <ul class="findings">{findings_html}</ul>
    <p class="muted">A "gloomy morning" = the 6–11&nbsp;AM window was mostly
    overcast (≥80% cloud cover). Data: Open-Meteo historical archive.</p>
  </div>

  <div class="card">
    <h2>Gloomy mornings per June, by year</h2>
    <img src="charts/gloomy_days_by_year.png"
         alt="Bar chart of gloomy mornings per June by year and station">
  </div>

  <div class="card">
    <h2>The burn-off curve (June {latest})</h2>
    <p class="muted">Average cloud cover by hour of day — watch the coast
    clear out by afternoon while it stays low inland.</p>
    <img src="charts/cloud_profile.png"
         alt="Line chart of average cloud cover by hour of day">
  </div>

  <div class="card">
    <h2>The numbers</h2>
    <table>
      <thead><tr><th>Year</th>{cols}</tr></thead>
      <tbody>{body_rows}</tbody>
    </table>
    <p class="muted" style="margin-top:1rem">
      Download raw data:
      <a href="data/gloomy_days_by_year.csv">gloomy_days_by_year.csv</a> ·
      <a href="data/june_gloom_daily.csv">june_gloom_daily.csv</a>
    </p>
  </div>
</main>
<footer>
  Built {built} ·
  <a href="https://github.com/ancarcich-ops/-june-gloom">source on GitHub</a>
</footer>
</body>
</html>
"""


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
def main() -> None:
    (DOCS / "charts").mkdir(parents=True, exist_ok=True)
    (DOCS / "data").mkdir(parents=True, exist_ok=True)

    df = gather()
    daily = analyze.daily_gloom_summary(df)
    by_year = analyze.june_gloom_by_year(daily)

    # Save data
    daily.to_csv(DOCS / "data" / "june_gloom_daily.csv", index=False)
    by_year.to_csv(DOCS / "data" / "gloomy_days_by_year.csv", index=False)

    # Chart 1: gloomy days by year
    ax = plots.plot_gloomy_days_by_year(by_year)
    ax.figure.tight_layout()
    ax.figure.savefig(DOCS / "charts" / "gloomy_days_by_year.png", dpi=120)
    plt.close(ax.figure)

    # Chart 2: burn-off curve for the most recent June
    latest = by_year["year"].max()
    recent = df[pd.to_datetime(df["time"]).dt.year == latest]
    ax2 = plots.plot_hourly_cloud_profile(recent)
    ax2.figure.tight_layout()
    ax2.figure.savefig(DOCS / "charts" / "cloud_profile.png", dpi=120)
    plt.close(ax2.figure)

    burn_off = analyze.burn_off_hour(recent)

    # Prevent Jekyll from touching the static files
    (DOCS / ".nojekyll").write_text("")
    (DOCS / "index.html").write_text(render_html(by_year, burn_off))

    print(f"Site written to {DOCS}")


if __name__ == "__main__":
    main()
