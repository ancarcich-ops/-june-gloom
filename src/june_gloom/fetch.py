"""Download historical hourly cloud-cover data for SoCal coastal stations.

Uses the Open-Meteo Historical Weather API, which is free and requires no API
key. Docs: https://open-meteo.com/en/docs/historical-weather-api
"""

from __future__ import annotations

import requests
import pandas as pd

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
# The forecast endpoint serves recent *actuals* (via past_days) plus a short
# forecast -- used for tracking the current, in-progress season because the
# archive endpoint lags a few days behind real time.
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# A handful of representative Southern California coastal (and one inland)
# locations. lat/lon are approximate.
STATIONS: dict[str, dict[str, float]] = {
    "santa_monica": {"lat": 34.019, "lon": -118.491},
    "lax": {"lat": 33.942, "lon": -118.408},
    "long_beach": {"lat": 33.770, "lon": -118.194},
    "san_diego": {"lat": 32.734, "lon": -117.183},
    "santa_barbara": {"lat": 34.420, "lon": -119.698},
    # Inland comparison point (the marine layer rarely reaches here):
    "riverside_inland": {"lat": 33.953, "lon": -117.396},
}


def fetch_hourly_clouds(
    station: str,
    start_date: str,
    end_date: str,
    timezone: str = "America/Los_Angeles",
) -> pd.DataFrame:
    """Fetch hourly total cloud cover (%) for a station between two dates.

    Parameters
    ----------
    station:
        Key from ``STATIONS``.
    start_date, end_date:
        ISO dates, e.g. ``"2023-06-01"`` / ``"2023-06-30"``.
    timezone:
        IANA timezone for the returned timestamps.

    Returns
    -------
    DataFrame with columns ``["time", "cloud_cover", "station"]`` where
    ``time`` is timezone-naive local time and ``cloud_cover`` is 0-100%.
    """
    if station not in STATIONS:
        raise KeyError(
            f"Unknown station {station!r}. Options: {', '.join(STATIONS)}"
        )

    coords = STATIONS[station]
    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "cloud_cover",
        "timezone": timezone,
    }

    resp = requests.get(ARCHIVE_URL, params=params, timeout=60)
    resp.raise_for_status()
    hourly = resp.json()["hourly"]

    df = pd.DataFrame(
        {
            "time": pd.to_datetime(hourly["time"]),
            "cloud_cover": hourly["cloud_cover"],
        }
    )
    df["station"] = station
    return df


def fetch_june(station: str, year: int) -> pd.DataFrame:
    """Convenience wrapper: fetch all of June for a given year."""
    return fetch_hourly_clouds(station, f"{year}-06-01", f"{year}-06-30")


def fetch_recent_clouds(
    station: str,
    past_days: int = 31,
    forecast_days: int = 3,
    timezone: str = "America/Los_Angeles",
) -> pd.DataFrame:
    """Fetch recent *actual* + short-forecast hourly cloud cover.

    Unlike :func:`fetch_hourly_clouds` (archive, lags a few days), this uses the
    forecast endpoint so it includes today and the next few days -- the data we
    need to track the current, in-progress June.

    Returns the same columns as :func:`fetch_hourly_clouds` plus an
    ``is_forecast`` boolean marking hours at or after the current local hour.
    """
    if station not in STATIONS:
        raise KeyError(
            f"Unknown station {station!r}. Options: {', '.join(STATIONS)}"
        )

    coords = STATIONS[station]
    params = {
        "latitude": coords["lat"],
        "longitude": coords["lon"],
        "hourly": "cloud_cover",
        "past_days": past_days,
        "forecast_days": forecast_days,
        "timezone": timezone,
    }

    resp = requests.get(FORECAST_URL, params=params, timeout=60)
    resp.raise_for_status()
    hourly = resp.json()["hourly"]

    df = pd.DataFrame(
        {
            "time": pd.to_datetime(hourly["time"]),
            "cloud_cover": hourly["cloud_cover"],
        }
    )
    df["station"] = station
    now = pd.Timestamp.now(tz=timezone).tz_localize(None)
    df["is_forecast"] = df["time"] >= now.floor("h")
    # Cloud cover can be missing for the very latest hours; drop those rows.
    df = df.dropna(subset=["cloud_cover"]).reset_index(drop=True)
    return df
