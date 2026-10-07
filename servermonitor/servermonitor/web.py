from __future__ import annotations

import json
import logging
import mimetypes
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .config import Settings
from .database import Database


LOGGER = logging.getLogger(__name__)
STATIC_DIR = Path(__file__).with_name("static")
RANGES = {
    "1h": 3600,
    "24h": 24 * 3600,
    "7d": 7 * 86400,
    "30d": 30 * 86400,
    "90d": 90 * 86400,
    "365d": 365 * 86400,
}
PERIODS = (
    ("1h", RANGES["1h"]),
    ("24h", RANGES["24h"]),
    ("7d", RANGES["7d"]),
    ("30d", RANGES["30d"]),
    ("90d", RANGES["90d"]),
    ("365d", RANGES["365d"]),
)


class DashboardServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(
        self, address: tuple[str, int], settings: Settings, database: Database
    ) -> None:
        super().__init__(address, DashboardHandler)
        self.settings = settings
        self.database = database


class DashboardHandler(BaseHTTPRequestHandler):
    server: DashboardServer

    def log_message(self, format: str, *args: object) -> None:
        LOGGER.debug("%s - %s", self.address_string(), format % args)

    def _headers(
        self, status: HTTPStatus, content_type: str, length: int, cache: str = "no-store"
    ) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(length))
        self.send_header("Cache-Control", cache)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'",
        )
        self.end_headers()

    def _json(self, payload: object, status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
        self._headers(status, "application/json; charset=utf-8", len(body))
        self.wfile.write(body)

    def _error(self, message: str, status: HTTPStatus = HTTPStatus.BAD_REQUEST) -> None:
        self._json({"error": message}, status)

    def _static(self, filename: str) -> None:
        path = STATIC_DIR / filename
        try:
            body = path.read_bytes()
        except FileNotFoundError:
            self._error("not found", HTTPStatus.NOT_FOUND)
            return
        mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if mime.startswith("text/") or mime in {"application/javascript", "image/svg+xml"}:
            mime += "; charset=utf-8"
        self._headers(HTTPStatus.OK, mime, len(body), "no-cache")
        self.wfile.write(body)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self._static("index.html")
        elif parsed.path in {"/app.js", "/styles.css", "/favicon.svg"}:
            self._static(parsed.path.lstrip("/"))
        elif parsed.path == "/api/overview":
            self._json(
                self.server.database.overview(
                    self.server.settings.hosts,
                    self.server.settings.stale_after_seconds,
                )
            )
        elif parsed.path == "/api/history":
            self._history(parse_qs(parsed.query))
        elif parsed.path == "/api/users":
            self._users(parse_qs(parsed.query))
        elif parsed.path == "/api/periods":
            self._periods(parse_qs(parsed.query))
        elif parsed.path == "/api/health":
            overview = self.server.database.overview(
                self.server.settings.hosts,
                self.server.settings.stale_after_seconds,
            )
            self._json(
                {
                    "status": "ok",
                    "hosts_online": overview["summary"]["hosts_online"],
                    "hosts_total": overview["summary"]["hosts_total"],
                }
            )
        else:
            self._error("not found", HTTPStatus.NOT_FOUND)

    def _host_filter(self, query: dict[str, list[str]]) -> str | None:
        host = query.get("host", [None])[0]
        if host == "all" or host == "":
            host = None
        if host is not None and host not in self.server.settings.hosts:
            raise ValueError("unknown host")
        return host

    def _filters(self, query: dict[str, list[str]]) -> tuple[str, int, int, str | None, int | None]:
        range_name = query.get("range", ["24h"])[0]
        if range_name not in RANGES:
            raise ValueError(f"range must be one of {', '.join(RANGES)}")
        end = int(time.time())
        start = end - RANGES[range_name]
        host = self._host_filter(query)
        gpu_raw = query.get("gpu", [None])[0]
        gpu_index = None
        if gpu_raw not in {None, "", "all"}:
            try:
                gpu_index = int(gpu_raw)
            except ValueError as exc:
                raise ValueError("gpu must be an integer") from exc
            if gpu_index < 0:
                raise ValueError("gpu must be non-negative")
        return range_name, start, end, host, gpu_index

    def _periods(self, query: dict[str, list[str]]) -> None:
        try:
            host = self._host_filter(query)
        except ValueError as exc:
            self._error(str(exc))
            return
        self._json(
            {
                "host": host,
                "periods": self.server.database.period_summaries(
                    PERIODS, host=host
                ),
            }
        )

    def _history(self, query: dict[str, list[str]]) -> None:
        try:
            range_name, start, end, host, gpu_index = self._filters(query)
        except ValueError as exc:
            self._error(str(exc))
            return
        self._json(
            {
                "range": range_name,
                "start": start,
                "end": end,
                "host": host,
                "gpu": gpu_index,
                "points": self.server.database.history(start, end, host, gpu_index),
            }
        )

    def _users(self, query: dict[str, list[str]]) -> None:
        try:
            range_name, start, end, host, _ = self._filters(query)
        except ValueError as exc:
            self._error(str(exc))
            return
        self._json(
            {
                "range": range_name,
                "start": start,
                "end": end,
                "host": host,
                "users": self.server.database.user_summary(start, end, host),
            }
        )
