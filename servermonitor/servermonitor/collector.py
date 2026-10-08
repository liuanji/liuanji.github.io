from __future__ import annotations

import csv
import io
import json
import re
import subprocess
import time
from dataclasses import dataclass, replace


# The owner of a GPU process that ps could not name, usually because it exited
# between the two queries. It still makes its GPU busy but is never a user.
UNKNOWN_USER = "unknown"

GPU_MARKER = "__SERVERMONITOR_GPUS__"
APP_MARKER = "__SERVERMONITOR_APPS__"
USER_MARKER = "__SERVERMONITOR_USERS__"
SYSTEM_MARKER = "__SERVERMONITOR_SYSTEM__"
HEALTH_MARKER = "__SERVERMONITOR_HEALTH__"
PEOPLE_MARKER = "__SERVERMONITOR_PEOPLE__"
ACCOUNT_MARKER = "__SERVERMONITOR_ACCOUNTS__"
USAGE_MARKER = "__SERVERMONITOR_USAGE__"
# Written every 2 hours by root's scratch-usage service (deploy/scratch-usage):
# how much each top-level folder of the scratch disks uses.
USAGE_PATH = "/var/lib/scratch-usage/usage.json"

# Every /scratch* mount, in bytes; a host without one reports no disks. timeout
# stops a hung mount from stalling the check. The same slow check lists the
# host's login accounts (regular UIDs with a usable shell), the usernames that
# may sign in to the /top page, and reads the per-folder usage summary if the
# host has one.
DISK_SCRIPT = f"""\
export LC_ALL=C
timeout 10 df -P -B1 /scratch* 2>/dev/null || true
printf '%s\\n' '{ACCOUNT_MARKER}'
timeout 10 getent passwd 2>/dev/null | awk -F: '$3 >= 1000 && $3 < 60000 && $7 !~ /(nologin|false)$/ {{print $1}}' || true
printf '%s\\n' '{USAGE_MARKER}'
cat {USAGE_PATH} 2>/dev/null || true
"""
# What a username may look like; anything else in getent's output is skipped.
ACCOUNT_PATTERN = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9._-]{0,31}$")

# Per-user CPU and memory: ps names every process's owner in full and its
# resident memory in KiB; top's second pass (its first has no CPU figures yet)
# gives each process's CPU, as a percent of one core, joined by PID. Prints
# "<user> <cpu percent> <resident KiB>" per user.
PEOPLE_AWK = (
    '$0 == "__TOP__" {top = 1; next} '
    "!top {owner[$1] = $2; memory[$2] += $3; next} "
    "/^ *PID +USER/ {block++; next} "
    "block == 2 && ($1 in owner) {cpu[owner[$1]] += $9} "
    'END {for (user in memory) printf "%s %.1f %.0f\\n", user, cpu[user] + 0, memory[user]}'
)

# The health section lists each GPU's clock-slowdown reasons (a bit mask),
# uncorrected ECC errors since boot, and whether memory rows await or failed
# remapping; on its own nvidia-smi call, so an unsupported field cannot break
# the readings above. The people section runs top for about a second, which
# also spaces the two CPU readings below.
# The system section prints the aggregate "cpu" line of /proc/stat from before
# the GPU queries and again at least a second later, so CPU load is measured
# over that span, plus memory and swap from /proc/meminfo, the CPU count, the
# load averages, the uptime, the CPU model and how many sockets and physical
# cores carry those CPUs (nproc counts hyper-threads).
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
    ps -o pid= -o user= -o etimes= -p "$pids"
fi
printf '%s\\n' '{HEALTH_MARKER}'
nvidia-smi --query-gpu=index,clocks_event_reasons.active,ecc.errors.uncorrected.volatile.total,remapped_rows.pending,remapped_rows.failure --format=csv,noheader,nounits 2>/dev/null || true
printf '%s\\n' '{PEOPLE_MARKER}'
if command -v top >/dev/null 2>&1; then
    {{ ps -eo pid=,user:32=,rss=; echo __TOP__; top -b -n 2 -d 1 -w 512; }} 2>/dev/null | awk '{PEOPLE_AWK}' || true
else
    sleep 1
fi
printf '%s\\n' '{SYSTEM_MARKER}'
printf '%s\\n' "$cpu_before"
head -n 1 /proc/stat 2>/dev/null || true
grep -E '^(MemTotal|MemAvailable|Buffers|Cached|SwapTotal|SwapFree):' /proc/meminfo 2>/dev/null || true
nproc 2>/dev/null || true
cat /proc/loadavg 2>/dev/null || true
printf 'uptime %s\\n' "$(cut -d ' ' -f 1 /proc/uptime 2>/dev/null)"
grep -m 1 '^model name' /proc/cpuinfo 2>/dev/null || true
printf 'sockets %s\\n' "$(grep '^physical id' /proc/cpuinfo 2>/dev/null | sort -u | wc -l)"
printf 'cores %s\\n' "$(awk -F: '/^physical id/ {{p = $2}} /^core id/ {{print p "/" $2}}' /proc/cpuinfo 2>/dev/null | sort -u | wc -l)"
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
    # Health, from its own query; None when it could not be read. clock_events
    # is nvidia-smi's bit mask of why clocks are being held down.
    clock_events: int | None = None
    ecc_uncorrected: int | None = None
    rows_remap_pending: bool | None = None
    rows_remap_failed: bool | None = None


@dataclass(frozen=True)
class ProcessStat:
    gpu_uuid: str
    pid: int
    username: str
    process_name: str
    used_memory_mb: float
    # How long the process has been running; None when ps could not say.
    elapsed_seconds: int | None = None


@dataclass(frozen=True)
class SystemStat:
    cpu_percent: float | None
    cpu_count: int | None
    memory_used_mb: float | None
    memory_total_mb: float | None
    # Added later, so None in older snapshots and on hosts that lack them.
    memory_cache_mb: float | None = None
    swap_used_mb: float | None = None
    swap_total_mb: float | None = None
    load_averages: tuple[float, float, float] | None = None
    uptime_seconds: float | None = None
    cpu_model: str | None = None
    cpu_sockets: int | None = None
    cpu_cores: int | None = None
    # Share of CPU time spent waiting on disks, over the same span as cpu_percent.
    iowait_percent: float | None = None
    # Each user's CPU (percent of one core) and resident memory, as
    # {"user", "cpu_percent", "memory_mb"}; None when it could not be measured.
    users: tuple[dict, ...] | None = None


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
    # The host's login accounts, sorted; None when they could not be listed.
    accounts: tuple[str, ...] | None = None
    # The scratch-usage summary: {"checked_at": int, "mounts": {mount: [
    # {"owner": str, "bytes": int}, ...]}}; None when the host has none.
    usage: dict | None = None


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
        HEALTH_MARKER: [],
        PEOPLE_MARKER: [],
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


MEMINFO_KEYS = ("MemTotal", "MemAvailable", "Buffers", "Cached", "SwapTotal", "SwapFree")


def _system(lines: list[str]) -> SystemStat | None:
    """CPU load between the two /proc/stat readings (busy share of all CPU time,
    counting iowait as idle), memory in use (MemTotal - MemAvailable), and the
    extras: page cache, swap, load averages, uptime and CPU model."""
    try:
        cpu_readings = [
            [int(value) for value in line.split()[1:9]]  # user .. steal
            for line in lines
            if line.startswith("cpu ")
        ]
        memory: dict[str, float] = {}
        cpu_count = None
        load_averages = None
        uptime_seconds = None
        cpu_model = None
        topology: dict[str, int] = {}
        for line in lines:
            key, _, value = line.partition(":")
            fields = line.split()
            if key in MEMINFO_KEYS and value.split():
                memory[key] = int(value.split()[0]) / 1024
            elif line.strip().isdigit():
                cpu_count = int(line)
            elif len(fields) == 5 and "/" in fields[3]:
                load_averages = (float(fields[0]), float(fields[1]), float(fields[2]))
            elif fields[:1] == ["uptime"] and len(fields) == 2:
                uptime_seconds = float(fields[1])
            elif key.strip() == "model name" and value.strip():
                cpu_model = " ".join(value.split())
            elif len(fields) == 2 and fields[0] in ("sockets", "cores") and fields[1].isdigit():
                # 0 when /proc/cpuinfo lacks the fields, as on some virtual machines.
                if int(fields[1]) > 0:
                    topology[fields[0]] = int(fields[1])
    except ValueError:
        return None

    cpu_percent = None
    iowait_percent = None
    if len(cpu_readings) == 2:
        before, after = cpu_readings
        total = sum(after) - sum(before)
        idle = sum(after[3:5]) - sum(before[3:5])
        if total > 0:
            cpu_percent = round(max(0.0, min(100.0, (1 - idle / total) * 100)), 1)
            # The fifth field of the cpu line is iowait.
            iowait_percent = round(max(0.0, min(100.0, (after[4] - before[4]) / total * 100)), 1)
    total_mb = memory.get("MemTotal")
    available_mb = memory.get("MemAvailable")
    used_mb = round(total_mb - available_mb, 1) if total_mb and available_mb is not None else None
    if cpu_percent is None and used_mb is None:
        return None
    cache = [memory[key] for key in ("Buffers", "Cached") if key in memory]
    swap_total = memory.get("SwapTotal")
    swap_free = memory.get("SwapFree")
    return SystemStat(
        cpu_percent=cpu_percent,
        iowait_percent=iowait_percent,
        cpu_count=cpu_count,
        memory_used_mb=used_mb,
        memory_total_mb=round(total_mb, 1) if total_mb else None,
        memory_cache_mb=round(sum(cache), 1) if cache else None,
        swap_used_mb=round(swap_total - swap_free, 1) if swap_total and swap_free is not None else None,
        swap_total_mb=round(swap_total, 1) if swap_total else None,
        load_averages=load_averages,
        uptime_seconds=round(uptime_seconds) if uptime_seconds is not None else None,
        cpu_model=cpu_model,
        cpu_sockets=topology.get("sockets"),
        cpu_cores=topology.get("cores"),
    )


def _health(lines: list[str]) -> dict[int, dict]:
    """Each GPU's health fields by index; a malformed row is skipped."""
    health: dict[int, dict] = {}
    for row in csv.reader(lines):
        if len(row) != 5 or not row[0].strip().isdigit():
            continue
        events, ecc, pending, failed = (field.strip() for field in row[1:])
        try:
            clock_events = int(events, 16) if events.lower().startswith("0x") else None
        except ValueError:
            clock_events = None
        health[int(row[0])] = {
            "clock_events": clock_events,
            "ecc_uncorrected": int(ecc) if ecc.isdigit() else None,
            "rows_remap_pending": {"yes": True, "no": False}.get(pending.lower()),
            "rows_remap_failed": {"yes": True, "no": False}.get(failed.lower()),
        }
    return health


def _people(lines: list[str]) -> tuple[dict, ...] | None:
    """Per-user CPU and memory, largest memory first; None without any."""
    users = []
    for line in lines:
        fields = line.split()
        if len(fields) != 3:
            continue
        try:
            users.append(
                {
                    "user": fields[0],
                    "cpu_percent": round(float(fields[1]), 1),
                    "memory_mb": round(float(fields[2]) / 1024, 1),
                }
            )
        except ValueError:
            continue
    users.sort(key=lambda user: user["memory_mb"], reverse=True)
    return tuple(users) or None


def parse_collector_output(host: str, output: str, sampled_at: int, duration_ms: int) -> CollectionResult:
    sections = _sections(output)
    if not sections[GPU_MARKER]:
        raise ValueError("nvidia-smi returned no GPU rows")

    users: dict[int, str] = {}
    elapsed: dict[int, int] = {}
    for line in sections[USER_MARKER]:
        fields = line.split()
        if len(fields) >= 2 and fields[0].isdigit():
            users[int(fields[0])] = fields[1]
            if len(fields) >= 3 and fields[2].isdigit():
                elapsed[int(fields[0])] = int(fields[2])
    health = _health(sections[HEALTH_MARKER])

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
                **health.get(int(row[0].strip()), {}),
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
                elapsed_seconds=elapsed.get(pid),
            )
        )

    return CollectionResult(
        host=host,
        sampled_at=sampled_at,
        duration_ms=duration_ms,
        success=True,
        gpus=tuple(sorted(gpus, key=lambda gpu: gpu.index)),
        processes=tuple(processes),
        system=_with_people(_system(sections[SYSTEM_MARKER]), _people(sections[PEOPLE_MARKER])),
    )


def _with_people(system: SystemStat | None, people: tuple[dict, ...] | None) -> SystemStat | None:
    return replace(system, users=people) if system is not None and people else system


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


def parse_accounts(output: str) -> tuple[str, ...]:
    """One username per line, as the disk check's account section prints them."""
    return tuple(sorted({line.strip() for line in output.splitlines() if ACCOUNT_PATTERN.match(line.strip())}))


def parse_usage(output: str) -> dict | None:
    """The scratch-usage summary, keeping only well-formed folders; None when the
    host has no summary or it does not parse."""
    try:
        data = json.loads(output)
        mounts = {
            str(mount["mount"]): [
                {"owner": str(folder["owner"]), "bytes": int(folder["bytes"])}
                for folder in mount["folders"]
            ]
            for mount in data["mounts"]
        }
        return {"checked_at": int(data["checked_at"]), "mounts": mounts}
    except (ValueError, TypeError, KeyError):
        return None


def _check_disks(host: str, command: list[str], timeout_seconds: int) -> DiskResult:
    checked_at = int(time.time())
    accounts = None
    usage = None
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
        rest, usage_marker, usage_output = completed.stdout.partition(USAGE_MARKER)
        df_output, account_marker, account_output = rest.partition(ACCOUNT_MARKER)
        accounts = parse_accounts(account_output) if account_marker else None
        usage = parse_usage(usage_output) if usage_marker and usage_output.strip() else None
        return DiskResult(
            host, checked_at, True, parse_df_output(df_output), accounts=accounts, usage=usage
        )
    except (OSError, subprocess.TimeoutExpired, ValueError) as exc:
        # Accounts and usage read before df failed are still worth keeping.
        return DiskResult(
            host, checked_at, False, error=str(exc)[-500:], accounts=accounts, usage=usage
        )


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
