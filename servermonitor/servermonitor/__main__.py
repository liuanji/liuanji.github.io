from __future__ import annotations

import argparse
import json
import logging
from dataclasses import asdict
from logging.handlers import RotatingFileHandler

from .config import Settings
from .database import Database
from .service import MonitorService
from .upload import Uploader
from .web import DashboardServer


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Local NVIDIA GPU monitor")
    parser.add_argument(
        "command", nargs="?", choices=("serve", "collect", "upload", "init-db"), default="serve"
    )
    parser.add_argument("--verbose", action="store_true")
    return parser


def _configure_logging(settings: Settings, command: str, verbose: bool) -> None:
    handlers: list[logging.Handler] = [logging.StreamHandler()]
    if command == "serve":
        log_path = settings.database_path.parent / "servermonitor.log"
        log_path.parent.mkdir(parents=True, exist_ok=True)
        handlers.append(
            RotatingFileHandler(
                log_path,
                maxBytes=1024 * 1024,
                backupCount=1,
                encoding="utf-8",
            )
        )
    logging.basicConfig(
        level=logging.DEBUG if verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=handlers,
    )


def main() -> None:
    args = _parser().parse_args()
    settings = Settings.from_env()
    _configure_logging(settings, args.command, args.verbose)
    database = Database(settings.database_path, settings.interval_seconds)
    database.initialize()

    if args.command == "init-db":
        print(settings.database_path)
        return

    service = MonitorService(settings, database)
    if args.command == "collect":
        results = service.collect_once()
        print(json.dumps([asdict(result) for result in results], ensure_ascii=False, indent=2))
        return

    if args.command == "upload":
        count = Uploader(settings, database).upload_once()
        print(f"uploaded {count} files to {settings.upload_url}")
        return

    uploader = Uploader(settings, database) if settings.upload_url else None

    server = DashboardServer((settings.bind, settings.port), settings, database)
    service.start()
    if uploader is not None:
        uploader.start()
        logging.info("uploading to %s", settings.upload_url)
    logging.info("dashboard listening on http://%s:%d", settings.bind, settings.port)
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.shutdown()
        server.server_close()
        service.stop()
        if uploader is not None:
            uploader.stop()


if __name__ == "__main__":
    main()
