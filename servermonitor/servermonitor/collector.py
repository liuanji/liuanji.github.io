from __future__ import annotations

import csv
import io
import subprocess
import time
from dataclasses import dataclass


# The owner of a GPU process that ps could not name, usually because it exited
# between the two queries. It still makes its GPU busy but is never a user.
UNKNOWN_USER = "unknown"

GPU_MARKER = "__SERVERMONITOR_GPUS__"
APP_MARKER = "__SERVERMONITOR_APPS__"
USER_MARKER = "__SERVERMONITOR_USERS__"
SYSTEM_MARKER = "__SERVERMONITOR_SYSTEM__"

# Every /scratch* mount, in bytes; a host without one reports no disks. timeout
# stops a hung mount from stalling the check.
DISK_SCRIPT = """\
export LC_ALL=C
timeout 10 df -P -B1 /scratch* 2>/dev/null || true
"""

# The system section prints the aggregate "cpu" line of /proc/stat from before
# the GPU queries and again at least a second later, so CPU load is measured
# over that span, plus MemTotal/MemAvailable and the CPU count.
COLLECT_SCRIPT = f"""\
set -eu
export LC_ALL=C
cpu_before="$(head -n 1 /proc/stat 2>/dev/null || true)"
printf '%s\\n' '{GPU_MARKER}'
nvidia-smi --query-gpu=index,uuid,name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,enforced.power.limit --format=csv,noheader,nounits
printf '%s\\n' '{APP_MARKER}'
apps="$(nvidia-smi --query-compute-apps=gpu_uuid,pid,process_name,used_memory --format=csv,noheader,nounits 2>/dev/null || true)"
printf '%s\\n' "$apps"
printf '%s\\n' '{USER_MARKER}'
pids="$(printf '%s\\n' "$apps" | awk -F, '{{gsub(/ /,"",$2); if ($2 ~ /^[0-9]+$/) print $2}}' | sort -u | paste -sd, -)"
if [ -n "$pids" ]; then
    ps -o pid= -o user= -p "$pids"
fi
printf '%s\\n' '{SYSTEM_MARKER}'
sleep 1
printf '%s\\n' "$cpu_before"
head -n 1 /proc/stat 2>/dev/null || true
grep -E '^(MemTotal|MemAvailable):' /proc/meminfo 2>/dev/null || true
nproc 2>/dev/null || true
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
    # The cap the driver enforces; None in snapshots from before it was collected.
    power_limit_w: float | None = None


@dataclass(frozen=True)
class ProcessStat:
    gpu_uuid: str
    pid: int
    username: str
    process_name: str
    used_memory_mb: float


@dataclass(frozen=True)
class SystemStat:
    cpu_percent: float | None
    cpu_count: int | None
    memory_used_mb: float | None
    memory_total_mb: float | None


@dataclass(frozen=True)
class DiskStat:
    mount: str
    total_bytes: int
    used_bytes: int
    available_bytes: int


@dataclass(frozen=True)
class DiskResult:
    host: str
    checked_at: int
    success: bool
    disks: tuple[DiskStat, ...] = ()
    error: str | None = None


@dataclass(frozen=True)
class CollectionResult:
    host: str
    sampled_at: int
    duration_ms: int
    success: bool
    gpus: tuple[GPUStat, ...] = ()
    processes: tuple[ProcessStat, ...] = ()
    error: str | None = None
    system: SystemStat | None = None


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
        SYSTEM_MARKER: [],
    }
    current: str | None = None
    for raw_line in output.splitlines():
        line = raw_line.rstrip("\r")
        if line in sections:
            current = line
        elif current is not None and line.strip():
            sections[current].append(line)
    return sections


def _system(lines: list[str]) -> SystemStat | None:
    """CPU load between the two /proc/stat readings (busy share of all CPU time,
    counting iowait as idle) and memory in use (MemTotal - MemAvailable)."""
    try:
        cpu_readings = [
            [int(value) for value in line.split()[1:9]]  # user .. steal
            for line in lines
            if line.startswith("cpu ")
        ]
        memory: dict[str, float] = {}
        cpu_count = None
        for line in lines:
            key, _, value = line.partition(":")
            if key in ("MemTotal", "MemAvailable") and value.split():
                memory[key] = int(value.split()[0]) / 1024
            elif line.strip().isdigit():
                cpu_count = int(line)
    except ValueError:
        return None

    cpu_percent = None
    if len(cpu_readings) == 2:
        before, after = cpu_readings
        total = sum(after) - sum(before)
        idle = sum(after[3:5]) - sum(before[3:5])
        if total > 0:
            cpu_percent = round(max(0.0, min(100.0, (1 - idle / total) * 100)), 1)
    total_mb = memory.get("MemTotal")
    available_mb = memory.get("MemAvailable")
    used_mb = round(total_mb - available_mb, 1) if total_mb and available_mb is not None else None
    if cpu_percent is None and used_mb is None:
        return None
    return SystemStat(
        cpu_percent=cpu_percent,
        cpu_count=cpu_count,
        memory_used_mb=used_mb,
        memory_total_mb=round(total_mb, 1) if total_mb else None,
    )


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
        if len(row) != 9:
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
                power_limit_w=_number(row[8], optional=True),
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
                username=users.get(pid, UNKNOWN_USER),
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
        system=_system(sections[SYSTEM_MARKER]),
    )


def parse_df_output(output: str) -> tuple[DiskStat, ...]:
    """Rows of `df -P -B1`; the header and any mount listed twice are skipped."""
    disks: dict[str, DiskStat] = {}
    for line in output.splitlines():
        fields = line.split()
        if len(fields) < 6 or not all(field.isdigit() for field in fields[1:4]):
            continue
        mount = " ".join(fields[5:])
        disks.setdefault(mount, DiskStat(mount, int(fields[1]), int(fields[2]), int(fields[3])))
    if not disks:
        raise ValueError("df reported no disks")
    return tuple(disks.values())


def _check_disks(host: str, command: list[str], timeout_seconds: int) -> DiskResult:
    checked_at = int(time.time())
    try:
        completed = subprocess.run(
            command,
            input=DISK_SCRIPT,
            text=True,
            capture_output=True,
            timeout=timeout_seconds + 5,
            check=False,
        )
        if completed.returncode != 0:
            raise ValueError(
                completed.stderr.strip() or f"disk check exited with code {completed.returncode}"
            )
        return DiskResult(host, checked_at, True, parse_df_output(completed.stdout))
    except (OSError, subprocess.TimeoutExpired, ValueError) as exc:
        return DiskResult(host, checked_at, False, error=str(exc)[-500:])


class LocalCollector:
    def __init__(self, timeout_seconds: int = 12) -> None:
        self.timeout_seconds = timeout_seconds

    def collect_disks(self, host: str) -> DiskResult:
        return _check_disks(host, ["sh", "-s"], self.timeout_seconds)

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

    def _command(self, host: str) -> list[str]:
        return [
            "ssh",
            "-T",
            "-o",
            "BatchMode=yes",
            "-o",
            f"ConnectTimeout={self.timeout_seconds}",
            host,
            "sh",
            "-s",
        ]

    def collect_disks(self, host: str) -> DiskResult:
        return _check_disks(host, self._command(host), self.timeout_seconds)

    def collect(self, host: str) -> CollectionResult:
        started = time.monotonic()
        sampled_at = int(time.time())
        try:
            completed = subprocess.run(
                self._command(host),
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
