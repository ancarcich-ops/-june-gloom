"""Download historical hourly cloud-cover data for SoCal coastal stations.

Uses the Open-Meteo Historical Weather API, which is free and requires no API
key. Docs: https://open-meteo.com/en/docs/historical-weather-api
"""

from __future__ import annotations

import requests
import pandas as pd

ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

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
