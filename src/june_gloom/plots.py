"""Simple matplotlib charts for June Gloom analysis."""

from __future__ import annotations

import matplotlib.pyplot as plt
import pandas as pd


def plot_gloomy_days_by_year(by_year: pd.DataFrame, ax=None):
    """Bar chart of gloomy days per year, one series per station.

    Expects the output of ``analyze.june_gloom_by_year``.
    """
    if ax is None:
        _, ax = plt.subplots(figsize=(9, 5))

    pivot = by_year.pivot(index="year", columns="station", values="gloomy_days")
    pivot.plot(kind="bar", ax=ax)
    ax.set_xlabel("Year")
    ax.set_ylabel("Gloomy days in June")
    ax.set_title("June Gloom: gloomy mornings per year")
    ax.legend(title="Station")
    return ax


def plot_hourly_cloud_profile(df: pd.DataFrame, ax=None):
    """Average cloud cover by hour of day -- shows the burn-off curve."""
    if ax is None:
        _, ax = plt.subplots(figsize=(9, 5))

    work = df.copy()
    work["hour"] = work["time"].dt.hour
    for station, grp in work.groupby("station"):
        profile = grp.groupby("hour")["cloud_cover"].mean()
        ax.plot(profile.index, profile.values, marker="o", label=station)

    ax.set_xlabel("Hour of day (local)")
    ax.set_ylabel("Mean cloud cover (%)")
    ax.set_title("Average daily cloud-cover profile (the burn-off curve)")
    ax.set_xticks(range(0, 24, 2))
    ax.legend(title="Station")
    return ax
