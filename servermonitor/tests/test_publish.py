import json
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

from servermonitor.collector import SystemStat
from servermonitor.config import Settings
from servermonitor.database import Database
from servermonitor.publish import build_files, write_files
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
        }
        self.assertEqual(set(files), expected)

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

        self.assertEqual(
            points[0],
            {"timestamp": self.start, "utilization": 25.0, "memory_percent": 10.0, "gpus_in_use": 1.0, "gpu_count": 2},
        )

    def test_writes_json_files(self) -> None:
        output = self.directory / "files"
        write_files(build_files(self.settings, self.database, now=self.start + 60), output)

        overview = json.loads((output / "overview.json").read_text())
        self.assertEqual(overview["summary"]["gpus_total"], 2)
        self.assertEqual(list(output.glob(".*.tmp")), [])


if __name__ == "__main__":
    unittest.main()
