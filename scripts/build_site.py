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

from june_gloom.fetch import (  # noqa: E402
    fetch_june,
    fetch_recent_clouds,
    STATIONS,
)
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


def _sample_recent() -> pd.DataFrame:
    """Synthetic recent data for offline testing of the season tracker."""
    import numpy as np

    rng = np.random.default_rng(7)
    today = dt.date.today()
    start = dt.date(today.year, 6, 1)
    rows = []
    for station in STATIONS_TO_USE:
        base = 25 if "inland" in station else 75
        day = start
        while day <= today + dt.timedelta(days=3):
            for hour in range(24):
                morning = hour < 12
                mean = base + (15 if morning else -25)
                cloud = float(min(100, max(0, rng.normal(mean, 20))))
                ts = pd.Timestamp(day.year, day.month, day.day, hour)
                rows.append((ts, cloud, station, day > today))
            day += dt.timedelta(days=1)
    return pd.DataFrame(
        rows, columns=["time", "cloud_cover", "station", "is_forecast"]
    )


def gather_recent() -> pd.DataFrame:
    """Recent actual + short-forecast data for the current-season tracker."""
    if os.environ.get("JUNE_GLOOM_SAMPLE") == "1":
        return _sample_recent()

    today = dt.date.today()
    # Reach back to June 1 of the current year (clamped to the API's 92-day max).
    past_days = min(max((today - dt.date(today.year, 6, 1)).days + 1, 1), 92)
    frames = []
    for station in STATIONS_TO_USE:
        try:
            frames.append(
                fetch_recent_clouds(station, past_days=past_days, forecast_days=3)
            )
            print(f"  fetched recent {station}")
        except Exception as exc:
            print(f"  WARN: recent {station}: {exc}")
    if not frames:
        return pd.DataFrame(
            columns=["time", "cloud_cover", "station", "is_forecast"]
        )
    return pd.concat(frames, ignore_index=True)


# --------------------------------------------------------------------------- #
# HTML rendering
# --------------------------------------------------------------------------- #
def _nice(station: str) -> str:
    return station.replace("_", " ").title()


def _cell(status: str, day: int) -> str:
    """One calendar cell. status in gloomy/clear/fc_gloomy/fc_clear/none."""
    styles = {
        "gloomy": ("#6b7c8c", "#fff", "", "☁"),
        "clear": ("#f4c95d", "#5b4a1a", "", "☀"),
        "fc_gloomy": ("#aeb9c4", "#2b3742", "dashed", "☁"),
        "fc_clear": ("#f7e2a6", "#5b4a1a", "dashed", "☀"),
        "none": ("#eef2f6", "#aab4be", "", ""),
    }
    bg, fg, border, glyph = styles[status]
    bd = f"border:1px dashed #8a97a3;" if border else ""
    return (
        f'<td title="June {day}" style="background:{bg};color:{fg};{bd}'
        f'width:26px;height:30px;text-align:center;font-size:.8rem;'
        f'border-radius:5px;">{day}<br><span style="font-size:.7rem">'
        f"{glyph}</span></td>"
    )


def render_season(df_recent: pd.DataFrame) -> str:
    """Build the 'current June, live' tracker card."""
    today = dt.date.today()
    year = today.year

    times = pd.to_datetime(df_recent["time"]) if len(df_recent) else df_recent
    june = (
        df_recent[(times.dt.year == year) & (times.dt.month == 6)]
        if len(df_recent)
        else df_recent
    )
    if len(june) == 0:
        return (
            '<div class="card"><h2>June ' + str(year) + " — live tracker</h2>"
            "<p class=\"muted\">No current-season data yet. This section fills "
            "in once June begins and the daily build runs.</p></div>"
        )

    actual = june[~june["is_forecast"]]
    forecast = june[june["is_forecast"]]

    daily_actual = (
        analyze.daily_gloom_summary(actual) if len(actual) else pd.DataFrame()
    )
    daily_fc = (
        analyze.daily_gloom_summary(forecast)
        if len(forecast)
        else pd.DataFrame()
    )

    # (station, day) -> status
    status: dict[tuple[str, int], str] = {}
    for _, r in daily_actual.iterrows():
        d = pd.Timestamp(r["date"]).day
        status[(r["station"], d)] = "gloomy" if r["gloomy_day"] else "clear"
    for _, r in daily_fc.iterrows():
        d = pd.Timestamp(r["date"]).day
        key = (r["station"], d)
        if key not in status:  # don't overwrite an actual with a forecast
            status[key] = "fc_gloomy" if r["gloomy_day"] else "fc_clear"

    burn = analyze.burn_off_hour(actual) if len(actual) else pd.DataFrame()
    burn_today = {}
    if len(burn):
        tmask = pd.to_datetime(burn["date"]).dt.date == today
        for _, r in burn[tmask].iterrows():
            burn_today[r["station"]] = r["burn_off_hour"]

    # Per-station summary lines + calendar rows
    summary_lines = []
    grid_rows = ""
    for station in STATIONS_TO_USE:
        st_days = daily_actual[daily_actual["station"] == station] if len(
            daily_actual
        ) else pd.DataFrame()
        gloomy_so_far = int(st_days["gloomy_day"].sum()) if len(st_days) else 0
        elapsed = int(st_days["date"].nunique()) if len(st_days) else 0
        todays = status.get((station, today.day))
        today_txt = {
            "gloomy": "☁ gloomy",
            "clear": "☀ clear",
            None: "—",
        }.get(todays, "—")
        bt = burn_today.get(station)
        if todays == "gloomy":
            burn_txt = (
                f" · burned off ~{bt:.0f}:00"
                if bt is not None and pd.notna(bt)
                else " · hadn't cleared yet"
            )
        else:
            burn_txt = ""
        summary_lines.append(
            f"<li><strong>{_nice(station)}</strong>: "
            f"{gloomy_so_far}/{elapsed} gloomy mornings so far · "
            f"today {today_txt}{burn_txt}</li>"
        )

        cells = "".join(
            _cell(status.get((station, d), "none"), d) for d in range(1, 31)
        )
        grid_rows += (
            f'<tr><th style="text-align:right;padding-right:.6rem;'
            f'white-space:nowrap">{_nice(station)}</th>{cells}</tr>'
        )

    legend = (
        '<span style="background:#6b7c8c;color:#fff;padding:1px 7px;'
        'border-radius:4px">☁ gloomy</span> &nbsp; '
        '<span style="background:#f4c95d;padding:1px 7px;border-radius:4px">'
        "☀ cleared</span> &nbsp; "
        '<span style="border:1px dashed #8a97a3;padding:1px 7px;'
        'border-radius:4px">dashed = forecast</span>'
    )

    return f"""
  <div class="card" style="border-top:4px solid var(--accent)">
    <h2>June {year} — live tracker 🔴</h2>
    <p class="muted">Updated daily from recent observations (and a 3-day
    forecast peek). Day {today.day} of 30.</p>
    <ul class="findings">{''.join(summary_lines)}</ul>
    <div style="overflow-x:auto">
      <table style="border-collapse:separate;border-spacing:3px">
        {grid_rows}
      </table>
    </div>
    <p class="muted" style="margin-top:.6rem">{legend}</p>
  </div>
"""


def render_html(
    by_year: pd.DataFrame, burn_off: pd.DataFrame, season_html: str = ""
) -> str:
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
  {season_html}
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

    # Current-season live tracker
    season_html = render_season(gather_recent())

    # Prevent Jekyll from touching the static files
    (DOCS / ".nojekyll").write_text("")
    (DOCS / "index.html").write_text(
        render_html(by_year, burn_off, season_html)
    )

    print(f"Site written to {DOCS}")


if __name__ == "__main__":
    main()
