from __future__ import annotations

import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from .collector import CollectionResult, LocalCollector, SSHCollector
from .config import Settings
from .database import Database


LOGGER = logging.getLogger(__name__)


class MonitorService:
    def __init__(self, settings: Settings, database: Database) -> None:
        self.settings = settings
        self.database = database
        self.local_collector = LocalCollector(settings.collection_timeout_seconds)
        self.ssh_collector = SSHCollector(settings.collection_timeout_seconds)
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._collection_lock = threading.Lock()
        self._cycles = 0

    def collect_once(self) -> list[CollectionResult]:
        if not self._collection_lock.acquire(blocking=False):
            return []
        try:
            results: list[CollectionResult] = []
            with ThreadPoolExecutor(max_workers=len(self.settings.hosts)) as executor:
                futures = {}
                if self.settings.host is not None:
                    futures[
                        executor.submit(self.local_collector.collect, self.settings.host)
                    ] = self.settings.host
                futures.update(
                    {
                        executor.submit(self.ssh_collector.collect, host): host
                        for host in self.settings.remote_hosts
                    }
                )
                for future in as_completed(futures):
                    result = future.result()
                    self.database.save(result)
                    results.append(result)
                    if result.success:
                        LOGGER.info(
                            "collected %s: %d GPUs, %d processes in %d ms",
                            result.host,
                            len(result.gpus),
                            len(result.processes),
                            result.duration_ms,
                        )
                    else:
                        LOGGER.warning(
                            "collection failed for %s: %s", result.host, result.error
                        )
            self._cycles += 1
            if self._cycles % 60 == 0:
                self.database.cleanup(
                    self.settings.raw_retention_days,
                    self.settings.rollup_retention_days,
                )
            host_order = {host: index for index, host in enumerate(self.settings.hosts)}
            return sorted(results, key=lambda result: host_order[result.host])
        finally:
            self._collection_lock.release()

    def _run(self) -> None:
        while not self._stop.is_set():
            try:
                self.collect_once()
            except Exception:
                LOGGER.exception("unexpected collection cycle failure")
            self._stop.wait(self.settings.interval_seconds)

    def start(self) -> None:
        if self._thread is not None:
            return
        self._thread = threading.Thread(
            target=self._run, name="gpu-collector", daemon=True
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread is not None:
            self._thread.join(timeout=self.settings.collection_timeout_seconds + 10)
