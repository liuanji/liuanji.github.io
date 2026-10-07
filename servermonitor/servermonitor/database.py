from __future__ import annotations

import json
import math
import sqlite3
import time
from collections import defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Iterable

from .collector import UNKNOWN_USER, CollectionResult, DiskResult, GPUStat, ProcessStat


BUSY_MEMORY_THRESHOLD_MB = 100
SCHEMA_VERSION = "2"

# Usage is stored only as sums per minute and per hour; raw samples and process
# details are never kept. Minute sums answer every window up to
# MINUTE_WINDOW_SECONDS long and are deleted shortly after; hour sums answer
# longer windows and are kept for the configured rollup retention.
MINUTE_WINDOW_SECONDS = 48 * 3600
MINUTE_RETENTION_SECONDS = MINUTE_WINDOW_SECONDS + 3600


@dataclass(frozen=True)
class Tier:
    seconds: int
    gpu_table: str
    user_table: str
    check_table: str


MINUTE = Tier(60, "gpu_minute", "user_minute", "check_minute")
HOUR = Tier(3600, "gpu_hour", "user_hour", "check_hour")
TIERS = (MINUTE, HOUR)

# Version 1 kept every sample; initialize() converts it to version 2.
LEGACY_TABLES = (
    "process_samples",
    "gpu_samples",
    "collection_runs",
    "gpu_hourly",
    "user_hourly",
)

SCHEMA = """
PRAGMA journal_mode=WAL;

-- Latest collection attempt per host and its last good snapshot: the only
-- place that holds per-GPU and per-process details.
CREATE TABLE IF NOT EXISTS host_state (
    host TEXT PRIMARY KEY,
    attempted_at INTEGER NOT NULL,
    success INTEGER NOT NULL,
    error TEXT,
    duration_ms INTEGER NOT NULL,
    data_sampled_at INTEGER,
    first_sampled_at INTEGER,
    snapshot TEXT
);

-- Per-GPU sums of every sample taken in the bucket (minute or hour start).
CREATE TABLE IF NOT EXISTS gpu_minute (
    bucket INTEGER NOT NULL,
    host TEXT NOT NULL,
    gpu_index INTEGER NOT NULL,
    sample_count INTEGER NOT NULL,
    busy_sample_count INTEGER NOT NULL,
    utilization_sum REAL NOT NULL,
    memory_percent_sum REAL NOT NULL,
    temperature_sum REAL NOT NULL,
    temperature_count INTEGER NOT NULL,
    power_sum REAL NOT NULL,
    power_count INTEGER NOT NULL,
    PRIMARY KEY (bucket, host, gpu_index)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS gpu_hour (
    bucket INTEGER NOT NULL,
    host TEXT NOT NULL,
    gpu_index INTEGER NOT NULL,
    sample_count INTEGER NOT NULL,
    busy_sample_count INTEGER NOT NULL,
    utilization_sum REAL NOT NULL,
    memory_percent_sum REAL NOT NULL,
    temperature_sum REAL NOT NULL,
    temperature_count INTEGER NOT NULL,
    power_sum REAL NOT NULL,
    power_count INTEGER NOT NULL,
    PRIMARY KEY (bucket, host, gpu_index)
) WITHOUT ROWID;

-- Per-user GPU time that fell inside the bucket.
CREATE TABLE IF NOT EXISTS user_minute (
    bucket INTEGER NOT NULL,
    host TEXT NOT NULL,
    username TEXT NOT NULL,
    active_gpu_seconds REAL NOT NULL,
    memory_mb_seconds REAL NOT NULL,
    weighted_gpu_seconds REAL NOT NULL,
    PRIMARY KEY (bucket, host, username)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS user_hour (
    bucket INTEGER NOT NULL,
    host TEXT NOT NULL,
    username TEXT NOT NULL,
    active_gpu_seconds REAL NOT NULL,
    memory_mb_seconds REAL NOT NULL,
    weighted_gpu_seconds REAL NOT NULL,
    PRIMARY KEY (bucket, host, username)
) WITHOUT ROWID;

-- Time each host was checked, and found unreachable, within the bucket. A
-- check covers the time since that host's previous one, so hours when the
-- monitor itself was not running have no checks rather than downtime.
CREATE TABLE IF NOT EXISTS check_minute (
    bucket INTEGER NOT NULL,
    host TEXT NOT NULL,
    checked_seconds REAL NOT NULL,
    down_seconds REAL NOT NULL,
    PRIMARY KEY (bucket, host)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS check_hour (
    bucket INTEGER NOT NULL,
    host TEXT NOT NULL,
    checked_seconds REAL NOT NULL,
    down_seconds REAL NOT NULL,
    PRIMARY KEY (bucket, host)
) WITHOUT ROWID;

-- The latest successful disk check per host; each check replaces the last.
CREATE TABLE IF NOT EXISTS disk_state (
    host TEXT NOT NULL,
    mount TEXT NOT NULL,
    total_bytes INTEGER NOT NULL,
    used_bytes INTEGER NOT NULL,
    available_bytes INTEGER NOT NULL,
    checked_at INTEGER NOT NULL,
    PRIMARY KEY (host, mount)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""

GPU_UPSERT = """
INSERT INTO {table} (
    bucket, host, gpu_index, sample_count, busy_sample_count, utilization_sum,
    memory_percent_sum, temperature_sum, temperature_count, power_sum, power_count
) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT (bucket, host, gpu_index) DO UPDATE SET
    sample_count = sample_count + 1,
    busy_sample_count = busy_sample_count + excluded.busy_sample_count,
    utilization_sum = utilization_sum + excluded.utilization_sum,
    memory_percent_sum = memory_percent_sum + excluded.memory_percent_sum,
    temperature_sum = temperature_sum + excluded.temperature_sum,
    temperature_count = temperature_count + excluded.temperature_count,
    power_sum = power_sum + excluded.power_sum,
    power_count = power_count + excluded.power_count
"""

CHECK_UPSERT = """
INSERT INTO {table} (bucket, host, checked_seconds, down_seconds) VALUES (?, ?, ?, ?)
ON CONFLICT (bucket, host) DO UPDATE SET
    checked_seconds = checked_seconds + excluded.checked_seconds,
    down_seconds = down_seconds + excluded.down_seconds
"""

USER_UPSERT = """
INSERT INTO {table} (
    bucket, host, username, active_gpu_seconds, memory_mb_seconds, weighted_gpu_seconds
) VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT (bucket, host, username) DO UPDATE SET
    active_gpu_seconds = active_gpu_seconds + excluded.active_gpu_seconds,
    memory_mb_seconds = memory_mb_seconds + excluded.memory_mb_seconds,
    weighted_gpu_seconds = weighted_gpu_seconds + excluded.weighted_gpu_seconds
"""


def _tier(span_seconds: int) -> Tier:
    return MINUTE if span_seconds <= MINUTE_WINDOW_SECONDS else HOUR


def _window(
    tier: Tier,
    start: int,
    end: int,
    host: str | None = None,
    gpu_index: int | None = None,
) -> tuple[str, str, list[Any]]:
    """WHERE clause for the buckets overlapping [start, end], and a weight that
    counts only the part of the first bucket that lies inside the window."""
    clauses = ["bucket > ?", "bucket <= ?"]
    params: list[Any] = [start - tier.seconds, end]
    if host:
        clauses.append("host = ?")
        params.append(host)
    if gpu_index is not None:
        clauses.append("gpu_index = ?")
        params.append(gpu_index)
    weight = f"MIN(1.0, (bucket + {tier.seconds} - {int(start)}) * 1.0 / {tier.seconds})"
    return " AND ".join(clauses), weight, params


def _segments(start: int, end: int, size: int) -> Iterable[tuple[int, float]]:
    cursor = start
    while cursor < end:
        bucket = cursor - (cursor % size)
        segment_end = min(end, bucket + size)
        yield bucket, float(segment_end - cursor)
        cursor = segment_end


def _is_busy(gpu: GPUStat, process_uuids: set[str]) -> bool:
    return gpu.uuid in process_uuids or gpu.memory_used_mb >= BUSY_MEMORY_THRESHOLD_MB


class Database:
    def __init__(self, path: Path | str, interval_seconds: int = 60) -> None:
        self.path = Path(path)
        self.interval_seconds = interval_seconds

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA busy_timeout=5000")
        # Truncate the write-ahead log back to 1 MB after each checkpoint.
        connection.execute("PRAGMA journal_size_limit=1048576")
        return connection

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA)
            tables = {
                row["name"]
                for row in connection.execute(
                    "SELECT name FROM sqlite_master WHERE type = 'table'"
                )
            }
            legacy = tables.intersection(LEGACY_TABLES)
            if legacy:
                self._migrate_legacy(connection, legacy)
        if legacy:
            # Give the space of the dropped sample tables back to the disk.
            connection = self.connect()
            try:
                connection.execute("VACUUM")
            finally:
                connection.close()

    def save(self, result: CollectionResult) -> None:
        self.save_many((result,))

    def save_many(self, results: Iterable[CollectionResult]) -> None:
        """Save results in order, in one transaction."""
        with self.connect() as connection:
            for result in results:
                self._save(connection, result)

    def _save(self, connection: sqlite3.Connection, result: CollectionResult) -> None:
        state = connection.execute(
            "SELECT attempted_at, data_sampled_at FROM host_state WHERE host = ?",
            (result.host,),
        ).fetchone()
        previous = state["data_sampled_at"] if state else None
        self._store_state(connection, result)
        self._add_check(connection, result, state["attempted_at"] if state else None)
        if not result.success:
            return
        self._add_gpu_sums(connection, result)
        if previous is not None:
            duration = min(
                max(result.sampled_at - int(previous), 0),
                self.interval_seconds * 2,
            )
            self._add_user_sums(connection, result, duration)

    @staticmethod
    def _store_state(connection: sqlite3.Connection, result: CollectionResult) -> None:
        if not result.success:
            connection.execute(
                """
                INSERT INTO host_state (host, attempted_at, success, error, duration_ms)
                VALUES (?, ?, 0, ?, ?)
                ON CONFLICT (host) DO UPDATE SET
                    attempted_at = excluded.attempted_at,
                    success = 0,
                    error = excluded.error,
                    duration_ms = excluded.duration_ms
                """,
                (result.host, result.sampled_at, result.error, result.duration_ms),
            )
            return
        snapshot = json.dumps(
            {
                "gpus": [asdict(gpu) for gpu in result.gpus],
                "processes": [asdict(process) for process in result.processes],
                "system": asdict(result.system) if result.system else None,
            },
            separators=(",", ":"),
        )
        connection.execute(
            """
            INSERT INTO host_state (
                host, attempted_at, success, error, duration_ms,
                data_sampled_at, first_sampled_at, snapshot
            ) VALUES (?, ?, 1, NULL, ?, ?, ?, ?)
            ON CONFLICT (host) DO UPDATE SET
                attempted_at = excluded.attempted_at,
                success = 1,
                error = NULL,
                duration_ms = excluded.duration_ms,
                data_sampled_at = excluded.data_sampled_at,
                first_sampled_at = COALESCE(host_state.first_sampled_at, excluded.first_sampled_at),
                snapshot = excluded.snapshot
            """,
            (
                result.host,
                result.sampled_at,
                result.duration_ms,
                result.sampled_at,
                result.sampled_at,
                snapshot,
            ),
        )

    def _add_check(
        self,
        connection: sqlite3.Connection,
        result: CollectionResult,
        previous_attempt: int | None,
    ) -> None:
        """Credit the time since the host's previous check as checked, and as down
        if this check failed. Gaps longer than two intervals count only in part."""
        duration = (
            self.interval_seconds
            if previous_attempt is None
            else min(max(result.sampled_at - int(previous_attempt), 0), self.interval_seconds * 2)
        )
        down = 0.0 if result.success else 1.0
        start = result.sampled_at - duration
        for tier in TIERS:
            connection.executemany(
                CHECK_UPSERT.format(table=tier.check_table),
                [
                    (bucket, result.host, seconds, seconds * down)
                    for bucket, seconds in _segments(start, result.sampled_at, tier.seconds)
                ],
            )

    def save_disks(self, result: DiskResult) -> None:
        """A failed check keeps the host's previous numbers."""
        if not result.success:
            return
        with self.connect() as connection:
            connection.execute("DELETE FROM disk_state WHERE host = ?", (result.host,))
            connection.executemany(
                """
                INSERT INTO disk_state (
                    host, mount, total_bytes, used_bytes, available_bytes, checked_at
                ) VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        result.host,
                        disk.mount,
                        disk.total_bytes,
                        disk.used_bytes,
                        disk.available_bytes,
                        result.checked_at,
                    )
                    for disk in result.disks
                ],
            )

    def disks(self, hosts: Iterable[str]) -> list[dict[str, Any]]:
        """Each host's latest disks, by mount."""
        rows: dict[str, list[sqlite3.Row]] = defaultdict(list)
        with self.connect() as connection:
            for row in connection.execute("SELECT * FROM disk_state"):
                rows[row["host"]].append(row)
        items = []
        for host in hosts:
            disks = sorted(rows[host], key=lambda row: row["mount"])
            items.append(
                {
                    "name": host,
                    "checked_at": max((row["checked_at"] for row in disks), default=None),
                    "disks": [
                        {
                            "mount": row["mount"],
                            "total_bytes": row["total_bytes"],
                            "used_bytes": row["used_bytes"],
                            "available_bytes": row["available_bytes"],
                        }
                        for row in disks
                    ],
                }
            )
        return items

    def availability(
        self, hosts: Iterable[str], start: int, bar_seconds: int, bars: int
    ) -> list[dict[str, Any]]:
        """Checked and down seconds per host in each of `bars` consecutive bars
        from start. Bars shorter than an hour need minute buckets, so they must
        lie within the minute retention; longer bars must start on an hour."""
        tier = MINUTE if bar_seconds < HOUR.seconds else HOUR
        end = start + bar_seconds * bars
        hosts = list(hosts)
        series = {host: ([0.0] * bars, [0.0] * bars) for host in hosts}
        with self.connect() as connection:
            rows = connection.execute(
                f"""
                SELECT bucket, host, checked_seconds, down_seconds FROM {tier.check_table}
                WHERE bucket >= ? AND bucket < ?
                """,
                (start, end),
            )
            for row in rows:
                if row["host"] not in series:
                    continue
                checked, down = series[row["host"]]
                index = (int(row["bucket"]) - start) // bar_seconds
                checked[index] += row["checked_seconds"]
                down[index] += row["down_seconds"]
        return [
            {
                "name": host,
                "checked": [round(value) for value in series[host][0]],
                "down": [round(value) for value in series[host][1]],
            }
            for host in hosts
        ]

    @staticmethod
    def _add_gpu_sums(connection: sqlite3.Connection, result: CollectionResult) -> None:
        process_uuids = {process.gpu_uuid for process in result.processes}
        values = [
            (
                gpu.index,
                int(_is_busy(gpu, process_uuids)),
                gpu.utilization,
                gpu.memory_used_mb / gpu.memory_total_mb * 100 if gpu.memory_total_mb else 0,
                gpu.temperature_c or 0,
                int(gpu.temperature_c is not None),
                gpu.power_w or 0,
                int(gpu.power_w is not None),
            )
            for gpu in result.gpus
        ]
        for tier in TIERS:
            bucket = result.sampled_at - (result.sampled_at % tier.seconds)
            connection.executemany(
                GPU_UPSERT.format(table=tier.gpu_table),
                [(bucket, result.host, *value) for value in values],
            )

    @staticmethod
    def _add_user_sums(
        connection: sqlite3.Connection,
        result: CollectionResult,
        duration_seconds: int,
        tiers: Iterable[Tier] = TIERS,
    ) -> None:
        """Credit the time since the host's previous sample to the users seen now."""
        if duration_seconds <= 0 or not result.processes:
            return

        gpus = {gpu.uuid: gpu for gpu in result.gpus}
        per_gpu_user: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        for process in result.processes:
            if process.username != UNKNOWN_USER:
                per_gpu_user[process.gpu_uuid][process.username] += process.used_memory_mb

        # Per second of the interval: GPUs in use, MB of memory, and
        # load-weighted GPUs, split by memory share when users share a GPU.
        rates: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0, 0.0])
        for uuid, user_memory in per_gpu_user.items():
            gpu = gpus.get(uuid)
            if gpu is None:
                continue
            total_memory = sum(user_memory.values())
            for username, memory_mb in user_memory.items():
                share = (
                    memory_mb / total_memory
                    if total_memory > 0
                    else 1.0 / len(user_memory)
                )
                rate = rates[username]
                rate[0] += 1
                rate[1] += memory_mb
                rate[2] += max(0.0, min(gpu.utilization, 100.0)) / 100 * share

        start = result.sampled_at - duration_seconds
        for tier in tiers:
            connection.executemany(
                USER_UPSERT.format(table=tier.user_table),
                [
                    (
                        bucket,
                        result.host,
                        username,
                        rate[0] * seconds,
                        rate[1] * seconds,
                        rate[2] * seconds,
                    )
                    for bucket, seconds in _segments(start, result.sampled_at, tier.seconds)
                    for username, rate in rates.items()
                ],
            )

    def period_summaries(
        self,
        periods: Iterable[tuple[str, int]],
        now: int | None = None,
        host: str | None = None,
    ) -> list[dict[str, Any]]:
        now = int(time.time()) if now is None else now
        summaries: list[dict[str, Any]] = []
        with self.connect() as connection:
            observation_bounds = self._observation_bounds(connection, host, now)
            for name, seconds in periods:
                start = now - seconds
                tier = _tier(seconds)
                where, weight, params = _window(tier, start, now, host)
                row = connection.execute(
                    f"""
                    SELECT SUM(sample_count * {weight}) AS sample_count,
                           SUM(busy_sample_count * {weight}) AS busy_sample_count,
                           SUM(utilization_sum * {weight}) AS utilization_sum,
                           SUM(memory_percent_sum * {weight}) AS memory_percent_sum,
                           SUM(power_sum * {weight}) AS power_sum,
                           SUM(power_count * {weight}) AS power_count,
                           COUNT(DISTINCT host || ':' || gpu_index) AS gpu_count
                    FROM {tier.gpu_table}
                    WHERE {where}
                    """,
                    params,
                ).fetchone()
                sample_count = float(row["sample_count"] or 0)
                busy_count = float(row["busy_sample_count"] or 0)
                gpu_count = int(row["gpu_count"] or 0)
                power_count = float(row["power_count"] or 0)
                observed_seconds = 0
                if observation_bounds is not None:
                    observed_start, observed_end = observation_bounds
                    observed_seconds = max(
                        0, min(now, observed_end) - max(start, observed_start)
                    )
                summaries.append(
                    {
                        "range": name,
                        "start": start,
                        "end": now,
                        "has_data": sample_count > 0,
                        "gpu_usage_percent": round(
                            busy_count / sample_count * 100, 1
                        )
                        if sample_count
                        else 0,
                        "compute_load": round(
                            float(row["utilization_sum"] or 0) / sample_count, 1
                        )
                        if sample_count
                        else 0,
                        "memory_percent": round(
                            float(row["memory_percent_sum"] or 0) / sample_count, 1
                        )
                        if sample_count
                        else 0,
                        "average_power_w": round(
                            float(row["power_sum"] or 0) / power_count * gpu_count, 1
                        )
                        if power_count and gpu_count
                        else 0,
                        "average_busy_gpus": round(
                            busy_count * gpu_count / sample_count, 1
                        )
                        if sample_count
                        else 0,
                        "gpu_count": gpu_count,
                        "observed_hours": round(observed_seconds / 3600, 2),
                    }
                )
        return summaries

    def _observation_bounds(
        self,
        connection: sqlite3.Connection,
        host: str | None,
        now: int,
    ) -> tuple[int, int] | None:
        """The span every selected host has been observed for."""
        host_clause = " AND host = ?" if host else ""
        rows = connection.execute(
            f"""
            SELECT first_sampled_at, data_sampled_at FROM host_state
            WHERE data_sampled_at IS NOT NULL {host_clause}
            """,
            (host,) if host else (),
        ).fetchall()
        if not rows:
            return None
        return (
            max(int(row["first_sampled_at"]) for row in rows),
            min(min(now, int(row["data_sampled_at"]) + self.interval_seconds) for row in rows),
        )

    def overview(
        self, hosts: Iterable[str], stale_after_seconds: int, now: int | None = None
    ) -> dict[str, Any]:
        now = int(time.time()) if now is None else now
        with self.connect() as connection:
            states = {
                row["host"]: row for row in connection.execute("SELECT * FROM host_state")
            }
        host_items: list[dict[str, Any]] = []
        for host in hosts:
            state = states.get(host)
            if state is None:
                host_items.append(
                    {"name": host, "status": "unseen", "error": None, "system": None, "gpus": []}
                )
                continue

            age = max(0, now - int(state["attempted_at"]))
            if not state["success"]:
                status = "error"
            elif age > stale_after_seconds:
                status = "stale"
            else:
                status = "online"

            snapshot = json.loads(state["snapshot"]) if state["snapshot"] else {}
            processes_by_gpu: dict[str, list[dict[str, Any]]] = defaultdict(list)
            for process in snapshot.get("processes", []):
                processes_by_gpu[process["gpu_uuid"]].append(
                    {
                        "pid": process["pid"],
                        "username": process["username"],
                        "process_name": process["process_name"],
                        "used_memory_mb": round(process["used_memory_mb"], 1),
                    }
                )
            gpu_items: list[dict[str, Any]] = []
            for gpu in sorted(snapshot.get("gpus", []), key=lambda item: item["index"]):
                processes = processes_by_gpu[gpu["uuid"]]
                users: dict[str, float] = defaultdict(float)
                for process in processes:
                    if process["username"] != UNKNOWN_USER:
                        users[process["username"]] += process["used_memory_mb"]
                gpu_items.append(
                    {
                        "index": gpu["index"],
                        "uuid": gpu["uuid"],
                        "name": gpu["name"],
                        "utilization": round(gpu["utilization"], 1),
                        "memory_used_mb": round(gpu["memory_used_mb"], 1),
                        "memory_total_mb": round(gpu["memory_total_mb"], 1),
                        "temperature_c": gpu["temperature_c"],
                        "power_w": gpu["power_w"],
                        "power_limit_w": gpu.get("power_limit_w"),
                        "busy": bool(processes)
                        or gpu["memory_used_mb"] >= BUSY_MEMORY_THRESHOLD_MB,
                        "users": [
                            {"username": name, "used_memory_mb": round(memory, 1)}
                            for name, memory in sorted(users.items())
                        ],
                        "processes": processes,
                    }
                )
            host_items.append(
                {
                    "name": host,
                    "status": status,
                    "sampled_at": state["attempted_at"],
                    "data_sampled_at": state["data_sampled_at"],
                    "age_seconds": age,
                    "duration_ms": state["duration_ms"],
                    "error": state["error"],
                    "system": snapshot.get("system"),
                    "gpus": gpu_items,
                }
            )

        all_gpus = [gpu for host in host_items for gpu in host["gpus"]]
        online_hosts = sum(host["status"] == "online" for host in host_items)
        busy_gpus = sum(gpu["busy"] for gpu in all_gpus)
        total_memory = sum(gpu["memory_total_mb"] for gpu in all_gpus)
        used_memory = sum(gpu["memory_used_mb"] for gpu in all_gpus)
        total_power = sum(gpu["power_w"] or 0 for gpu in all_gpus)
        return {
            "generated_at": now,
            "interval_seconds": self.interval_seconds,
            "summary": {
                "hosts_online": online_hosts,
                "hosts_total": len(host_items),
                "gpus_total": len(all_gpus),
                "gpus_busy": busy_gpus,
                "gpus_idle": len(all_gpus) - busy_gpus,
                "gpu_usage_percent": round(busy_gpus / len(all_gpus) * 100, 1)
                if all_gpus
                else 0,
                "compute_load": round(
                    sum(gpu["utilization"] for gpu in all_gpus) / len(all_gpus), 1
                )
                if all_gpus
                else 0,
                "memory_percent": round(used_memory / total_memory * 100, 1)
                if total_memory
                else 0,
                "power_w": round(total_power, 1),
            },
            "hosts": host_items,
        }

    def history(
        self,
        start: int,
        end: int,
        host: str | None = None,
        gpu_index: int | None = None,
        max_points: int = 240,
    ) -> list[dict[str, Any]]:
        span = max(end - start, 1)
        tier = _tier(span)
        step = max(tier.seconds, math.ceil(span / max_points / tier.seconds) * tier.seconds)
        where, _, params = _window(tier, start, end, host, gpu_index)
        with self.connect() as connection:
            rows = connection.execute(
                f"""
                SELECT (bucket / {step}) * {step} AS point,
                       SUM(utilization_sum) / SUM(sample_count) AS utilization,
                       SUM(memory_percent_sum) / SUM(sample_count) AS memory_percent,
                       SUM(busy_sample_count) * 1.0 / SUM(sample_count)
                           * COUNT(DISTINCT host || ':' || gpu_index) AS gpus_in_use,
                       COUNT(DISTINCT host || ':' || gpu_index) AS gpu_count,
                       SUM(temperature_sum) / NULLIF(SUM(temperature_count), 0) AS temperature_c,
                       SUM(power_sum) / NULLIF(SUM(power_count), 0) AS power_w
                FROM {tier.gpu_table}
                WHERE {where}
                GROUP BY point ORDER BY point
                """,
                params,
            ).fetchall()
        return [
            {
                "timestamp": row["point"],
                "utilization": round(row["utilization"] or 0, 2),
                "memory_percent": round(row["memory_percent"] or 0, 2),
                "gpus_in_use": round(row["gpus_in_use"] or 0, 2),
                "gpu_count": int(row["gpu_count"] or 0),
                "temperature_c": round(row["temperature_c"], 2)
                if row["temperature_c"] is not None
                else None,
                "power_w": round(row["power_w"], 2)
                if row["power_w"] is not None
                else None,
            }
            for row in rows
        ]

    def user_summary(
        self, start: int, end: int, host: str | None = None
    ) -> list[dict[str, Any]]:
        tier = _tier(end - start)
        where, weight, params = _window(tier, start, end, host)
        with self.connect() as connection:
            rows = connection.execute(
                f"""
                SELECT username, host,
                       SUM(active_gpu_seconds * {weight}) AS active_seconds,
                       SUM(memory_mb_seconds * {weight}) AS memory_mb_seconds,
                       SUM(weighted_gpu_seconds * {weight}) AS weighted_seconds
                FROM {tier.user_table}
                WHERE {where} AND username != ?
                GROUP BY username, host
                ORDER BY active_seconds DESC
                """,
                [*params, UNKNOWN_USER],
            ).fetchall()

        users: dict[str, dict[str, Any]] = {}
        for row in rows:
            item = users.setdefault(
                row["username"],
                {
                    "username": row["username"],
                    "active_seconds": 0.0,
                    "memory_mb_seconds": 0.0,
                    "weighted_seconds": 0.0,
                    "hosts": [],
                },
            )
            active = float(row["active_seconds"] or 0)
            item["active_seconds"] += active
            item["memory_mb_seconds"] += float(row["memory_mb_seconds"] or 0)
            item["weighted_seconds"] += float(row["weighted_seconds"] or 0)
            item["hosts"].append(
                {"name": row["host"], "gpu_hours": round(active / 3600, 3)}
            )

        result = [
            {
                "username": item["username"],
                "gpu_hours": round(item["active_seconds"] / 3600, 3),
                "memory_gb_hours": round(item["memory_mb_seconds"] / 1024 / 3600, 3),
                "weighted_gpu_hours": round(item["weighted_seconds"] / 3600, 3),
                "hosts": sorted(item["hosts"], key=lambda value: -value["gpu_hours"]),
            }
            for item in users.values()
        ]
        return sorted(result, key=lambda item: (-item["gpu_hours"], item["username"]))

    def cleanup(self, rollup_retention_days: int, now: int | None = None) -> None:
        now = int(time.time()) if now is None else now
        with self.connect() as connection:
            for tier, before in (
                (MINUTE, now - MINUTE_RETENTION_SECONDS),
                (HOUR, now - rollup_retention_days * 86400),
            ):
                for table in (tier.gpu_table, tier.user_table, tier.check_table):
                    connection.execute(f"DELETE FROM {table} WHERE bucket < ?", (before,))

    def _migrate_legacy(self, connection: sqlite3.Connection, legacy: set[str]) -> None:
        """Convert a version-1 database, which kept every raw sample, to sums."""
        connection.execute("BEGIN")
        raw = {"collection_runs", "gpu_samples", "process_samples"} <= legacy
        if "gpu_hourly" in legacy:
            columns = {
                row["name"] for row in connection.execute("PRAGMA table_info(gpu_hourly)")
            }
            busy = "busy_sample_count" if "busy_sample_count" in columns else "0"
            if raw:
                self._recount_legacy_busy_samples(connection, columns)
                busy = "busy_sample_count"
            connection.execute(
                f"""
                INSERT OR IGNORE INTO gpu_hour (
                    bucket, host, gpu_index, sample_count, busy_sample_count,
                    utilization_sum, memory_percent_sum, temperature_sum,
                    temperature_count, power_sum, power_count
                )
                SELECT hour, host, gpu_index, sample_count, {busy},
                       utilization_sum, memory_percent_sum, temperature_sum,
                       temperature_count, power_sum, power_count
                FROM gpu_hourly
                """
            )
        if "user_hourly" in legacy:
            connection.execute(
                """
                INSERT OR IGNORE INTO user_hour (
                    bucket, host, username, active_gpu_seconds,
                    memory_mb_seconds, weighted_gpu_seconds
                )
                SELECT hour, host, username, active_gpu_seconds,
                       memory_mb_seconds, weighted_gpu_seconds
                FROM user_hourly
                """
            )
        if raw:
            self._migrate_raw_samples(connection)
        for table in LEGACY_TABLES:
            connection.execute(f"DROP TABLE IF EXISTS {table}")
        connection.execute("DELETE FROM app_metadata WHERE key = 'busy_definition'")
        connection.execute(
            """
            INSERT INTO app_metadata (key, value) VALUES ('schema_version', ?)
            ON CONFLICT (key) DO UPDATE SET value = excluded.value
            """,
            (SCHEMA_VERSION,),
        )

    @staticmethod
    def _recount_legacy_busy_samples(
        connection: sqlite3.Connection, columns: set[str]
    ) -> None:
        """Hourly busy counts from before the 'process or >= 100 MB' definition
        are recounted from the raw samples that are still available."""
        definition = connection.execute(
            "SELECT value FROM app_metadata WHERE key = 'busy_definition'"
        ).fetchone()
        if "busy_sample_count" not in columns:
            connection.execute(
                "ALTER TABLE gpu_hourly ADD COLUMN busy_sample_count INTEGER NOT NULL DEFAULT 0"
            )
        elif definition is not None and definition["value"] == "process-or-100mb-v3":
            return
        connection.execute(
            f"""
            UPDATE gpu_hourly
            SET busy_sample_count = (
                SELECT COUNT(*) FROM gpu_samples AS gpu
                WHERE gpu.host = gpu_hourly.host
                  AND gpu.gpu_index = gpu_hourly.gpu_index
                  AND gpu.sampled_at >= gpu_hourly.hour
                  AND gpu.sampled_at < gpu_hourly.hour + 3600
                  AND (
                      gpu.memory_used_mb >= {BUSY_MEMORY_THRESHOLD_MB}
                      OR EXISTS (
                          SELECT 1 FROM process_samples AS process
                          WHERE process.run_id = gpu.run_id
                            AND process.gpu_uuid = gpu.uuid
                      )
                  )
            )
            WHERE EXISTS (
                SELECT 1 FROM gpu_samples AS gpu
                WHERE gpu.host = gpu_hourly.host
                  AND gpu.gpu_index = gpu_hourly.gpu_index
                  AND gpu.sampled_at >= gpu_hourly.hour
                  AND gpu.sampled_at < gpu_hourly.hour + 3600
            )
            """
        )

    def _migrate_raw_samples(self, connection: sqlite3.Connection) -> None:
        """Build minute sums from the last MINUTE_RETENTION_SECONDS of raw
        samples, and each host's state from its latest runs."""
        latest = connection.execute(
            "SELECT MAX(sampled_at) AS sampled_at FROM collection_runs WHERE success = 1"
        ).fetchone()["sampled_at"]
        if latest is not None:
            cutoff = int(latest) - MINUTE_RETENTION_SECONDS
            connection.execute(
                f"""
                INSERT OR IGNORE INTO gpu_minute (
                    bucket, host, gpu_index, sample_count, busy_sample_count,
                    utilization_sum, memory_percent_sum, temperature_sum,
                    temperature_count, power_sum, power_count
                )
                SELECT sampled_at - (sampled_at % 60), host, gpu_index, COUNT(*),
                       SUM(CASE WHEN memory_used_mb >= {BUSY_MEMORY_THRESHOLD_MB} OR EXISTS (
                           SELECT 1 FROM process_samples AS process
                           WHERE process.run_id = gpu.run_id
                             AND process.gpu_uuid = gpu.uuid
                       ) THEN 1 ELSE 0 END),
                       SUM(utilization),
                       SUM(CASE WHEN memory_total_mb > 0
                           THEN memory_used_mb / memory_total_mb * 100 ELSE 0 END),
                       SUM(COALESCE(temperature_c, 0)), COUNT(temperature_c),
                       SUM(COALESCE(power_w, 0)), COUNT(power_w)
                FROM gpu_samples AS gpu
                WHERE sampled_at >= ?
                GROUP BY 1, 2, 3
                """,
                (cutoff,),
            )
            # User time depends on the gap since each host's previous run, so
            # replay the runs in order.
            previous: dict[str, int] = {}
            runs = connection.execute(
                """
                SELECT id, host, sampled_at FROM collection_runs
                WHERE success = 1 AND sampled_at >= ?
                ORDER BY host, sampled_at, id
                """,
                (cutoff - self.interval_seconds * 2,),
            ).fetchall()
            for run in runs:
                host, sampled_at = run["host"], int(run["sampled_at"])
                if host in previous and sampled_at >= cutoff:
                    duration = min(max(sampled_at - previous[host], 0), self.interval_seconds * 2)
                    gpus, processes = self._legacy_run(connection, run["id"])
                    result = CollectionResult(
                        host=host,
                        sampled_at=sampled_at,
                        duration_ms=0,
                        success=True,
                        gpus=gpus,
                        processes=processes,
                    )
                    self._add_user_sums(connection, result, duration, tiers=(MINUTE,))
                previous[host] = sampled_at

        hosts = [
            row["host"]
            for row in connection.execute("SELECT DISTINCT host FROM collection_runs")
        ]
        for host in hosts:
            attempt = connection.execute(
                """
                SELECT * FROM collection_runs WHERE host = ?
                ORDER BY sampled_at DESC, id DESC LIMIT 1
                """,
                (host,),
            ).fetchone()
            success = connection.execute(
                """
                SELECT * FROM collection_runs WHERE host = ? AND success = 1
                ORDER BY sampled_at DESC, id DESC LIMIT 1
                """,
                (host,),
            ).fetchone()
            if success is not None:
                gpus, processes = self._legacy_run(connection, success["id"])
                self._store_state(
                    connection,
                    CollectionResult(
                        host=host,
                        sampled_at=int(success["sampled_at"]),
                        duration_ms=int(success["duration_ms"]),
                        success=True,
                        gpus=gpus,
                        processes=processes,
                    ),
                )
                first_sampled_at = self._legacy_first_sample(connection, host)
                connection.execute(
                    "UPDATE host_state SET first_sampled_at = ? WHERE host = ?",
                    (first_sampled_at, host),
                )
            if not attempt["success"]:
                self._store_state(
                    connection,
                    CollectionResult(
                        host=host,
                        sampled_at=int(attempt["sampled_at"]),
                        duration_ms=int(attempt["duration_ms"]),
                        success=False,
                        error=attempt["error"],
                    ),
                )

    @staticmethod
    def _legacy_run(
        connection: sqlite3.Connection, run_id: int
    ) -> tuple[tuple[GPUStat, ...], tuple[ProcessStat, ...]]:
        gpus = tuple(
            GPUStat(
                index=row["gpu_index"],
                uuid=row["uuid"],
                name=row["name"],
                utilization=row["utilization"],
                memory_used_mb=row["memory_used_mb"],
                memory_total_mb=row["memory_total_mb"],
                temperature_c=row["temperature_c"],
                power_w=row["power_w"],
            )
            for row in connection.execute(
                "SELECT * FROM gpu_samples WHERE run_id = ? ORDER BY gpu_index", (run_id,)
            )
        )
        processes = tuple(
            ProcessStat(
                gpu_uuid=row["gpu_uuid"],
                pid=row["pid"],
                username=row["username"],
                process_name=row["process_name"],
                used_memory_mb=row["used_memory_mb"],
            )
            for row in connection.execute(
                "SELECT * FROM process_samples WHERE run_id = ?", (run_id,)
            )
        )
        return gpus, processes

    @staticmethod
    def _legacy_first_sample(connection: sqlite3.Connection, host: str) -> int | None:
        """First sample of a host: the earliest raw sample if it falls in the
        first hour with hourly data, otherwise the start of that hour."""
        first_hour = connection.execute(
            "SELECT MIN(bucket) AS bucket FROM gpu_hour WHERE host = ?", (host,)
        ).fetchone()["bucket"]
        first_raw = connection.execute(
            "SELECT MIN(sampled_at) AS sampled_at FROM collection_runs WHERE host = ? AND success = 1",
            (host,),
        ).fetchone()["sampled_at"]
        if first_hour is None:
            return first_raw
        if first_raw is not None and first_raw < first_hour + 3600:
            return int(first_raw)
        return int(first_hour)
