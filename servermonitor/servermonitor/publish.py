"""JSON files read by the public /top page through the relay Worker.

File names are "<kind>-<host>", "<kind>-<host>-<range>" or "<kind>-<range>",
where host is a monitored host or "all":

- overview: Database.overview, the live per-GPU state of every host, without
  process paths and GPU UUIDs (paths reveal home directories and projects)
- stats-<host>: rolling-window summaries and user rankings for every period
- history-<host>-<range>: trend points for the chart, for every period, with
  only the fields the chart draws
- uptime-<range>: every host's checked and down seconds per bar, for every period
- disks: every host's latest disk usage, built apart by public_disks since it
  changes only once per disk check
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
    """Only what the trend chart and the period tiles' trends draw, to one
    decimal. Power is the total draw, like the GPU power tile: the average per
    GPU reading times the GPUs in the point."""
    return [
        {
            "timestamp": point["timestamp"],
            **{key: round(point[key], 1) for key in HISTORY_FIELDS},
            "gpu_count": point["gpu_count"],
            "power_w": None
            if point.get("power_w") is None
            else round(point["power_w"] * point["gpu_count"]),
        }
        for point in points
    ]


def public_overview(
    overview: dict[str, Any], accounts: dict[str, list[str]] | None = None
) -> dict[str, Any]:
    """The overview without process details; each host's per-user CPU and memory
    keeps only its login accounts (none while they are unknown)."""
    accounts = accounts or {}

    def system(host: dict[str, Any]) -> dict[str, Any] | None:
        if not host.get("system"):
            return host.get("system")
        known = set(accounts.get(host["name"], []))
        people = host["system"].get("users")
        return {
            **host["system"],
            "users": None if people is None else [user for user in people if user["user"] in known],
        }

    return {
        **overview,
        "hosts": [
            {
                **host,
                "system": system(host),
                "gpus": [
                    {key: value for key, value in gpu.items() if key not in PRIVATE_GPU_FIELDS}
                    for gpu in host["gpus"]
                ],
            }
            for host in overview["hosts"]
        ],
    }


# Each GPU's last day in quarter hours, and the typical week over four weeks.
TIMELINE_BUCKET_SECONDS = 900
WEEK_PATTERN_DAYS = 28


def public_gpus(database: Database, host: str, now: int, utc_offset: int) -> dict[str, Any]:
    end = now - now % TIMELINE_BUCKET_SECONDS + TIMELINE_BUCKET_SECONDS
    start = end - 86400
    return {
        "generated_at": now,
        "host": host,
        "start": start,
        "end": end,
        "bucket_seconds": TIMELINE_BUCKET_SECONDS,
        "gpus": database.gpu_timeline(host, start, end, TIMELINE_BUCKET_SECONDS),
        "system": database.system_timeline(host, start, end, TIMELINE_BUCKET_SECONDS),
        "utc_offset": utc_offset,
        "week_days": WEEK_PATTERN_DAYS,
        "week": database.week_pattern(host, now, WEEK_PATTERN_DAYS, utc_offset),
    }


LIVE_PERIODS = PERIODS[:1]

# Availability bars per period: (bar length in seconds, number of bars).
UPTIME_BARS = {
    "1h": (60, 60),
    "24h": (1800, 48),
    "7d": (7200, 84),
    "30d": (86400, 30),
    "90d": (86400, 90),
    "365d": (7 * 86400, 52),
}


def uptime_window(now: int, bar_seconds: int, bars: int, utc_offset: int) -> int:
    """Start of the first bar. The last bar holds now; on the local clock, bars
    start on whole multiples of their length, and bars of a day or longer end
    at midnight."""
    unit = min(bar_seconds, 86400)
    local = now + utc_offset
    end = local - local % unit + unit - utc_offset
    return end - bar_seconds * bars


def public_uptime(
    settings: Settings, database: Database, name: str, now: int, utc_offset: int
) -> dict[str, Any]:
    bar_seconds, bars = UPTIME_BARS[name]
    start = uptime_window(now, bar_seconds, bars, utc_offset)
    return {
        "generated_at": now,
        "range": name,
        "bar_seconds": bar_seconds,
        # Day and week bars run midnight to midnight at this offset from UTC.
        "utc_offset": utc_offset,
        "start": start,
        "end": start + bar_seconds * bars,
        "hosts": database.availability(settings.hosts, start, bar_seconds, bars),
    }


def disk_users(folders: list[dict[str, Any]], accounts: set[str]) -> list[dict[str, Any]]:
    """A disk's usage per user, largest first: folders summed by owner, counting
    only owners who are login accounts, so lost+found and other system folders
    (owned by root) are left out."""
    totals: dict[str, int] = {}
    for folder in folders:
        if folder["owner"] in accounts:
            totals[folder["owner"]] = totals.get(folder["owner"], 0) + folder["bytes"]
    return [
        {"user": user, "bytes": size}
        for user, size in sorted(totals.items(), key=lambda item: (-item[1], item[0]))
    ]


def public_disks(settings: Settings, database: Database, now: int | None = None) -> dict[str, Any]:
    """Each host's disks; with a scratch-usage summary, every disk also lists its
    users and the host says when they were measured (usage_checked_at)."""
    hosts = database.disks(settings.hosts)
    accounts = database.accounts(settings.hosts)
    usage = database.usage(settings.hosts)
    for host in hosts:
        summary = usage[host["name"]]
        host["usage_checked_at"] = summary["checked_at"] if summary else None
        for disk in host["disks"]:
            folders = summary["mounts"].get(disk["mount"]) if summary else None
            disk["users"] = None if folders is None else disk_users(folders, set(accounts[host["name"]]))
    checked = [host["checked_at"] for host in hosts if host["checked_at"] is not None]
    return {
        "generated_at": int(time.time()) if now is None else now,
        "checked_at": max(checked, default=None),
        "hosts": hosts,
    }


def public_roster(settings: Settings, database: Database) -> dict[str, Any]:
    """Who may sign in to the page and reserve which GPUs: each host's login
    accounts and GPU indices. Uploaded for the Worker only; it never serves it."""
    accounts = database.accounts(settings.hosts)
    overview = database.overview(settings.hosts, settings.stale_after_seconds)
    return {
        "hosts": {
            host["name"]: {
                "users": accounts[host["name"]],
                "gpus": [gpu["index"] for gpu in host["gpus"]],
            }
            for host in overview["hosts"]
        }
    }


def build_files(
    settings: Settings,
    database: Database,
    now: int | None = None,
    live_only: bool = False,
    utc_offset: int | None = None,
) -> dict[str, Any]:
    """live_only builds just the files the page refreshes every minute: the
    overview and the 1h histories and availability. Availability bars follow
    this machine's local clock unless utc_offset is given."""
    now = int(time.time()) if now is None else now
    if utc_offset is None:
        utc_offset = time.localtime(now).tm_gmtoff
    files: dict[str, Any] = {
        "overview": public_overview(
            database.overview(settings.hosts, settings.stale_after_seconds, now=now),
            database.accounts(settings.hosts),
        )
    }
    for name, _ in LIVE_PERIODS if live_only else PERIODS:
        files[f"uptime-{name}"] = public_uptime(settings, database, name, now, utc_offset)
    if not live_only:
        for host in settings.hosts:
            files[f"gpus-{host}"] = public_gpus(database, host, now, utc_offset)
    lifetime = None if live_only else database.lifetime()
    for host in (None, *settings.hosts):
        key = host or "all"
        if not live_only:
            files[f"stats-{key}"] = {
                "generated_at": now,
                "host": host,
                # The lab's all-time GPU time, the same in every stats file.
                "lifetime": lifetime,
                "periods": database.period_summaries(PERIODS, now=now, host=host),
                "users": {
                    name: database.user_summary(now - seconds, now, host)
                    for name, seconds in PERIODS
                },
            }
        for name, seconds in LIVE_PERIODS if live_only else PERIODS:
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
