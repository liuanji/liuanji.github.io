from __future__ import annotations

import csv
import io
import subprocess
import time
from dataclasses import dataclass


GPU_MARKER = "__SERVERMONITOR_GPUS__"
APP_MARKER = "__SERVERMONITOR_APPS__"
USER_MARKER = "__SERVERMONITOR_USERS__"

COLLECT_SCRIPT = f"""\
set -eu
export LC_ALL=C
printf '%s\\n' '{GPU_MARKER}'
nvidia-smi --query-gpu=index,uuid,name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw --format=csv,noheader,nounits
printf '%s\\n' '{APP_MARKER}'
apps="$(nvidia-smi --query-compute-apps=gpu_uuid,pid,process_name,used_memory --format=csv,noheader,nounits 2>/dev/null || true)"
printf '%s\\n' "$apps"
printf '%s\\n' '{USER_MARKER}'
pids="$(printf '%s\\n' "$apps" | awk -F, '{{gsub(/ /,"",$2); if ($2 ~ /^[0-9]+$/) print $2}}' | sort -u | paste -sd, -)"
if [ -n "$pids" ]; then
    ps -o pid= -o user= -p "$pids"
fi
"""


@dataclass(frozen=True)
class GPUStat:
    index: int
    uuid: str
    name: str
    utilization: float
    memory_used_mb: float
    memory_total_mb: float
    temperature_c: float | None
    power_w: float | None


@dataclass(frozen=True)
class ProcessStat:
    gpu_uuid: str
    pid: int
    username: str
    process_name: str
    used_memory_mb: float


@dataclass(frozen=True)
class CollectionResult:
    host: str
    sampled_at: int
    duration_ms: int
    success: bool
    gpus: tuple[GPUStat, ...] = ()
    processes: tuple[ProcessStat, ...] = ()
    error: str | None = None


def _number(value: str, *, optional: bool = False) -> float | None:
    cleaned = value.strip()
    if cleaned.lower() in {"n/a", "[n/a]", "not supported", ""}:
        if optional:
            return None
        return 0.0
    return float(cleaned)


def _sections(output: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {
        GPU_MARKER: [],
        APP_MARKER: [],
        USER_MARKER: [],
    }
    current: str | None = None
    for raw_line in output.splitlines():
        line = raw_line.rstrip("\r")
        if line in sections:
            current = line
        elif current is not None and line.strip():
            sections[current].append(line)
    return sections


def parse_collector_output(host: str, output: str, sampled_at: int, duration_ms: int) -> CollectionResult:
    sections = _sections(output)
    if not sections[GPU_MARKER]:
        raise ValueError("nvidia-smi returned no GPU rows")

    users: dict[int, str] = {}
    for line in sections[USER_MARKER]:
        fields = line.split(None, 1)
        if len(fields) == 2 and fields[0].isdigit():
            users[int(fields[0])] = fields[1].strip()

    gpus: list[GPUStat] = []
    for row in csv.reader(sections[GPU_MARKER]):
        if len(row) != 8:
            raise ValueError(f"unexpected GPU row with {len(row)} fields")
        gpus.append(
            GPUStat(
                index=int(row[0].strip()),
                uuid=row[1].strip(),
                name=row[2].strip(),
                utilization=float(_number(row[3]) or 0),
                memory_used_mb=float(_number(row[4]) or 0),
                memory_total_mb=float(_number(row[5]) or 0),
                temperature_c=_number(row[6], optional=True),
                power_w=_number(row[7], optional=True),
            )
        )

    known_uuids = {gpu.uuid for gpu in gpus}
    processes: list[ProcessStat] = []
    for row in csv.reader(sections[APP_MARKER]):
        if len(row) < 4 or not row[1].strip().isdigit():
            continue
        uuid = row[0].strip()
        if uuid not in known_uuids:
            continue
        pid = int(row[1].strip())
        processes.append(
            ProcessStat(
                gpu_uuid=uuid,
                pid=pid,
                username=users.get(pid, "unknown"),
                process_name=",".join(row[2:-1]).strip(),
                used_memory_mb=float(_number(row[-1]) or 0),
            )
        )

    return CollectionResult(
        host=host,
        sampled_at=sampled_at,
        duration_ms=duration_ms,
        success=True,
        gpus=tuple(sorted(gpus, key=lambda gpu: gpu.index)),
        processes=tuple(processes),
    )


class LocalCollector:
    def __init__(self, timeout_seconds: int = 12) -> None:
        self.timeout_seconds = timeout_seconds

    def collect(self, host: str) -> CollectionResult:
        started = time.monotonic()
        sampled_at = int(time.time())
        try:
            completed = subprocess.run(
                [
                    "sh",
                    "-s",
                ],
                input=COLLECT_SCRIPT,
                text=True,
                capture_output=True,
                timeout=self.timeout_seconds + 5,
                check=False,
            )
            duration_ms = int((time.monotonic() - started) * 1000)
            if completed.returncode != 0:
                error = completed.stderr.strip() or (
                    f"collector exited with code {completed.returncode}"
                )
                return CollectionResult(
                    host=host,
                    sampled_at=sampled_at,
                    duration_ms=duration_ms,
                    success=False,
                    error=error[-500:],
                )
            return parse_collector_output(
                host, completed.stdout, sampled_at, duration_ms
            )
        except (OSError, subprocess.TimeoutExpired, ValueError) as exc:
            duration_ms = int((time.monotonic() - started) * 1000)
            return CollectionResult(
                host=host,
                sampled_at=sampled_at,
                duration_ms=duration_ms,
                success=False,
                error=str(exc)[-500:],
            )


class SSHCollector:
    def __init__(self, timeout_seconds: int = 12) -> None:
        self.timeout_seconds = timeout_seconds

    def collect(self, host: str) -> CollectionResult:
        started = time.monotonic()
        sampled_at = int(time.time())
        try:
            completed = subprocess.run(
                [
                    "ssh",
                    "-T",
                    "-o",
                    "BatchMode=yes",
                    "-o",
                    f"ConnectTimeout={self.timeout_seconds}",
                    host,
                    "sh",
                    "-s",
                ],
                input=COLLECT_SCRIPT,
                text=True,
                capture_output=True,
                timeout=self.timeout_seconds + 5,
                check=False,
            )
            duration_ms = int((time.monotonic() - started) * 1000)
            if completed.returncode != 0:
                error = completed.stderr.strip() or (
                    f"ssh collector exited with code {completed.returncode}"
                )
                return CollectionResult(
                    host=host,
                    sampled_at=sampled_at,
                    duration_ms=duration_ms,
                    success=False,
                    error=error[-500:],
                )
            return parse_collector_output(
                host, completed.stdout, sampled_at, duration_ms
            )
        except (OSError, subprocess.TimeoutExpired, ValueError) as exc:
            duration_ms = int((time.monotonic() - started) * 1000)
            return CollectionResult(
                host=host,
                sampled_at=sampled_at,
                duration_ms=duration_ms,
                success=False,
                error=str(exc)[-500:],
            )
