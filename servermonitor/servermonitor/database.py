from __future__ import annotations

import math
import sqlite3
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Iterable

from .collector import CollectionResult, GPUStat, ProcessStat


BUSY_MEMORY_THRESHOLD_MB = 100


SCHEMA = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS collection_runs (
    id INTEGER PRIMARY KEY,
    host TEXT NOT NULL,
    sampled_at INTEGER NOT NULL,
    success INTEGER NOT NULL,
    error TEXT,
    duration_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS collection_runs_host_time
    ON collection_runs(host, sampled_at DESC);

CREATE TABLE IF NOT EXISTS gpu_samples (
    run_id INTEGER NOT NULL REFERENCES collection_runs(id) ON DELETE CASCADE,
    host TEXT NOT NULL,
    sampled_at INTEGER NOT NULL,
    gpu_index INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    name TEXT NOT NULL,
    utilization REAL NOT NULL,
    memory_used_mb REAL NOT NULL,
    memory_total_mb REAL NOT NULL,
    temperature_c REAL,
    power_w REAL,
    PRIMARY KEY (run_id, gpu_index)
);
CREATE INDEX IF NOT EXISTS gpu_samples_time
    ON gpu_samples(sampled_at, host, gpu_index);

CREATE TABLE IF NOT EXISTS process_samples (
    run_id INTEGER NOT NULL REFERENCES collection_runs(id) ON DELETE CASCADE,
    host TEXT NOT NULL,
    sampled_at INTEGER NOT NULL,
    gpu_uuid TEXT NOT NULL,
    pid INTEGER NOT NULL,
    username TEXT NOT NULL,
    process_name TEXT NOT NULL,
    used_memory_mb REAL NOT NULL,
    PRIMARY KEY (run_id, gpu_uuid, pid)
);
CREATE INDEX IF NOT EXISTS process_samples_time_user
    ON process_samples(sampled_at, username);

CREATE TABLE IF NOT EXISTS gpu_hourly (
    hour INTEGER NOT NULL,
    host TEXT NOT NULL,
    gpu_index INTEGER NOT NULL,
    uuid TEXT NOT NULL,
    name TEXT NOT NULL,
    sample_count INTEGER NOT NULL,
    busy_sample_count INTEGER NOT NULL,
    utilization_sum REAL NOT NULL,
    memory_used_sum REAL NOT NULL,
    memory_percent_sum REAL NOT NULL,
    temperature_sum REAL NOT NULL,
    temperature_count INTEGER NOT NULL,
    power_sum REAL NOT NULL,
    power_count INTEGER NOT NULL,
    PRIMARY KEY (hour, host, gpu_index)
);

CREATE TABLE IF NOT EXISTS user_hourly (
    hour INTEGER NOT NULL,
    username TEXT NOT NULL,
    host TEXT NOT NULL,
    active_gpu_seconds REAL NOT NULL,
    memory_mb_seconds REAL NOT NULL,
    weighted_gpu_seconds REAL NOT NULL,
    observation_count INTEGER NOT NULL,
    PRIMARY KEY (hour, username, host)
);

CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""


class Database:
    def __init__(self, path: Path | str, interval_seconds: int = 60) -> None:
        self.path = Path(path)
        self.interval_seconds = interval_seconds

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA busy_timeout=5000")
        return connection

    def initialize(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript(SCHEMA)
            columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(gpu_hourly)")
            }
            if "busy_sample_count" not in columns:
                connection.execute(
                    """
                    ALTER TABLE gpu_hourly
                    ADD COLUMN busy_sample_count INTEGER NOT NULL DEFAULT 0
                    """
                )
            busy_definition = connection.execute(
                "SELECT value FROM app_metadata WHERE key = 'busy_definition'"
            ).fetchone()
            if (
                busy_definition is None
                or busy_definition["value"] != "process-or-100mb-v3"
            ):
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
                connection.execute(
                    """
                    INSERT INTO app_metadata(key, value)
                    VALUES ('busy_definition', 'process-or-100mb-v3')
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value
                    """
                )

    def save(self, result: CollectionResult) -> int:
        with self.connect() as connection:
            previous = connection.execute(
                """
                SELECT sampled_at FROM collection_runs
                WHERE host = ? AND success = 1 AND sampled_at < ?
                ORDER BY sampled_at DESC LIMIT 1
                """,
                (result.host, result.sampled_at),
            ).fetchone()
            cursor = connection.execute(
                """
                INSERT INTO collection_runs(host, sampled_at, success, error, duration_ms)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    result.host,
                    result.sampled_at,
                    int(result.success),
                    result.error,
                    result.duration_ms,
                ),
            )
            run_id = int(cursor.lastrowid)
            if not result.success:
                return run_id

            connection.executemany(
                """
                INSERT INTO gpu_samples(
                    run_id, host, sampled_at, gpu_index, uuid, name, utilization,
                    memory_used_mb, memory_total_mb, temperature_c, power_w
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    (
                        run_id,
                        result.host,
                        result.sampled_at,
                        gpu.index,
                        gpu.uuid,
                        gpu.name,
                        gpu.utilization,
                        gpu.memory_used_mb,
                        gpu.memory_total_mb,
                        gpu.temperature_c,
                        gpu.power_w,
                    )
                    for gpu in result.gpus
                ),
            )
            connection.executemany(
                """
                INSERT INTO process_samples(
                    run_id, host, sampled_at, gpu_uuid, pid, username,
                    process_name, used_memory_mb
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    (
                        run_id,
                        result.host,
                        result.sampled_at,
                        process.gpu_uuid,
                        process.pid,
                        process.username,
                        process.process_name,
                        process.used_memory_mb,
                    )
                    for process in result.processes
                ),
            )
            self._update_gpu_rollups(connection, result)
            if previous is not None:
                duration = min(
                    max(result.sampled_at - int(previous["sampled_at"]), 0),
                    self.interval_seconds * 2,
                )
                self._update_user_rollups(connection, result, duration)
            return run_id

    @staticmethod
    def _update_gpu_rollups(
        connection: sqlite3.Connection, result: CollectionResult
    ) -> None:
        hour = result.sampled_at - (result.sampled_at % 3600)
        process_uuids = {process.gpu_uuid for process in result.processes}
        for gpu in result.gpus:
            memory_percent = (
                gpu.memory_used_mb / gpu.memory_total_mb * 100
                if gpu.memory_total_mb
                else 0
            )
            connection.execute(
                """
                INSERT INTO gpu_hourly(
                    hour, host, gpu_index, uuid, name, sample_count,
                    busy_sample_count, utilization_sum, memory_used_sum,
                    memory_percent_sum,
                    temperature_sum, temperature_count, power_sum, power_count
                ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(hour, host, gpu_index) DO UPDATE SET
                    uuid = excluded.uuid,
                    name = excluded.name,
                    sample_count = sample_count + 1,
                    busy_sample_count = busy_sample_count + excluded.busy_sample_count,
                    utilization_sum = utilization_sum + excluded.utilization_sum,
                    memory_used_sum = memory_used_sum + excluded.memory_used_sum,
                    memory_percent_sum = memory_percent_sum + excluded.memory_percent_sum,
                    temperature_sum = temperature_sum + excluded.temperature_sum,
                    temperature_count = temperature_count + excluded.temperature_count,
                    power_sum = power_sum + excluded.power_sum,
                    power_count = power_count + excluded.power_count
                """,
                (
                    hour,
                    result.host,
                    gpu.index,
                    gpu.uuid,
                    gpu.name,
                    int(
                        gpu.uuid in process_uuids
                        or gpu.memory_used_mb >= BUSY_MEMORY_THRESHOLD_MB
                    ),
                    gpu.utilization,
                    gpu.memory_used_mb,
                    memory_percent,
                    gpu.temperature_c or 0,
                    int(gpu.temperature_c is not None),
                    gpu.power_w or 0,
                    int(gpu.power_w is not None),
                ),
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
                if seconds <= 7 * 86400:
                    host_clause = " AND gpu.host = ?" if host else ""
                    params: list[Any] = [start, now]
                    if host:
                        params.append(host)
                    row = connection.execute(
                        f"""
                        SELECT COUNT(*) AS sample_count,
                               SUM(
                                   CASE WHEN gpu.memory_used_mb >= {BUSY_MEMORY_THRESHOLD_MB} OR EXISTS (
                                       SELECT 1 FROM process_samples AS process
                                       WHERE process.run_id = gpu.run_id
                                         AND process.gpu_uuid = gpu.uuid
                                   ) THEN 1 ELSE 0 END
                               ) AS busy_sample_count,
                               SUM(gpu.utilization) AS utilization_sum,
                               SUM(
                                   CASE WHEN gpu.memory_total_mb > 0
                                   THEN gpu.memory_used_mb / gpu.memory_total_mb * 100
                                   ELSE 0 END
                               ) AS memory_percent_sum,
                               SUM(CASE WHEN gpu.power_w IS NOT NULL THEN gpu.power_w ELSE 0 END) AS power_sum,
                               SUM(CASE WHEN gpu.power_w IS NOT NULL THEN 1 ELSE 0 END) AS power_count,
                               COUNT(DISTINCT host || ':' || gpu_index) AS gpu_count
                        FROM gpu_samples AS gpu
                        WHERE sampled_at >= ? AND sampled_at <= ?
                        {host_clause}
                        """,
                        params,
                    ).fetchone()
                else:
                    host_clause = " AND host = ?" if host else ""
                    params = [start - (start % 3600), now]
                    if host:
                        params.append(host)
                    row = connection.execute(
                        f"""
                        SELECT SUM(sample_count) AS sample_count,
                               SUM(busy_sample_count) AS busy_sample_count,
                               SUM(utilization_sum) AS utilization_sum,
                               SUM(memory_percent_sum) AS memory_percent_sum,
                               SUM(power_sum) AS power_sum,
                               SUM(power_count) AS power_count,
                               COUNT(DISTINCT host || ':' || gpu_index) AS gpu_count
                        FROM gpu_hourly
                        WHERE hour >= ? AND hour <= ?
                        {host_clause}
                        """,
                        params,
                    ).fetchone()
                sample_count = int(row["sample_count"] or 0)
                busy_count = int(row["busy_sample_count"] or 0)
                gpu_count = int(row["gpu_count"] or 0)
                power_count = int(row["power_count"] or 0)
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
        host_clause = " WHERE host = ?" if host else ""
        params = (host,) if host else ()
        rows = connection.execute(
            f"""
            SELECT host, MIN(hour) AS first_hour, MAX(hour) AS last_hour
            FROM gpu_hourly
            {host_clause}
            GROUP BY host
            """,
            params,
        ).fetchall()
        if not rows:
            return None

        starts: list[int] = []
        ends: list[int] = []
        for row in rows:
            first_hour = int(row["first_hour"])
            last_hour = int(row["last_hour"])
            first_sample = connection.execute(
                """
                SELECT MIN(sampled_at) AS sampled_at
                FROM gpu_samples
                WHERE host = ? AND sampled_at >= ? AND sampled_at < ?
                """,
                (row["host"], first_hour, first_hour + 3600),
            ).fetchone()["sampled_at"]
            last_sample = connection.execute(
                """
                SELECT MAX(sampled_at) AS sampled_at
                FROM gpu_samples
                WHERE host = ? AND sampled_at >= ? AND sampled_at < ?
                """,
                (row["host"], last_hour, last_hour + 3600),
            ).fetchone()["sampled_at"]
            starts.append(int(first_sample) if first_sample is not None else first_hour)
            ends.append(
                min(
                    now,
                    int(last_sample) + self.interval_seconds
                    if last_sample is not None
                    else last_hour + 3600,
                )
            )

        return max(starts), min(ends)

    @staticmethod
    def _hour_segments(start: int, end: int) -> Iterable[tuple[int, float]]:
        cursor = start
        while cursor < end:
            hour = cursor - (cursor % 3600)
            segment_end = min(end, hour + 3600)
            yield hour, float(segment_end - cursor)
            cursor = segment_end

    @classmethod
    def _update_user_rollups(
        cls,
        connection: sqlite3.Connection,
        result: CollectionResult,
        duration_seconds: int,
    ) -> None:
        if duration_seconds <= 0 or not result.processes:
            return

        gpus = {gpu.uuid: gpu for gpu in result.gpus}
        per_gpu_user: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        for process in result.processes:
            per_gpu_user[process.gpu_uuid][process.username] += process.used_memory_mb

        start = result.sampled_at - duration_seconds
        for hour, seconds in cls._hour_segments(start, result.sampled_at):
            totals: dict[str, list[float]] = defaultdict(lambda: [0.0, 0.0, 0.0, 0.0])
            for uuid, user_memory in per_gpu_user.items():
                gpu = gpus.get(uuid)
                if gpu is None:
                    continue
                total_memory = sum(user_memory.values())
                user_count = len(user_memory)
                for username, memory_mb in user_memory.items():
                    share = (
                        memory_mb / total_memory
                        if total_memory > 0
                        else 1.0 / max(user_count, 1)
                    )
                    totals[username][0] += seconds
                    totals[username][1] += memory_mb * seconds
                    totals[username][2] += (
                        seconds * max(0.0, min(gpu.utilization, 100.0)) / 100 * share
                    )
                    totals[username][3] += 1

            for username, values in totals.items():
                connection.execute(
                    """
                    INSERT INTO user_hourly(
                        hour, username, host, active_gpu_seconds,
                        memory_mb_seconds, weighted_gpu_seconds, observation_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(hour, username, host) DO UPDATE SET
                        active_gpu_seconds = active_gpu_seconds + excluded.active_gpu_seconds,
                        memory_mb_seconds = memory_mb_seconds + excluded.memory_mb_seconds,
                        weighted_gpu_seconds = weighted_gpu_seconds + excluded.weighted_gpu_seconds,
                        observation_count = observation_count + excluded.observation_count
                    """,
                    (hour, username, result.host, *values),
                )

    def overview(
        self, hosts: Iterable[str], stale_after_seconds: int, now: int | None = None
    ) -> dict[str, Any]:
        now = int(time.time()) if now is None else now
        host_items: list[dict[str, Any]] = []
        with self.connect() as connection:
            for host in hosts:
                latest = connection.execute(
                    """
                    SELECT * FROM collection_runs
                    WHERE host = ? ORDER BY sampled_at DESC, id DESC LIMIT 1
                    """,
                    (host,),
                ).fetchone()
                success = connection.execute(
                    """
                    SELECT * FROM collection_runs
                    WHERE host = ? AND success = 1
                    ORDER BY sampled_at DESC, id DESC LIMIT 1
                    """,
                    (host,),
                ).fetchone()
                if latest is None:
                    host_items.append(
                        {"name": host, "status": "unseen", "error": None, "gpus": []}
                    )
                    continue

                age = max(0, now - int(latest["sampled_at"]))
                if not latest["success"]:
                    status = "error"
                elif age > stale_after_seconds:
                    status = "stale"
                else:
                    status = "online"

                gpu_items: list[dict[str, Any]] = []
                if success is not None:
                    process_rows = connection.execute(
                        "SELECT * FROM process_samples WHERE run_id = ?",
                        (success["id"],),
                    ).fetchall()
                    processes_by_gpu: dict[str, list[dict[str, Any]]] = defaultdict(list)
                    for row in process_rows:
                        processes_by_gpu[row["gpu_uuid"]].append(
                            {
                                "pid": row["pid"],
                                "username": row["username"],
                                "process_name": row["process_name"],
                                "used_memory_mb": round(row["used_memory_mb"], 1),
                            }
                        )
                    rows = connection.execute(
                        "SELECT * FROM gpu_samples WHERE run_id = ? ORDER BY gpu_index",
                        (success["id"],),
                    ).fetchall()
                    for row in rows:
                        processes = processes_by_gpu[row["uuid"]]
                        users: dict[str, float] = defaultdict(float)
                        for process in processes:
                            users[process["username"]] += process["used_memory_mb"]
                        gpu_items.append(
                            {
                                "index": row["gpu_index"],
                                "uuid": row["uuid"],
                                "name": row["name"],
                                "utilization": round(row["utilization"], 1),
                                "memory_used_mb": round(row["memory_used_mb"], 1),
                                "memory_total_mb": round(row["memory_total_mb"], 1),
                                "temperature_c": row["temperature_c"],
                                "power_w": row["power_w"],
                                "busy": bool(processes)
                                or row["memory_used_mb"] >= BUSY_MEMORY_THRESHOLD_MB,
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
                        "sampled_at": latest["sampled_at"],
                        "data_sampled_at": success["sampled_at"] if success else None,
                        "age_seconds": age,
                        "duration_ms": latest["duration_ms"],
                        "error": latest["error"],
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
        with self.connect() as connection:
            if span > 48 * 3600:
                bucket = max(3600, math.ceil(span / max_points / 3600) * 3600)
                clauses = ["hour >= ?", "hour <= ?"]
                params: list[Any] = [start - (start % 3600), end]
                if host:
                    clauses.append("host = ?")
                    params.append(host)
                if gpu_index is not None:
                    clauses.append("gpu_index = ?")
                    params.append(gpu_index)
                rows = connection.execute(
                    f"""
                    SELECT (hour / ?) * ? AS bucket,
                           SUM(utilization_sum) / SUM(sample_count) AS utilization,
                           SUM(memory_percent_sum) / SUM(sample_count) AS memory_percent,
                           SUM(busy_sample_count) * 1.0 / SUM(sample_count)
                               * COUNT(DISTINCT host || ':' || gpu_index) AS gpus_in_use,
                           COUNT(DISTINCT host || ':' || gpu_index) AS gpu_count,
                           SUM(temperature_sum) / NULLIF(SUM(temperature_count), 0) AS temperature_c,
                           SUM(power_sum) / NULLIF(SUM(power_count), 0) AS power_w
                    FROM gpu_hourly
                    WHERE {' AND '.join(clauses)}
                    GROUP BY bucket ORDER BY bucket
                    """,
                    [bucket, bucket, *params],
                ).fetchall()
            else:
                bucket = max(self.interval_seconds, math.ceil(span / max_points))
                clauses = ["sampled_at >= ?", "sampled_at <= ?"]
                params = [start, end]
                if host:
                    clauses.append("host = ?")
                    params.append(host)
                if gpu_index is not None:
                    clauses.append("gpu_index = ?")
                    params.append(gpu_index)
                rows = connection.execute(
                    f"""
                    SELECT (sampled_at / ?) * ? AS bucket,
                           AVG(utilization) AS utilization,
                           AVG(CASE WHEN memory_total_mb > 0
                               THEN memory_used_mb / memory_total_mb * 100 ELSE 0 END) AS memory_percent,
                           SUM(CASE WHEN memory_used_mb >= {BUSY_MEMORY_THRESHOLD_MB} OR EXISTS (
                               SELECT 1 FROM process_samples AS process
                               WHERE process.run_id = gpu_samples.run_id
                                 AND process.gpu_uuid = gpu_samples.uuid
                           ) THEN 1 ELSE 0 END) * 1.0 / COUNT(*)
                               * COUNT(DISTINCT host || ':' || gpu_index) AS gpus_in_use,
                           COUNT(DISTINCT host || ':' || gpu_index) AS gpu_count,
                           AVG(temperature_c) AS temperature_c,
                           AVG(power_w) AS power_w
                    FROM gpu_samples
                    WHERE {' AND '.join(clauses)}
                    GROUP BY bucket ORDER BY bucket
                    """,
                    [bucket, bucket, *params],
                ).fetchall()
        return [
            {
                "timestamp": row["bucket"],
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
        with self.connect() as connection:
            if end - start <= 7 * 86400:
                rows = self._raw_user_summary(connection, start, end, host)
            else:
                start_hour = start - (start % 3600)
                end_hour = end - (end % 3600)
                host_clause = " AND host = ?" if host else ""
                params: list[Any] = [start_hour, end_hour]
                if host:
                    params.append(host)
                rows = connection.execute(
                    f"""
                    SELECT username, host,
                           SUM(active_gpu_seconds) AS active_seconds,
                           SUM(memory_mb_seconds) AS memory_mb_seconds,
                           SUM(weighted_gpu_seconds) AS weighted_seconds
                    FROM user_hourly
                    WHERE hour >= ? AND hour <= ?
                    {host_clause}
                    GROUP BY username, host
                    ORDER BY active_seconds DESC
                    """,
                    params,
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
            memory = float(row["memory_mb_seconds"] or 0)
            weighted = float(row["weighted_seconds"] or 0)
            item["active_seconds"] += active
            item["memory_mb_seconds"] += memory
            item["weighted_seconds"] += weighted
            item["hosts"].append(
                {"name": row["host"], "gpu_hours": round(active / 3600, 3)}
            )

        result = []
        for item in users.values():
            result.append(
                {
                    "username": item["username"],
                    "gpu_hours": round(item["active_seconds"] / 3600, 3),
                    "memory_gb_hours": round(item["memory_mb_seconds"] / 1024 / 3600, 3),
                    "weighted_gpu_hours": round(item["weighted_seconds"] / 3600, 3),
                    "hosts": sorted(item["hosts"], key=lambda value: -value["gpu_hours"]),
                }
            )
        return sorted(result, key=lambda item: (-item["gpu_hours"], item["username"]))

    def _raw_user_summary(
        self,
        connection: sqlite3.Connection,
        start: int,
        end: int,
        host: str | None,
    ) -> list[sqlite3.Row]:
        max_gap = max(120, self.interval_seconds * 2)
        host_clause = " AND host = ?" if host else ""
        params: list[Any] = [start - max_gap, end]
        if host:
            params.append(host)
        params.extend((start, max_gap, max_gap, start))
        return connection.execute(
            f"""
            WITH ordered_runs AS (
                SELECT id, host, sampled_at,
                       LAG(sampled_at) OVER (
                           PARTITION BY host ORDER BY sampled_at, id
                       ) AS previous_sampled_at
                FROM collection_runs
                WHERE success = 1
                  AND sampled_at >= ? AND sampled_at <= ?
                  {host_clause}
            ),
            durations AS (
                SELECT id, host,
                       sampled_at - MAX(
                           ?, sampled_at - ?,
                           COALESCE(previous_sampled_at, sampled_at - ?)
                       ) AS duration_seconds
                FROM ordered_runs
                WHERE sampled_at >= ?
            ),
            per_user_gpu AS (
                SELECT duration.id AS run_id, duration.host,
                       duration.duration_seconds, process.gpu_uuid,
                       process.username,
                       SUM(process.used_memory_mb) AS user_memory_mb
                FROM durations AS duration
                JOIN process_samples AS process ON process.run_id = duration.id
                WHERE duration.duration_seconds > 0
                GROUP BY duration.id, duration.host,
                         process.gpu_uuid, process.username
            ),
            per_gpu AS (
                SELECT run_id, gpu_uuid,
                       SUM(user_memory_mb) AS total_memory_mb,
                       COUNT(*) AS user_count
                FROM per_user_gpu
                GROUP BY run_id, gpu_uuid
            )
            SELECT user.username, user.host,
                   SUM(user.duration_seconds) AS active_seconds,
                   SUM(
                       user.user_memory_mb * user.duration_seconds
                   ) AS memory_mb_seconds,
                   SUM(
                       user.duration_seconds
                       * MIN(100, MAX(0, gpu.utilization)) / 100.0
                       * CASE
                           WHEN total.total_memory_mb > 0
                           THEN user.user_memory_mb / total.total_memory_mb
                           ELSE 1.0 / total.user_count
                         END
                   ) AS weighted_seconds
            FROM per_user_gpu AS user
            JOIN per_gpu AS total
              ON total.run_id = user.run_id
             AND total.gpu_uuid = user.gpu_uuid
            JOIN gpu_samples AS gpu
              ON gpu.run_id = user.run_id
             AND gpu.uuid = user.gpu_uuid
            GROUP BY user.username, user.host
            ORDER BY active_seconds DESC
            """,
            params,
        ).fetchall()

    def cleanup(self, raw_retention_days: int, rollup_retention_days: int) -> None:
        now = int(time.time())
        raw_before = now - raw_retention_days * 86400
        rollup_before = now - rollup_retention_days * 86400
        with self.connect() as connection:
            connection.execute(
                "DELETE FROM collection_runs WHERE sampled_at < ?", (raw_before,)
            )
            connection.execute("DELETE FROM gpu_hourly WHERE hour < ?", (rollup_before,))
            connection.execute("DELETE FROM user_hourly WHERE hour < ?", (rollup_before,))
