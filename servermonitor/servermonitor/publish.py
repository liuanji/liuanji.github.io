"""JSON files read by the public /top page through the relay Worker.

Every file name is "<kind>-<host>" or "<kind>-<host>-<range>", where host is a
monitored host or "all":

- overview: Database.overview, the live per-GPU state of every host, without
  process paths and GPU UUIDs (paths reveal home directories and projects)
- stats-<host>: rolling-window summaries and user rankings for every period
- history-<host>-<range>: trend points for the chart, for every period, with
  only the fields the chart draws
"""

from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import Any

from .config import Settings
from .database import Database
from .web import PERIODS


PRIVATE_GPU_FIELDS = ("uuid", "processes")
HISTORY_FIELDS = ("utilization", "memory_percent", "gpus_in_use")


def public_history(points: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Only what the trend chart draws, to one decimal."""
    return [
        {
            "timestamp": point["timestamp"],
            **{key: round(point[key], 1) for key in HISTORY_FIELDS},
            "gpu_count": point["gpu_count"],
        }
        for point in points
    ]


def public_overview(overview: dict[str, Any]) -> dict[str, Any]:
    return {
        **overview,
        "hosts": [
            {
                **host,
                "gpus": [
                    {key: value for key, value in gpu.items() if key not in PRIVATE_GPU_FIELDS}
                    for gpu in host["gpus"]
                ],
            }
            for host in overview["hosts"]
        ],
    }


def build_files(
    settings: Settings, database: Database, now: int | None = None
) -> dict[str, Any]:
    now = int(time.time()) if now is None else now
    files: dict[str, Any] = {
        "overview": public_overview(
            database.overview(settings.hosts, settings.stale_after_seconds, now=now)
        )
    }
    for host in (None, *settings.hosts):
        key = host or "all"
        files[f"stats-{key}"] = {
            "generated_at": now,
            "host": host,
            "periods": database.period_summaries(PERIODS, now=now, host=host),
            "users": {
                name: database.user_summary(now - seconds, now, host)
                for name, seconds in PERIODS
            },
        }
        for name, seconds in PERIODS:
            start = now - seconds
            files[f"history-{key}-{name}"] = {
                "generated_at": now,
                "range": name,
                "host": host,
                "start": start,
                "end": now,
                "points": public_history(database.history(start, now, host)),
            }
    return files


def write_files(files: dict[str, Any], directory: Path) -> None:
    """Write each file as <name>.json, replacing it atomically so a reader never
    sees a partly written file."""
    directory.mkdir(parents=True, exist_ok=True)
    for name, payload in files.items():
        temporary = directory / f".{name}.json.tmp"
        temporary.write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        os.replace(temporary, directory / f"{name}.json")
