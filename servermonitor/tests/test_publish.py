import json
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

from servermonitor.collector import CollectionResult, DiskResult, DiskStat, SystemStat
from servermonitor.config import Settings
from servermonitor.database import Database
from servermonitor.publish import build_files, public_disks, uptime_window, write_files
from tests.test_database import successful_result


class PublishTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.directory = Path(self.temporary_directory.name)
        self.settings = Settings(
            host=None,
            remote_hosts=("brezel", "toast"),
            database_path=self.directory / "monitor.sqlite3",
        )
        self.database = Database(self.settings.database_path, interval_seconds=60)
        self.database.initialize()
        self.start = 1_699_999_980
        system = SystemStat(cpu_percent=12.5, cpu_count=64, memory_used_mb=2048, memory_total_mb=8192)
        for offset in (0, 60):
            self.database.save(replace(successful_result(self.start + offset), system=system))

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_publishes_every_host_and_range(self) -> None:
        files = build_files(self.settings, self.database, now=self.start + 60)

        ranges = ("1h", "24h", "7d", "30d", "90d", "365d")
        expected = {"overview"} | {
            f"{kind}-{host}{suffix}"
            for host in ("all", "brezel", "toast")
            for kind, suffix in [("stats", "")] + [("history", f"-{name}") for name in ranges]
        } | {f"uptime-{name}" for name in ranges} | {"gpus-brezel", "gpus-toast"}
        self.assertEqual(set(files), expected)

    def test_live_only_publishes_overview_and_hour_histories(self) -> None:
        files = build_files(self.settings, self.database, now=self.start + 60, live_only=True)

        self.assertEqual(
            set(files),
            {"overview", "history-all-1h", "history-brezel-1h", "history-toast-1h", "uptime-1h"},
        )

    def test_uptime_bars_end_at_local_boundaries(self) -> None:
        singapore = 8 * 3600
        now = 1_700_000_000  # 2023-11-15 06:13:20 in Singapore
        local_midnight = now - (now + singapore) % 86400

        self.assertEqual(uptime_window(now, 86400, 30, singapore), local_midnight + 86400 - 30 * 86400)
        self.assertEqual(uptime_window(now, 7 * 86400, 52, singapore), local_midnight + 86400 - 52 * 7 * 86400)
        self.assertEqual(uptime_window(now, 60, 60, singapore), now - now % 60 + 60 - 3600)

    def test_uptime_counts_failed_checks_as_down(self) -> None:
        failure = CollectionResult(
            host="brezel", sampled_at=self.start + 120, duration_ms=12000, success=False, error="timed out"
        )
        self.database.save(failure)

        uptime = build_files(self.settings, self.database, now=self.start + 120, utc_offset=0)["uptime-1h"]

        self.assertEqual((uptime["bar_seconds"], len(uptime["hosts"][0]["checked"])), (60, 60))
        self.assertEqual(uptime["utc_offset"], 0)
        brezel, toast = uptime["hosts"]
        self.assertEqual(brezel["name"], "brezel")
        # The first check counts one interval, each later one the time since the last.
        self.assertEqual(sum(brezel["checked"]), 180)
        self.assertEqual(sum(brezel["down"]), 60)
        self.assertEqual((sum(toast["checked"]), sum(toast["down"])), (0, 0))

    def test_overview_drops_process_details_but_keeps_users_and_system(self) -> None:
        overview = build_files(self.settings, self.database, now=self.start + 60)["overview"]

        host = overview["hosts"][0]
        gpu = host["gpus"][0]
        self.assertNotIn("processes", gpu)
        self.assertNotIn("uuid", gpu)
        self.assertEqual([user["username"] for user in gpu["users"]], ["alice", "bob"])
        self.assertEqual(host["system"]["cpu_percent"], 12.5)

    def test_history_points_carry_only_chart_fields(self) -> None:
        points = build_files(self.settings, self.database, now=self.start + 60)["history-all-1h"]["points"]

        # Power is the total: the two GPUs draw 200 W and 40 W.
        self.assertEqual(
            points[0],
            {
                "timestamp": self.start,
                "utilization": 25.0,
                "memory_percent": 10.0,
                "gpus_in_use": 1.0,
                "gpu_count": 2,
                "power_w": 240,
            },
        )

    def test_disks_list_users_by_owner_without_system_folders(self) -> None:
        usage = {
            "checked_at": 1_700_000_000,
            "mounts": {
                "/scratch1": [
                    {"owner": "alice", "bytes": 300},
                    {"owner": "bob", "bytes": 500},
                    {"owner": "alice", "bytes": 400},
                    {"owner": "root", "bytes": 16},
                    {"owner": "1234", "bytes": 50},
                ]
            },
        }
        disks = (DiskStat("/scratch1", 2000, 1300, 700), DiskStat("/scratch2", 2000, 10, 1990))
        self.database.save_disks(DiskResult("brezel", 1_700_000_100, True, disks, accounts=("alice", "bob"), usage=usage))

        brezel, toast = public_disks(self.settings, self.database)["hosts"]
        self.assertEqual(brezel["usage_checked_at"], 1_700_000_000)
        scratch1, scratch2 = brezel["disks"]
        self.assertEqual(scratch1["users"], [{"user": "alice", "bytes": 700}, {"user": "bob", "bytes": 500}])
        self.assertIsNone(scratch2["users"])
        self.assertIsNone(toast["usage_checked_at"])

    def test_gpu_timeline_and_week_pattern(self) -> None:
        gpus = build_files(self.settings, self.database, now=self.start + 120)["gpus-brezel"]

        self.assertEqual(gpus["bucket_seconds"], 900)
        self.assertEqual(gpus["end"] - gpus["start"], 86400)
        first = gpus["gpus"][0]
        self.assertEqual(len(first["utilization"]), 96)
        filled = [value for value in first["utilization"] if value is not None]
        self.assertEqual(filled, [50])
        self.assertEqual([value for value in first["busy_share"] if value is not None], [1])
        self.assertEqual([value for value in first["temperature_c"] if value is not None], [60])
        self.assertEqual([value for value in first["power_w"] if value is not None], [200])
        self.assertEqual([value for value in gpus["system"]["cpu_percent"] if value is not None], [12.5])
        self.assertEqual([value for value in gpus["system"]["memory_percent"] if value is not None], [25])
        self.assertEqual(len(gpus["week"]), 7)
        self.assertEqual(sum(value is not None for day in gpus["week"] for value in day), 1)

    def test_overview_keeps_only_account_holders_cpu_and_memory(self) -> None:
        people = ({"user": "alice", "cpu_percent": 120.0, "memory_mb": 2048.0}, {"user": "root", "cpu_percent": 1.0, "memory_mb": 300.0})
        system = SystemStat(cpu_percent=12.5, cpu_count=64, memory_used_mb=2048, memory_total_mb=8192, users=people)
        self.database.save(replace(successful_result(self.start + 120), system=system))
        self.database.save_disks(DiskResult("brezel", self.start, True, (), accounts=("alice",)))

        brezel = build_files(self.settings, self.database, now=self.start + 120, live_only=True)["overview"]["hosts"][0]
        self.assertEqual([user["user"] for user in brezel["system"]["users"]], ["alice"])
        self.assertEqual(brezel["gpus"][0]["users"][0]["jobs"], 1)
        self.assertEqual(brezel["gpus"][0]["problems"], [])

    def test_writes_json_files(self) -> None:
        output = self.directory / "files"
        write_files(build_files(self.settings, self.database, now=self.start + 60), output)

        overview = json.loads((output / "overview.json").read_text())
        self.assertEqual(overview["summary"]["gpus_total"], 2)
        self.assertEqual(list(output.glob(".*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
