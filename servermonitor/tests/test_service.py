import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from servermonitor.config import Settings
from servermonitor.database import Database
from servermonitor.service import MonitorService
from tests.test_database import successful_result


class MonitorServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.temporary_directory.name) / "monitor.sqlite3"

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def _service(self, settings: Settings) -> MonitorService:
        database = Database(settings.database_path, settings.interval_seconds)
        database.initialize()
        return MonitorService(settings, database)

    def test_remote_only_collects_every_host_over_ssh(self) -> None:
        service = self._service(
            Settings(
                host=None,
                remote_hosts=("brezel", "toast", "croissant"),
                database_path=self.database_path,
            )
        )
        with patch.object(service.local_collector, "collect") as local, patch.object(
            service.ssh_collector,
            "collect",
            side_effect=lambda host: successful_result(1_700_000_000, host),
        ) as ssh:
            results = service.collect_once()

        local.assert_not_called()
        self.assertEqual(ssh.call_count, 3)
        self.assertEqual(
            [result.host for result in results], ["brezel", "toast", "croissant"]
        )

    def test_local_host_is_collected_without_ssh(self) -> None:
        service = self._service(
            Settings(
                host="brezel",
                remote_hosts=("toast",),
                database_path=self.database_path,
            )
        )
        with patch.object(
            service.local_collector,
            "collect",
            side_effect=lambda host: successful_result(1_700_000_000, host),
        ) as local, patch.object(
            service.ssh_collector,
            "collect",
            side_effect=lambda host: successful_result(1_700_000_000, host),
        ) as ssh:
            results = service.collect_once()

        local.assert_called_once_with("brezel")
        ssh.assert_called_once_with("toast")
        self.assertEqual([result.host for result in results], ["brezel", "toast"])


if __name__ == "__main__":
    unittest.main()
