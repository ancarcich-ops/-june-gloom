"""June Gloom: analyzing Southern California's coastal marine layer."""

from .fetch import STATIONS, fetch_hourly_clouds
from .analyze import (
    add_gloom_flags,
    daily_gloom_summary,
    june_gloom_by_year,
    burn_off_hour,
)

__version__ = "0.1.0"

__all__ = [
    "STATIONS",
    "fetch_hourly_clouds",
    "add_gloom_flags",
    "daily_gloom_summary",
    "june_gloom_by_year",
    "burn_off_hour",
]
