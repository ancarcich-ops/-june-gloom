"""Turn raw hourly cloud-cover data into 'gloom' metrics.

A "gloomy" hour is one where total cloud cover is at or above a threshold
(default 80%). A "gloomy day" is one whose morning (a configurable window) is
mostly overcast -- the classic June Gloom signature of grey mornings that may
or may not burn off by afternoon.
"""

from __future__ import annotations

import pandas as pd

GLOOM_CLOUD_THRESHOLD = 80  # percent cloud cover considered "gloomy"
MORNING_HOURS = range(6, 12)  # 6am-11am local, the marine-layer window


def add_gloom_flags(
    df: pd.DataFrame, threshold: int = GLOOM_CLOUD_THRESHOLD
) -> pd.DataFrame:
    """Add ``date``, ``hour`` and boolean ``is_gloomy`` columns."""
    out = df.copy()
    out["date"] = out["time"].dt.date
    out["hour"] = out["time"].dt.hour
    out["is_gloomy"] = out["cloud_cover"] >= threshold
    return out


def daily_gloom_summary(
    df: pd.DataFrame,
    threshold: int = GLOOM_CLOUD_THRESHOLD,
    morning_hours: range = MORNING_HOURS,
) -> pd.DataFrame:
    """Collapse hourly data to one row per day.

    Columns: ``date``, ``station``, ``mean_cloud``, ``morning_gloom_frac``
    (fraction of morning hours that were gloomy) and ``gloomy_day`` (True when
    the majority of the morning window was overcast).
    """
    flagged = add_gloom_flags(df, threshold)
    morning = flagged[flagged["hour"].isin(list(morning_hours))]

    morning_frac = (
        morning.groupby(["station", "date"])["is_gloomy"].mean()
        .rename("morning_gloom_frac")
    )
    mean_cloud = (
        flagged.groupby(["station", "date"])["cloud_cover"].mean()
        .rename("mean_cloud")
    )

    summary = pd.concat([mean_cloud, morning_frac], axis=1).reset_index()
    summary["gloomy_day"] = summary["morning_gloom_frac"] >= 0.5
    return summary


def june_gloom_by_year(daily: pd.DataFrame) -> pd.DataFrame:
    """Count gloomy days per (station, year) from a daily summary frame."""
    out = daily.copy()
    out["year"] = pd.to_datetime(out["date"]).dt.year
    return (
        out.groupby(["station", "year"])["gloomy_day"]
        .agg(gloomy_days="sum", total_days="count")
        .reset_index()
        .assign(gloomy_pct=lambda d: 100 * d["gloomy_days"] / d["total_days"])
    )


def burn_off_hour(
    df: pd.DataFrame, threshold: int = GLOOM_CLOUD_THRESHOLD
) -> pd.DataFrame:
    """Estimate when the marine layer 'burns off' each day.

    Defined as the first hour after 6am at which cloud cover drops below the
    gloom threshold and stays there. Returns one row per day with a
    ``burn_off_hour`` (or NaN if it never cleared).
    """
    flagged = add_gloom_flags(df, threshold)

    def _first_clear(group: pd.DataFrame) -> float:
        day = group[group["hour"] >= 6].sort_values("hour")
        clear = day[~day["is_gloomy"]]
        return float(clear["hour"].iloc[0]) if not clear.empty else float("nan")

    result = (
        flagged.groupby(["station", "date"])
        .apply(_first_clear, include_groups=False)
        .rename("burn_off_hour")
        .reset_index()
    )
    return result
