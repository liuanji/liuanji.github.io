"""Pushes the public /top page's files to the relay Worker (worker/README.md).

The page refreshes the overview and the 1h histories and availability every
minute and everything else every 5 minutes, so uploads follow the same cadence.
That is about 17,000 D1 row writes a day for three hosts, well inside the free
plan's 100,000.
"""

from __future__ import annotations

import json
import logging
import threading
import time
import urllib.error
import urllib.request
from typing import Any, Iterator

from .config import Settings
from .database import Database
from .publish import build_files


LOGGER = logging.getLogger(__name__)

LIVE_INTERVAL_SECONDS = 60
# Upload this far into each minute, so every host has been checked at least once
# in the current minute: the newest availability bar is never empty at upload.
UPLOAD_OFFSET_SECONDS = 45
FULL_EVERY_CYCLES = 5
# The Worker accepts at most 40 files and 1,000,000 characters per upload.
MAX_FILES_PER_UPLOAD = 40
MAX_UPLOAD_CHARS = 900_000
REQUEST_TIMEOUT_SECONDS = 30


class UploadError(RuntimeError):
    pass


def seconds_until_upload(now: float) -> float:
    return LIVE_INTERVAL_SECONDS - (now - UPLOAD_OFFSET_SECONDS) % LIVE_INTERVAL_SECONDS


def batches(files: dict[str, Any]) -> Iterator[str]:
    """Request bodies of {"files": {name: JSON text}}, each within the Worker's
    limits. The bodies are ASCII-only (json.dumps escapes everything else), so
    their length equals the String.length the Worker checks."""
    empty = len(json.dumps({"files": {}}))
    batch: dict[str, str] = {}
    size = empty
    for name, payload in files.items():
        text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        # '"name": "text", ' is an upper bound on what the entry adds.
        entry = len(json.dumps(name)) + len(json.dumps(text)) + 4
        if empty + entry > MAX_UPLOAD_CHARS:
            raise UploadError(f"{name} alone exceeds {MAX_UPLOAD_CHARS} characters")
        if batch and (len(batch) == MAX_FILES_PER_UPLOAD or size + entry > MAX_UPLOAD_CHARS):
            yield json.dumps({"files": batch})
            batch, size = {}, empty
        batch[name] = text
        size += entry
    if batch:
        yield json.dumps({"files": batch})


class Uploader:
    def __init__(self, settings: Settings, database: Database) -> None:
        if settings.upload_url is None:
            raise ValueError("GPU_MONITOR_UPLOAD_URL is not set")
        self.settings = settings
        self.database = database
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._error: str | None = None

    def _token(self) -> str:
        # Read on every upload so a rotated token takes effect without a restart.
        try:
            token = self.settings.upload_token_path.read_text(encoding="utf-8").strip()
        except OSError as exc:
            raise UploadError(f"cannot read upload token: {exc}") from exc
        if not token:
            raise UploadError(f"{self.settings.upload_token_path} is empty")
        return token

    def _post(self, body: str, token: str) -> None:
        request = urllib.request.Request(
            f"{self.settings.upload_url}/upload",
            data=body.encode("utf-8"),
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "User-Agent": "servermonitor",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read(200).decode("utf-8", "replace")
            raise UploadError(f"HTTP {exc.code}: {detail}") from exc
        except (urllib.error.URLError, OSError) as exc:
            raise UploadError(str(exc)) from exc

    def upload_once(self, live_only: bool = False, now: int | None = None) -> int:
        """Uploads the files and returns how many were stored."""
        token = self._token()
        files = build_files(self.settings, self.database, now=now, live_only=live_only)
        for body in batches(files):
            self._post(body, token)
        return len(files)

    def _log_failure(self, error: str | None) -> None:
        """Like the collector, log only when uploads start failing, change error,
        or recover."""
        if error is None:
            if self._error is not None:
                LOGGER.info("upload recovered")
        elif error != self._error:
            LOGGER.warning("upload failed: %s", error)
        self._error = error

    def _run(self) -> None:
        cycle = 0
        full_due = True
        while not self._stop.is_set():
            try:
                count = self.upload_once(live_only=not full_due)
                LOGGER.debug("uploaded %d files", count)
                self._log_failure(None)
                full_due = False
            except UploadError as exc:
                self._log_failure(str(exc))
            except Exception:
                LOGGER.exception("unexpected upload failure")
            cycle += 1
            if cycle % FULL_EVERY_CYCLES == 0:
                full_due = True
            self._stop.wait(seconds_until_upload(time.time()))

    def start(self) -> None:
        if self._thread is not None:
            return
        self._thread = threading.Thread(target=self._run, name="gpu-uploader", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=REQUEST_TIMEOUT_SECONDS + 5)
