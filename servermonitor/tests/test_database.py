import sqlite3
import tempfile
import unittest
from pathlib import Path

from dataclasses import replace

from servermonitor.collector import (
    CollectionResult,
    DiskResult,
    DiskStat,
    GPUStat,
    ProcessStat,
    SystemStat,
)
from servermonitor.database import Database


def successful_result(timestamp: int, host: str = "brezel") -> CollectionResult:
    return CollectionResult(
        host=host,
        sampled_at=timestamp,
        duration_ms=100,
        success=True,
        gpus=(
            GPUStat(0, "GPU-a", "Test GPU", 50, 2000, 10000, 60, 200),
            GPUStat(1, "GPU-b", "Test GPU", 0, 0, 10000, 30, 40),
        ),
        processes=(
            ProcessStat("GPU-a", 10, "alice", "python", 1000),
            ProcessStat("GPU-a", 11, "bob", "python", 1000),
        ),
    )


def phantom_utilization_result(
    timestamp: int, memory_used_mb: float = 3
) -> CollectionResult:
    return CollectionResult(
        host="croissant",
        sampled_at=timestamp,
        duration_ms=100,
        success=True,
        gpus=(
            GPUStat(
                0,
                "GPU-phantom",
                "Test GPU",
                100,
                memory_used_mb,
                10000,
                40,
                100,
            ),
        ),
        processes=(),
    )


class DatabaseTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.database = Database(
            Path(self.temporary_directory.name) / "monitor.sqlite3", interval_seconds=60
        )
        self.database.initialize()

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_overview_and_user_rollup(self) -> None:
        start = 1_699_999_980  # minute-aligned, so 60 s of use fills one bucket
        self.database.save(successful_result(start))
        self.database.save(successful_result(start + 60))

        overview = self.database.overview(["brezel", "toast"], 180, now=start + 60)
        self.assertEqual(overview["summary"]["hosts_online"], 1)
        self.assertEqual(overview["summary"]["gpus_total"], 2)
        self.assertEqual(overview["summary"]["gpus_busy"], 1)
        self.assertEqual(overview["summary"]["gpus_idle"], 1)
        self.assertEqual(overview["summary"]["gpu_usage_percent"], 50)
        self.assertEqual(overview["summary"]["compute_load"], 25)
        self.assertEqual(overview["summary"]["power_w"], 240)
        self.assertEqual(overview["hosts"][0]["gpus"][0]["users"][0]["username"], "alice")
        self.assertEqual(overview["hosts"][1]["status"], "unseen")

        periods = self.database.period_summaries(
            [
                ("1h", 3600),
                ("24h", 86400),
                ("7d", 7 * 86400),
                ("30d", 30 * 86400),
                ("90d", 90 * 86400),
                ("365d", 365 * 86400),
            ],
            now=start + 60,
            host="brezel",
        )
        for period in periods:
            self.assertEqual(period["gpu_usage_percent"], 50)
            self.assertEqual(period["compute_load"], 25)
            self.assertEqual(period["memory_percent"], 10)
            self.assertEqual(period["average_power_w"], 240)
            self.assertEqual(period["average_busy_gpus"], 1)
            self.assertEqual(period["observed_hours"], 0.02)

        self.database.save(successful_result(start, "toast"))
        self.database.save(successful_result(start + 60, "toast"))
        toast_period = self.database.period_summaries(
            [("1h", 3600)], now=start + 60, host="toast"
        )[0]
        self.assertEqual(toast_period["gpu_count"], 2)

        all_period = self.database.period_summaries(
            [("1h", 3600)], now=start + 60
        )[0]
        self.assertEqual(all_period["gpu_count"], 4)
        self.assertEqual(all_period["average_busy_gpus"], 2)
        self.assertEqual(all_period["average_power_w"], 480)

        users = self.database.user_summary(start, start + 3600, "brezel")
        self.assertEqual([user["username"] for user in users], ["alice", "bob"])
        self.assertEqual(users[0]["hosts"], [{"name": "brezel", "gpu_hours": 0.017}])
        self.assertAlmostEqual(users[0]["gpu_hours"], 1 / 60, places=3)
        self.assertAlmostEqual(users[0]["memory_gb_hours"], 1000 / 1024 / 60, places=3)
        self.assertAlmostEqual(users[0]["weighted_gpu_hours"], 15 / 3600, places=3)

        all_users = self.database.user_summary(start, start + 3600)
        self.assertEqual(all_users[0]["username"], "alice")
        self.assertAlmostEqual(all_users[0]["gpu_hours"], 2 / 60, places=3)
        self.assertEqual(
            [host["name"] for host in all_users[0]["hosts"]],
            ["brezel", "toast"],
        )

    def test_overview_reports_power_limit_when_known(self) -> None:
        result = successful_result(1_700_000_000)
        gpus = (replace(result.gpus[0], power_limit_w=600.0), result.gpus[1])
        self.database.save(replace(result, gpus=gpus))

        overview = self.database.overview(("brezel",), stale_after_seconds=180, now=1_700_000_030)

        limits = [gpu["power_limit_w"] for gpu in overview["hosts"][0]["gpus"]]
        self.assertEqual(limits, [600.0, None])

    def test_unknown_owner_keeps_gpu_busy_but_is_never_a_user(self) -> None:
        def result(timestamp: int) -> CollectionResult:
            return replace(
                successful_result(timestamp),
                processes=(
                    ProcessStat("GPU-a", 10, "alice", "python", 1000),
                    ProcessStat("GPU-b", 12, "unknown", "python", 500),
                ),
            )

        self.database.save(result(1_700_000_000))
        self.database.save(result(1_700_000_060))
        # Rows credited to "unknown" before it was excluded stay out of rankings.
        with self.database.connect() as connection:
            connection.execute(
                "INSERT INTO user_minute VALUES (?, 'brezel', 'unknown', 60, 500, 0)",
                (1_700_000_000,),
            )

        overview = self.database.overview(("brezel",), stale_after_seconds=180, now=1_700_000_090)
        gpu_b = overview["hosts"][0]["gpus"][1]
        self.assertTrue(gpu_b["busy"])
        self.assertEqual(gpu_b["users"], [])
        users = self.database.user_summary(1_699_999_000, 1_700_000_090)
        self.assertEqual([user["username"] for user in users], ["alice"])

    def test_disk_history_averages_each_disks_share_per_step_and_is_trimmed(self) -> None:
        def check(checked_at: int, used: int) -> DiskResult:
            return DiskResult("brezel", checked_at, True, (DiskStat("/scratch2", 1000, used, 1000 - used),))

        # Two checks in one half hour (40% and 60%), then one an hour later (80%).
        start = 1_700_000_000 - 1_700_000_000 % 1800
        for offset, used in ((60, 400), (900, 600), (3660, 800)):
            self.database.save_disks(check(start + offset, used))
        history = self.database.disk_history(now=start + 3700, utc_offset=0)["brezel"]["/scratch2"]
        day = history["24h"]
        self.assertEqual((day["step"], len(day["values"])), (1800, 48))
        self.assertEqual(day["values"][-3:], [0.5, None, 0.8])
        self.assertEqual(sorted(history), ["1h", "24h", "30d", "365d", "7d", "90d"])
        # Checks older than the retention go.
        self.database.cleanup(rollup_retention_days=1, now=start + 3 * 86400)
        self.assertEqual(self.database.disk_history(now=start + 3 * 86400, utc_offset=0), {})

    def test_disks_keep_only_the_latest_successful_check(self) -> None:
        def check(checked_at: int, used: int, success: bool = True) -> DiskResult:
            disks = (DiskStat("/scratch2", 1000, used, 1000 - used), DiskStat("/scratch1", 100, 10, 90))
            return DiskResult("brezel", checked_at, success, disks if success else (), None if success else "timed out")

        self.database.save_disks(check(1_700_000_000, 500))
        self.database.save_disks(check(1_700_001_800, 700))
        self.database.save_disks(check(1_700_003_600, 0, success=False))

        brezel, toast = self.database.disks(("brezel", "toast"))
        self.assertEqual(brezel["checked_at"], 1_700_001_800)
        self.assertEqual([disk["mount"] for disk in brezel["disks"]], ["/scratch1", "/scratch2"])
        self.assertEqual(brezel["disks"][1]["used_bytes"], 700)
        self.assertEqual(toast, {"name": "toast", "checked_at": None, "disks": []})

    def test_accounts_keep_the_latest_listing(self) -> None:
        self.database.save_disks(DiskResult("brezel", 1_700_000_000, True, (), accounts=("alice", "bob")))
        self.database.save_disks(DiskResult("brezel", 1_700_001_800, False, error="timed out"))
        self.assertEqual(self.database.accounts(("brezel", "toast")), {"brezel": ["alice", "bob"], "toast": []})

        self.database.save_disks(DiskResult("brezel", 1_700_003_600, False, error="no disks", accounts=("carol",)))
        self.assertEqual(self.database.accounts(("brezel",)), {"brezel": ["carol"]})

    def test_held_idle_counts_the_unbroken_run_of_idle_busy_minutes(self) -> None:
        def held(timestamp: int, utilization: float) -> CollectionResult:
            return CollectionResult(
                host="brezel",
                sampled_at=timestamp,
                duration_ms=100,
                success=True,
                gpus=(GPUStat(0, "GPU-a", "Test GPU", utilization, 40000, 97000, 30, 60),),
                processes=(ProcessStat("GPU-a", 10, "alice", "python", 40000, elapsed_seconds=7200),),
            )

        start = 1_700_000_040
        # Working for 3 minutes, then holding memory idle for 5.
        for minute in range(8):
            self.database.save(held(start + minute * 60, 90 if minute < 3 else 0))
        overview = self.database.overview(("brezel",), stale_after_seconds=180, now=start + 8 * 60)
        gpu = overview["hosts"][0]["gpus"][0]
        self.assertEqual(gpu["held_idle_seconds"], 300)
        self.assertEqual(gpu["users"], [{"username": "alice", "used_memory_mb": 40000, "jobs": 1, "running_seconds": 7200}])

    def test_gpu_problems_name_only_real_trouble(self) -> None:
        from servermonitor.database import gpu_problems

        self.assertEqual(gpu_problems({"clock_events": 0x4 | 0x1, "ecc_uncorrected": 0}), [])
        self.assertEqual(
            gpu_problems({"clock_events": 0x40, "ecc_uncorrected": 3, "rows_remap_pending": True}),
            ["hardware thermal slowdown", "3 uncorrected memory errors", "memory row remapping pending (needs a reset)"],
        )

    def test_lifetime_counts_each_users_gpu_time_and_survives_cleanup(self) -> None:
        start = 1_700_000_000
        for offset in (0, 60, 120):
            self.database.save(successful_result(start + offset))
        # Two users on GPU-a for two 60 s intervals: 240 GPU-seconds.
        lifetime = self.database.lifetime()
        self.assertEqual(lifetime["models"], [{"model": "Test GPU", "gpu_hours": round(240 / 3600, 1)}])
        with self.database.connect() as connection:
            seconds = connection.execute("SELECT gpu_seconds FROM lifetime_gpu_time").fetchone()[0]
        self.assertEqual(seconds, 240)
        self.database.cleanup(rollup_retention_days=1, now=start + 10 * 86400)
        with self.database.connect() as connection:
            self.assertEqual(connection.execute("SELECT gpu_seconds FROM lifetime_gpu_time").fetchone()[0], 240)

    def test_lifetime_gives_the_labs_pace_once_it_has_a_day_of_records(self) -> None:
        start = 1_700_000_000
        for offset in (0, 60, 120):
            self.database.save(successful_result(start + offset))
        # Not yet a day since the first record: too soon for a pace.
        self.assertIsNone(self.database.lifetime(now=start + 3600)["gpu_hours_per_day"])
        # Two days in: 240 GPU-seconds over two days.
        self.assertEqual(self.database.lifetime(now=start + 2 * 86400)["gpu_hours_per_day"], round(240 / 3600 / 2, 1))

    def test_lifetime_is_seeded_once_from_hourly_sums(self) -> None:
        start = 1_700_000_000
        for offset in (0, 60):
            self.database.save(successful_result(start + offset))
        with self.database.connect() as connection:
            connection.execute("DELETE FROM lifetime_gpu_time")
        self.database.initialize()
        self.database.initialize()
        with self.database.connect() as connection:
            rows = connection.execute("SELECT model, gpu_seconds FROM lifetime_gpu_time").fetchall()
        self.assertEqual([(row[0], row[1]) for row in rows], [("Test GPU", 120)])

    def test_lifetime_per_user_is_counted_and_seeded_once(self) -> None:
        start = 1_700_000_000
        for offset in (0, 60, 120):
            self.database.save(successful_result(start + offset))
        with self.database.connect() as connection:
            rows = connection.execute("SELECT username, gpu_seconds FROM lifetime_user_time ORDER BY username")
            self.assertEqual([tuple(row) for row in rows], [("alice", 120), ("bob", 120)])
            connection.execute("DELETE FROM lifetime_user_time")
        self.database.initialize()
        self.database.initialize()
        with self.database.connect() as connection:
            rows = connection.execute("SELECT username, gpu_seconds FROM lifetime_user_time ORDER BY username")
            self.assertEqual([tuple(row) for row in rows], [("alice", 120), ("bob", 120)])

    def test_baker_profiles_describe_when_and_where_each_user_bakes(self) -> None:
        # Saturday 18 November 2023, 02:00 UTC: an hour of night baking at a weekend.
        start = 1_700_272_800
        for offset in range(0, 3601, 60):
            self.database.save(successful_result(start + offset))
        profiles = self.database.baker_profiles(now=start + 3600, utc_offset=0)
        alice = profiles["alice"]
        self.assertEqual(alice["lifetime_gpu_hours"], 1.0)
        self.assertEqual(alice["since"], start)
        recent = alice["recent"]
        self.assertEqual(recent["gpu_hours"], 1.0)
        self.assertEqual(recent["night_share"], 1.0)
        self.assertEqual(recent["weekend_share"], 1.0)
        self.assertEqual(recent["peak_gpus"], 1.0)
        self.assertEqual(recent["active_days"], 1)
        self.assertEqual(recent["hosts"], [{"name": "brezel", "share": 1.0}])
        week = alice["series"]["7d"]
        self.assertEqual((week["step"], len(week["values"])), (3 * 3600, 56))
        # The last block is the one under way at 03:00, 03:00 to 06:00.
        self.assertEqual(week["start"] + 56 * 3 * 3600, start + 4 * 3600)
        self.assertAlmostEqual(sum(week["values"]) * 3 * 3600, 3600, delta=60)
        # The last hour in five-minute steps: one GPU throughout.
        hour = alice["series"]["1h"]
        self.assertEqual((hour["step"], len(hour["values"])), (300, 12))
        self.assertEqual(hour["values"][-2], 1.0)
        self.assertEqual(sorted(alice["series"]), ["1h", "24h", "30d", "365d", "7d", "90d"])
        # Someone who only baked long ago keeps a card, without recent habits.
        with self.database.connect() as connection:
            connection.execute("INSERT INTO lifetime_user_time VALUES ('carol', 7200, 1600000000)")
        carol = self.database.baker_profiles(now=start + 3600, utc_offset=0)["carol"]
        self.assertEqual((carol["lifetime_gpu_hours"], carol["recent"], carol["series"]), (2.0, None, None))

    def test_names_cut_short_by_ps_are_folded_into_the_full_name(self) -> None:
        start = 1_700_000_000
        for offset in (0, 60):
            self.database.save(successful_result(start + offset))
        with self.database.connect() as connection:
            # alice's long name, as ps used to cut it, beside rows under the full name.
            connection.execute("UPDATE user_hour SET username = 'aliceinwonderland' WHERE username = 'alice'")
            connection.execute("UPDATE user_minute SET username = 'alicein+' WHERE username = 'alice'")
            connection.execute("UPDATE lifetime_user_time SET username = 'alicein+' WHERE username = 'alice'")
            connection.execute("INSERT INTO lifetime_user_time VALUES ('aliceinwonderland', 3600, 1600000000)")
        self.database.initialize()
        with self.database.connect() as connection:
            names = {row[0] for row in connection.execute("SELECT username FROM user_minute")}
            lifetime = dict(connection.execute("SELECT username, gpu_seconds FROM lifetime_user_time").fetchall())
        self.assertEqual(names, {"aliceinwonderland", "bob"})
        self.assertEqual(lifetime, {"aliceinwonderland": 3660, "bob": 60})

    def test_observed_time_survives_collection_interval_change(self) -> None:
        start = 1_700_000_000
        for offset in (0, 60, 120, 180):
            self.database.save(successful_result(start + offset))

        database = Database(self.database.path, interval_seconds=30)
        period = database.period_summaries(
            [("3m", 180)], now=start + 180, host="brezel"
        )[0]

        self.assertEqual(period["observed_hours"], 0.05)

    def test_user_summary_clips_partial_hour(self) -> None:
        hour = 1_700_000_000 - (1_700_000_000 % 3600)
        for offset in (60, 120, 180):
            self.database.save(successful_result(hour + offset))

        users = self.database.user_summary(hour + 150, hour + 180, "brezel")

        self.assertEqual(users[0]["username"], "alice")
        self.assertEqual(users[0]["gpu_hours"], 0.008)

    def test_user_summary_keeps_a_sliver_of_weighted_time_above_zero(self) -> None:
        start = 1_700_000_000
        for offset in (0, 60):
            self.database.save(successful_result(start + offset))
        with self.database.connect() as connection:
            connection.execute("UPDATE user_minute SET weighted_gpu_seconds = 1.2 WHERE username = 'alice'")
        alice = next(user for user in self.database.user_summary(start - 60, start + 60, "brezel") if user["username"] == "alice")
        self.assertEqual(alice["weighted_gpu_hours"], 0.001)

    def test_driver_memory_without_process_is_idle(self) -> None:
        timestamp = 1_700_000_000
        self.database.save(phantom_utilization_result(timestamp))

        overview = self.database.overview(["croissant"], 180, now=timestamp)
        period = self.database.period_summaries(
            [("1h", 3600)], now=timestamp, host="croissant"
        )[0]

        self.assertFalse(overview["hosts"][0]["gpus"][0]["busy"])
        self.assertEqual(overview["summary"]["gpus_busy"], 0)
        self.assertEqual(overview["summary"]["compute_load"], 100)
        self.assertEqual(period["gpu_usage_percent"], 0)
        self.assertEqual(period["compute_load"], 100)

    def test_significant_memory_without_process_is_busy(self) -> None:
        timestamp = 1_700_000_000
        self.database.save(phantom_utilization_result(timestamp, memory_used_mb=100))

        overview = self.database.overview(["croissant"], 180, now=timestamp)

        self.assertTrue(overview["hosts"][0]["gpus"][0]["busy"])

    def test_history_and_failed_run_keep_last_good_data(self) -> None:
        start = 1_700_000_000
        self.database.save(successful_result(start))
        self.database.save(successful_result(start + 60))
        self.database.save(
            CollectionResult(
                host="brezel",
                sampled_at=start + 120,
                duration_ms=1000,
                success=False,
                error="timeout",
            )
        )

        points = self.database.history(start, start + 180)
        self.assertEqual(len(points), 2)
        self.assertEqual(points[0]["utilization"], 25)
        self.assertEqual(points[0]["gpus_in_use"], 1)
        self.assertEqual(points[0]["gpu_count"], 2)

        hourly_points = self.database.history(start - 7 * 86400, start + 180)
        self.assertEqual(hourly_points[0]["gpus_in_use"], 1)
        self.assertEqual(hourly_points[0]["gpu_count"], 2)

        overview = self.database.overview(["brezel"], 180, now=start + 120)
        self.assertEqual(overview["hosts"][0]["status"], "error")
        self.assertEqual(len(overview["hosts"][0]["gpus"]), 2)
        self.assertEqual(overview["hosts"][0]["error"], "timeout")

    def test_overview_reports_host_cpu_and_memory(self) -> None:
        timestamp = 1_700_000_000
        system = SystemStat(
            cpu_percent=42.5,
            cpu_count=64,
            memory_used_mb=1024,
            memory_total_mb=4096,
            load_averages=(5.4, 5.2, 5.1),
            cpu_model="Test CPU",
        )
        self.database.save(replace(successful_result(timestamp), system=system))
        self.database.save(successful_result(timestamp, "toast"))

        hosts = self.database.overview(["brezel", "toast", "croissant"], 180, now=timestamp)["hosts"]

        self.assertEqual(
            {key: hosts[0]["system"][key] for key in ("cpu_percent", "cpu_count", "memory_used_mb", "memory_total_mb")},
            {"cpu_percent": 42.5, "cpu_count": 64, "memory_used_mb": 1024, "memory_total_mb": 4096},
        )
        self.assertEqual(hosts[0]["system"]["load_averages"], [5.4, 5.2, 5.1])
        self.assertEqual(hosts[0]["system"]["cpu_model"], "Test CPU")
        self.assertIsNone(hosts[0]["system"]["swap_total_mb"])
        self.assertIsNone(hosts[1]["system"])
        self.assertIsNone(hosts[2]["system"])

    def test_stores_sums_not_samples(self) -> None:
        start = 1_699_999_980
        for offset in range(0, 600, 30):
            self.database.save(successful_result(start + offset))

        with self.database.connect() as connection:
            counts = {
                table: connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                for table in ("gpu_minute", "gpu_hour", "user_minute", "user_hour", "host_state")
            }
        # 20 samples of 2 GPUs: one row per GPU per minute, and per hour.
        self.assertEqual(counts["gpu_minute"], 2 * 10)
        self.assertEqual(counts["gpu_hour"], 2)
        self.assertEqual(counts["host_state"], 1)
        self.assertEqual(counts["user_minute"], 2 * 10)

    def test_cleanup_keeps_hour_sums_after_minutes_expire(self) -> None:
        start = 1_699_999_980
        self.database.save(successful_result(start))
        self.database.save(successful_result(start + 60))

        self.database.cleanup(365, now=start + 3 * 86400)

        self.assertEqual(self.database.history(start, start + 120), [])
        periods = self.database.period_summaries(
            [("7d", 7 * 86400)], now=start + 3 * 86400, host="brezel"
        )
        self.assertEqual(periods[0]["gpu_usage_percent"], 50)
        users = self.database.user_summary(start - 86400, start + 6 * 86400, "brezel")
        self.assertAlmostEqual(users[0]["gpu_hours"], 1 / 60, places=3)

        self.database.cleanup(1, now=start + 3 * 86400)
        self.assertFalse(
            self.database.period_summaries(
                [("7d", 7 * 86400)], now=start + 3 * 86400, host="brezel"
            )[0]["has_data"]
        )


LEGACY_SCHEMA = """
CREATE TABLE collection_runs (
    id INTEGER PRIMARY KEY, host TEXT NOT NULL, sampled_at INTEGER NOT NULL,
    success INTEGER NOT NULL, error TEXT, duration_ms INTEGER NOT NULL
);
CREATE TABLE gpu_samples (
    run_id INTEGER NOT NULL, host TEXT NOT NULL, sampled_at INTEGER NOT NULL,
    gpu_index INTEGER NOT NULL, uuid TEXT NOT NULL, name TEXT NOT NULL,
    utilization REAL NOT NULL, memory_used_mb REAL NOT NULL,
    memory_total_mb REAL NOT NULL, temperature_c REAL, power_w REAL,
    PRIMARY KEY (run_id, gpu_index)
);
CREATE TABLE process_samples (
    run_id INTEGER NOT NULL, host TEXT NOT NULL, sampled_at INTEGER NOT NULL,
    gpu_uuid TEXT NOT NULL, pid INTEGER NOT NULL, username TEXT NOT NULL,
    process_name TEXT NOT NULL, used_memory_mb REAL NOT NULL,
    PRIMARY KEY (run_id, gpu_uuid, pid)
);
CREATE TABLE gpu_hourly (
    hour INTEGER NOT NULL, host TEXT NOT NULL, gpu_index INTEGER NOT NULL,
    uuid TEXT NOT NULL, name TEXT NOT NULL, sample_count INTEGER NOT NULL,
    utilization_sum REAL NOT NULL, memory_used_sum REAL NOT NULL,
    memory_percent_sum REAL NOT NULL, temperature_sum REAL NOT NULL,
    temperature_count INTEGER NOT NULL, power_sum REAL NOT NULL,
    power_count INTEGER NOT NULL,
    busy_sample_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (hour, host, gpu_index)
);
CREATE TABLE user_hourly (
    hour INTEGER NOT NULL, username TEXT NOT NULL, host TEXT NOT NULL,
    active_gpu_seconds REAL NOT NULL, memory_mb_seconds REAL NOT NULL,
    weighted_gpu_seconds REAL NOT NULL, observation_count INTEGER NOT NULL,
    PRIMARY KEY (hour, username, host)
);
CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO app_metadata VALUES ('busy_definition', 'process-or-100mb-v3');
"""


class LegacyMigrationTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.path = Path(self.temporary_directory.name) / "legacy.sqlite3"
        self.start = 1_699_999_980
        hour = self.start - (self.start % 3600)
        with sqlite3.connect(self.path) as connection:
            connection.executescript(LEGACY_SCHEMA)
            for run_id, offset in ((1, 0), (2, 60)):
                sampled_at = self.start + offset
                connection.execute(
                    "INSERT INTO collection_runs VALUES (?, 'brezel', ?, 1, NULL, 100)",
                    (run_id, sampled_at),
                )
                connection.executemany(
                    "INSERT INTO gpu_samples VALUES (?, 'brezel', ?, ?, ?, 'Test GPU', ?, ?, 10000, 60, ?)",
                    [
                        (run_id, sampled_at, 0, "GPU-a", 50, 2000, 200),
                        (run_id, sampled_at, 1, "GPU-b", 0, 0, 40),
                    ],
                )
                connection.executemany(
                    "INSERT INTO process_samples VALUES (?, 'brezel', ?, 'GPU-a', ?, ?, '/home/x/python', 1000)",
                    [(run_id, sampled_at, 10, "alice"), (run_id, sampled_at, 11, "bob")],
                )
            connection.execute(
                "INSERT INTO collection_runs VALUES (3, 'brezel', ?, 0, 'timeout', 1000)",
                (self.start + 120,),
            )
            connection.executemany(
                "INSERT INTO gpu_hourly VALUES (?, 'brezel', ?, 'uuid', 'Test GPU', 2, ?, 0, ?, 120, 2, ?, 2, ?)",
                [
                    (hour - 3600, 0, 100, 40, 400, 2),
                    (hour - 3600, 1, 0, 0, 80, 0),
                ],
            )
            connection.execute(
                "INSERT INTO user_hourly VALUES (?, 'alice', 'brezel', 3600, 0, 900, 60)",
                (hour - 3600,),
            )

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_converts_samples_to_sums_and_keeps_rollups(self) -> None:
        database = Database(self.path, interval_seconds=60)
        database.initialize()

        with database.connect() as connection:
            tables = {
                row["name"]
                for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
            }
            version = connection.execute(
                "SELECT value FROM app_metadata WHERE key = 'schema_version'"
            ).fetchone()["value"]
        self.assertFalse(tables & {"collection_runs", "gpu_samples", "process_samples", "gpu_hourly", "user_hourly"})
        self.assertEqual(version, "2")

        overview = database.overview(["brezel"], 180, now=self.start + 120)
        host = overview["hosts"][0]
        self.assertEqual(host["status"], "error")
        self.assertEqual(host["error"], "timeout")
        self.assertEqual(host["data_sampled_at"], self.start + 60)
        self.assertEqual([user["username"] for user in host["gpus"][0]["users"]], ["alice", "bob"])

        points = database.history(self.start, self.start + 120)
        self.assertEqual([point["utilization"] for point in points], [25, 25])
        self.assertEqual(points[0]["gpus_in_use"], 1)

        recent = database.user_summary(self.start, self.start + 3600, "brezel")
        self.assertAlmostEqual(recent[0]["gpu_hours"], 1 / 60, places=3)

        hourly = database.user_summary(self.start - 4 * 86400, self.start, "brezel")
        self.assertEqual(hourly[0]["gpu_hours"], 1)
        period = database.period_summaries(
            [("7d", 7 * 86400)], now=self.start + 120, host="brezel"
        )[0]
        self.assertEqual(period["gpu_usage_percent"], 50)
        self.assertEqual(period["compute_load"], 25)

if __name__ == "__main__":
    unittest.main()
