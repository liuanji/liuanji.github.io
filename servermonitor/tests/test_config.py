import os
import unittest
from unittest.mock import patch

from servermonitor.config import Settings


class SettingsTest(unittest.TestCase):
    @patch("servermonitor.config.socket.gethostname", return_value="brezel.internal")
    def test_parses_local_and_remote_hosts(self, _hostname) -> None:
        with patch.dict(
            os.environ,
            {"GPU_MONITOR_REMOTE_HOSTS": "toast, croissant"},
            clear=True,
        ):
            settings = Settings.from_env()

        self.assertEqual(settings.host, "brezel")
        self.assertEqual(settings.remote_hosts, ("toast", "croissant"))
        self.assertEqual(settings.hosts, ("brezel", "toast", "croissant"))
        self.assertEqual(settings.interval_seconds, 30)

    def test_rejects_duplicate_hosts(self) -> None:
        with patch.dict(
            os.environ,
            {"GPU_MONITOR_HOST": "brezel", "GPU_MONITOR_REMOTE_HOSTS": "toast,brezel"},
            clear=True,
        ):
            with self.assertRaisesRegex(ValueError, "unique"):
                Settings.from_env()

    def test_remote_only_mode_skips_local_host(self) -> None:
        with patch.dict(
            os.environ,
            {
                "GPU_MONITOR_COLLECT_LOCAL": "0",
                "GPU_MONITOR_HOST": "jump",
                "GPU_MONITOR_REMOTE_HOSTS": "brezel,toast,croissant",
            },
            clear=True,
        ):
            settings = Settings.from_env()

        self.assertIsNone(settings.host)
        self.assertEqual(settings.hosts, ("brezel", "toast", "croissant"))

    def test_remote_only_mode_requires_remote_hosts(self) -> None:
        with patch.dict(os.environ, {"GPU_MONITOR_COLLECT_LOCAL": "0"}, clear=True):
            with self.assertRaisesRegex(ValueError, "GPU_MONITOR_REMOTE_HOSTS"):
                Settings.from_env()

    def test_rejects_unknown_collect_local_value(self) -> None:
        with patch.dict(os.environ, {"GPU_MONITOR_COLLECT_LOCAL": "maybe"}, clear=True):
            with self.assertRaisesRegex(ValueError, "GPU_MONITOR_COLLECT_LOCAL"):
                Settings.from_env()


if __name__ == "__main__":
    unittest.main()
