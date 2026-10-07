from __future__ import annotations

import os
import socket
from dataclasses import dataclass
from pathlib import Path


def _positive_int(name: str, default: int, minimum: int = 1) -> int:
    raw = os.environ.get(name, str(default))
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer, got {raw!r}") from exc
    if value < minimum:
        raise ValueError(f"{name} must be at least {minimum}, got {value}")
    return value


def _flag(name: str, default: bool) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    value = raw.strip().lower()
    if value in {"1", "true", "yes", "on"}:
        return True
    if value in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be 1 or 0, got {raw!r}")


@dataclass(frozen=True)
class Settings:
    # None when this machine has no GPUs and only collects over SSH.
    host: str | None
    remote_hosts: tuple[str, ...]
    database_path: Path
    interval_seconds: int = 60
    collection_timeout_seconds: int = 12
    bind: str = "127.0.0.1"
    port: int = 8765
    rollup_retention_days: int = 365

    @property
    def stale_after_seconds(self) -> int:
        return max(self.interval_seconds * 3, 180)

    @property
    def hosts(self) -> tuple[str, ...]:
        local_hosts = () if self.host is None else (self.host,)
        return (*local_hosts, *self.remote_hosts)

    @classmethod
    def from_env(cls) -> "Settings":
        remote_hosts = tuple(
            remote.strip()
            for remote in os.environ.get("GPU_MONITOR_REMOTE_HOSTS", "").split(",")
            if remote.strip()
        )
        host: str | None = None
        if _flag("GPU_MONITOR_COLLECT_LOCAL", True):
            detected_host = socket.gethostname().split(".", 1)[0]
            host = os.environ.get("GPU_MONITOR_HOST", detected_host).strip()
            if not host:
                raise ValueError("GPU_MONITOR_HOST may not be empty")
        elif not remote_hosts:
            raise ValueError(
                "GPU_MONITOR_REMOTE_HOSTS must list at least one host "
                "when GPU_MONITOR_COLLECT_LOCAL=0"
            )

        hosts = remote_hosts if host is None else (host, *remote_hosts)
        if len(set(hosts)) != len(hosts):
            raise ValueError("GPU monitor hosts must be unique")
        if any(
            item.startswith("-") or any(character.isspace() for character in item)
            for item in hosts
        ):
            raise ValueError("GPU monitor hosts may not start with '-' or contain whitespace")

        database_path = Path(
            os.environ.get("GPU_MONITOR_DATABASE", "./data/servermonitor.sqlite3")
        ).expanduser()
        return cls(
            host=host,
            remote_hosts=remote_hosts,
            database_path=database_path,
            interval_seconds=_positive_int("GPU_MONITOR_INTERVAL", 30, 10),
            collection_timeout_seconds=_positive_int("GPU_MONITOR_TIMEOUT", 12),
            bind=os.environ.get("GPU_MONITOR_BIND", "127.0.0.1"),
            port=_positive_int("GPU_MONITOR_PORT", 8765),
            rollup_retention_days=_positive_int(
                "GPU_MONITOR_ROLLUP_RETENTION_DAYS", 365
            ),
        )
