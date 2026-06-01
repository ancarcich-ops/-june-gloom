"""Unit tests for the gloom metrics -- run with `pytest`.

These use a small synthetic dataset so they need no network access.
"""

import pandas as pd

from june_gloom.analyze import (
    add_gloom_flags,
    daily_gloom_summary,
    june_gloom_by_year,
    burn_off_hour,
)


def _synthetic_day(date: str, station: str, morning_cloud, afternoon_cloud):
    """Build one day: hours 6-11 at morning_cloud, 12-17 at afternoon_cloud."""
    rows = []
    for h in range(6, 12):
        rows.append((f"{date} {h:02d}:00", morning_cloud, station))
    for h in range(12, 18):
        rows.append((f"{date} {h:02d}:00", afternoon_cloud, station))
    df = pd.DataFrame(rows, columns=["time", "cloud_cover", "station"])
    df["time"] = pd.to_datetime(df["time"])
    return df


def test_add_gloom_flags():
    df = _synthetic_day("2023-06-01", "lax", morning_cloud=90, afternoon_cloud=10)
    flagged = add_gloom_flags(df)
    assert flagged["is_gloomy"].sum() == 6  # the 6 overcast morning hours
    assert set(flagged.columns) >= {"date", "hour", "is_gloomy"}


def test_daily_summary_flags_gloomy_morning():
    gloomy = _synthetic_day("2023-06-01", "lax", 95, 5)
    clear = _synthetic_day("2023-06-02", "lax", 10, 5)
    summary = daily_gloom_summary(pd.concat([gloomy, clear]))

    by_date = summary.set_index("date")["gloomy_day"].to_dict()
    assert by_date[pd.Timestamp("2023-06-01").date()] is True or by_date[
        pd.Timestamp("2023-06-01").date()
    ]
    assert not by_date[pd.Timestamp("2023-06-02").date()]


def test_by_year_counts():
    days = pd.concat(
        [
            _synthetic_day("2023-06-01", "lax", 95, 5),
            _synthetic_day("2023-06-02", "lax", 95, 5),
            _synthetic_day("2023-06-03", "lax", 0, 0),
        ]
    )
    summary = daily_gloom_summary(days)
    by_year = june_gloom_by_year(summary)
    row = by_year.iloc[0]
    assert row["gloomy_days"] == 2
    assert row["total_days"] == 3


def test_burn_off_hour():
    # Overcast 6-9, clears at 10am.
    rows = [(f"2023-06-01 {h:02d}:00", 95 if h < 10 else 5, "lax") for h in range(6, 18)]
    df = pd.DataFrame(rows, columns=["time", "cloud_cover", "station"])
    df["time"] = pd.to_datetime(df["time"])
    result = burn_off_hour(df)
    assert result["burn_off_hour"].iloc[0] == 10
