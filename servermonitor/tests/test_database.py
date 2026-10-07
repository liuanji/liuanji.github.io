import sqlite3
import tempfile
import unittest
from pathlib import Path

from servermonitor.collector import CollectionResult, GPUStat, ProcessStat
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
        start = 1_700_000_000
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

    def test_migrates_existing_hourly_table(self) -> None:
        path = Path(self.temporary_directory.name) / "old.sqlite3"
        with sqlite3.connect(path) as connection:
            connection.execute(
                """
                CREATE TABLE gpu_hourly (
                    hour INTEGER NOT NULL, host TEXT NOT NULL,
                    gpu_index INTEGER NOT NULL, uuid TEXT NOT NULL,
                    name TEXT NOT NULL, sample_count INTEGER NOT NULL,
                    utilization_sum REAL NOT NULL, memory_used_sum REAL NOT NULL,
                    memory_percent_sum REAL NOT NULL, temperature_sum REAL NOT NULL,
                    temperature_count INTEGER NOT NULL, power_sum REAL NOT NULL,
                    power_count INTEGER NOT NULL,
                    PRIMARY KEY (hour, host, gpu_index)
                )
                """
            )

        database = Database(path)
        database.initialize()

        with database.connect() as connection:
            columns = {
                row["name"]
                for row in connection.execute("PRAGMA table_info(gpu_hourly)")
            }
        self.assertIn("busy_sample_count", columns)


if __name__ == "__main__":
    unittest.main()
