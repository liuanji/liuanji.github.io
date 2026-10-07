import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from servermonitor import upload
from servermonitor.collector import DiskResult, DiskStat
from servermonitor.config import Settings
from servermonitor.database import Database
from servermonitor.upload import UploadError, Uploader, batches, seconds_until_upload
from tests.test_database import successful_result


class BatchesTest(unittest.TestCase):
    def test_splits_by_file_count(self) -> None:
        files = {f"file-{index}": {"index": index} for index in range(45)}

        bodies = [json.loads(body)["files"] for body in batches(files)]

        self.assertEqual([len(body) for body in bodies], [40, 5])
        self.assertEqual(json.loads(bodies[1]["file-44"]), {"index": 44})

    def test_splits_by_size_and_stays_within_limit(self) -> None:
        files = {f"file-{index}": {"text": "é" * 200} for index in range(10)}

        with patch.object(upload, "MAX_UPLOAD_CHARS", 3000):
            bodies = list(batches(files))

        self.assertGreater(len(bodies), 1)
        for body in bodies:
            self.assertTrue(body.isascii())
            self.assertLessEqual(len(body), 3000)
        merged = {name: text for body in bodies for name, text in json.loads(body)["files"].items()}
        self.assertEqual(set(merged), set(files))

    def test_rejects_a_file_too_large_on_its_own(self) -> None:
        with patch.object(upload, "MAX_UPLOAD_CHARS", 100):
            with self.assertRaisesRegex(UploadError, "huge"):
                list(batches({"huge": "x" * 200}))


class ScheduleTest(unittest.TestCase):
    def test_uploads_45_seconds_into_each_minute(self) -> None:
        minute = 1_700_000_040
        self.assertEqual(seconds_until_upload(minute), 45)
        self.assertEqual(seconds_until_upload(minute + 44), 1)
        self.assertEqual(seconds_until_upload(minute + 45), 60)
        self.assertEqual(seconds_until_upload(minute + 50), 55)


class UploaderTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = tempfile.TemporaryDirectory()
        directory = Path(self.temporary_directory.name)
        self.token_path = directory / "upload_token"
        self.token_path.write_text("secret\n", encoding="utf-8")
        self.settings = Settings(
            host=None,
            remote_hosts=("brezel",),
            database_path=directory / "monitor.sqlite3",
            upload_url="https://relay.example",
            upload_token_path=self.token_path,
        )
        database = Database(self.settings.database_path, interval_seconds=60)
        database.initialize()
        database.save(successful_result(1_700_000_000, "brezel"))
        self.uploader = Uploader(self.settings, database)

    def tearDown(self) -> None:
        self.temporary_directory.cleanup()

    def test_posts_files_with_bearer_token(self) -> None:
        with patch.object(upload.urllib.request, "urlopen") as urlopen:
            count = self.uploader.upload_once(live_only=True, now=1_700_000_060)

        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://relay.example/upload")
        self.assertEqual(request.get_header("Authorization"), "Bearer secret")
        names = set(json.loads(request.data)["files"])
        self.assertEqual(names, {"overview", "history-all-1h", "history-brezel-1h", "uptime-1h"})
        self.assertEqual(count, 4)

    def test_uploads_disks_only_after_a_new_check(self) -> None:
        def uploaded_names() -> set[str]:
            with patch.object(upload.urllib.request, "urlopen") as urlopen:
                self.uploader.upload_once(live_only=True, now=1_700_000_060)
            return set(json.loads(urlopen.call_args.args[0].data)["files"])

        self.assertNotIn("disks", uploaded_names())
        disk = DiskStat("/scratch1", 1000, 600, 400)
        self.uploader.database.save_disks(DiskResult("brezel", 1_700_000_030, True, (disk,)))
        self.assertIn("disks", uploaded_names())
        self.assertNotIn("disks", uploaded_names())

    def test_missing_token_is_an_upload_error(self) -> None:
        self.token_path.unlink()

        with patch.object(upload.urllib.request, "urlopen") as urlopen:
            with self.assertRaisesRegex(UploadError, "upload token"):
                self.uploader.upload_once()
        urlopen.assert_not_called()

    def test_requires_an_upload_url(self) -> None:
        settings = Settings(host=None, remote_hosts=("brezel",), database_path=Path("unused"))

        with self.assertRaisesRegex(ValueError, "GPU_MONITOR_UPLOAD_URL"):
            Uploader(settings, Database(settings.database_path))


if __name__ == "__main__":
    unittest.main()
