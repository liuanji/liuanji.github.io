"""Simulated GPU servers, for previewing the /top page without real ones.

    python3 -m servermonitor.sample WORK_DIR [--days 35] [--live]

Simulates three 8-GPU servers shared by made-up users, stores the usage with
the real Database, and publishes the page's files with publish.build_files
into WORK_DIR/files. With --live it keeps adding a sample every 30 seconds.
Each run starts over from a fresh WORK_DIR/sample.sqlite3.
"""

from __future__ import annotations

import argparse
import math
import os
import random
import time
from dataclasses import dataclass
from pathlib import Path

from .collector import CollectionResult, DiskResult, DiskStat, GPUStat, ProcessStat, SystemStat
from .config import Settings
from .database import Database
from .publish import build_files, public_disks, public_roster, write_files


LIVE_INTERVAL_SECONDS = 30
HISTORY_INTERVAL_SECONDS = 600
RECENT_SECONDS = 48 * 3600
GPU_NAME = "NVIDIA RTX PRO 6000 Blackwell Server Edition"
GPU_MEMORY_MB = 97887.0
GPU_POWER_LIMIT_W = 600.0
GPUS_PER_HOST = 8
# Host name, how often jobs start there relative to the others, CPU count and RAM.
HOSTS = (
    ("brezel", 1.6, 128, 1024 * 1024),
    ("toast", 0.6, 64, 512 * 1024),
    ("croissant", 1.0, 96, 768 * 1024),
)
# Each host is unreachable now and then: about every 10 days, for 40 minutes on average.
OUTAGE_EVERY_SECONDS = 10 * 86400
OUTAGE_MEAN_SECONDS = 40 * 60
# Share of /scratch1 and /scratch2 in use per host.
DISK_USE = {
    "brezel": (0.72, 0.69),
    "toast": (0.21, 0.88),
    "croissant": (0.08, 0.96),
}
SCRATCH_DISK_BYTES = 15_238_728_286_208
# How much of a disk's use its last per-user count found, where it is not 99%:
# short on one disk (files written since), over on another (files deleted since).
USAGE_COUNTED = {("croissant", "/scratch1"): 0.8, ("toast", "/scratch2"): 1.04}
USERS = ("alice", "bob", "carol", "dave", "erin", "frank", "grace")
USER_WEIGHTS = (6, 4, 3, 2, 2, 1, 1)
# Login accounts per host: heidi has accounts but runs nothing, and grace has
# none on toast.
SIMULATED_ACCOUNTS = {
    "brezel": (*USERS, "heidi"),
    "toast": (*(user for user in USERS if user != "grace"), "heidi"),
    "croissant": (*USERS, "heidi"),
}


@dataclass(frozen=True)
class Job:
    username: str
    pid: int
    memory_mb: float
    load: float
    ends_at: int
    cpu_percent: float
    ram_mb: float
    started_at: int = 0
    # A notebook left holding its GPU: memory taken, next to no compute.
    idle: bool = False


# GPUs that report a thermal slowdown when they run hot, to show health problems.
THROTTLED_GPUS = {("brezel", 5)}


class SimulatedHost:
    def __init__(self, name: str, activity: float, cpu_count: int, ram_mb: float) -> None:
        self.name = name
        self.activity = activity
        self.cpu_count = cpu_count
        self.ram_mb = ram_mb
        self.random = random.Random(name)
        self.jobs: list[Job | None] = [None] * GPUS_PER_HOST
        self.next_pid = 4000
        self.down_until = 0

    def _maybe_start_jobs(self, now: int, seconds: int) -> None:
        daytime = 9 <= time.localtime(now).tm_hour < 23
        # Mean idle time per free GPU: about an hour by day, four at night.
        rate = self.activity / 3600 * (1 if daytime else 0.25)
        start_probability = 1 - math.exp(-rate * seconds)
        for index in range(GPUS_PER_HOST):
            if self.jobs[index] is not None or self.random.random() >= start_probability:
                continue
            free = [i for i in range(index, GPUS_PER_HOST) if self.jobs[i] is None]
            size = min(len(free), self.random.choice((1, 1, 2, 4)))
            duration = min(3 * 86400, max(900, self.random.expovariate(1 / (6 * 3600))))
            job = Job(
                username=self.random.choices(USERS, USER_WEIGHTS)[0],
                pid=self.next_pid,
                memory_mb=self.random.uniform(0.25, 0.95) * GPU_MEMORY_MB,
                load=self.random.uniform(55, 99),
                ends_at=now + int(duration),
                # Data loading and host-side work, for every GPU the job holds.
                cpu_percent=self.random.uniform(1.5, 6) * size,
                ram_mb=self.random.uniform(16, 64) * 1024 * size,
                started_at=now,
                idle=self.random.random() < 0.12,
            )
            self.next_pid += 10
            for gpu_index in free[:size]:
                self.jobs[gpu_index] = job

    def disks(self, now: int) -> DiskResult:
        size = SCRATCH_DISK_BYTES
        disks = tuple(
            DiskStat(mount, size, round(size * share), size - round(size * share))
            for mount, share in zip(("/scratch1", "/scratch2"), DISK_USE[self.name])
        )
        return DiskResult(
            self.name,
            now,
            True,
            disks,
            accounts=tuple(sorted(SIMULATED_ACCOUNTS[self.name])),
            usage=self.usage(disks, now),
        )

    def usage(self, disks: tuple[DiskStat, ...], now: int) -> dict:
        """A scratch-usage summary counted an hour ago: each disk's use split
        unevenly among the accounts, plus root's lost+found. Some disks are
        counted a little short or over, as files come and go between counts."""
        mounts = {}
        for disk in disks:
            counted = disk.used_bytes * USAGE_COUNTED.get((self.name, disk.mount), 0.99)
            weights = [self.random.paretovariate(1.2) for _ in SIMULATED_ACCOUNTS[self.name]]
            folders = [
                {"owner": user, "bytes": round(counted * weight / sum(weights))}
                for user, weight in zip(SIMULATED_ACCOUNTS[self.name], weights)
            ]
            mounts[disk.mount] = [*folders, {"owner": "root", "bytes": 16384}]
        return {"checked_at": now - 3600, "mounts": mounts}

    def sample(self, now: int, seconds: int) -> CollectionResult:
        if now >= self.down_until and self.random.random() < 1 - math.exp(-seconds / OUTAGE_EVERY_SECONDS):
            self.down_until = now + max(120, int(self.random.expovariate(1 / OUTAGE_MEAN_SECONDS)))
        if now < self.down_until:
            return CollectionResult(
                host=self.name,
                sampled_at=now,
                duration_ms=12000,
                success=False,
                error=f"ssh: connect to host {self.name} port 22: Connection timed out",
            )
        self.jobs = [job if job and job.ends_at > now else None for job in self.jobs]
        self._maybe_start_jobs(now, seconds)
        gpus: list[GPUStat] = []
        processes: list[ProcessStat] = []
        for index, job in enumerate(self.jobs):
            uuid = f"GPU-{self.name}-{index}"
            utilization = memory = 0.0
            if job is not None:
                # Mostly near the job's typical load, with occasional input stalls.
                utilization = (
                    self.random.uniform(0, 2)
                    if job.idle
                    else self.random.uniform(0, 25)
                    if self.random.random() < 0.06
                    else min(100, max(0, self.random.gauss(job.load, 6)))
                )
                memory = job.memory_mb * self.random.uniform(0.97, 1.0)
                processes.append(
                    ProcessStat(
                        uuid,
                        job.pid + index,
                        job.username,
                        "python",
                        round(memory),
                        elapsed_seconds=now - job.started_at if job.started_at else None,
                    )
                )
            gpus.append(
                GPUStat(
                    index=index,
                    uuid=uuid,
                    name=GPU_NAME,
                    utilization=round(utilization),
                    memory_used_mb=round(memory),
                    memory_total_mb=GPU_MEMORY_MB,
                    temperature_c=round(30 + utilization * 0.56 + self.random.uniform(-1.5, 1.5)),
                    power_w=round(38 + utilization * 5.2 + self.random.uniform(-4, 4), 2),
                    power_limit_w=GPU_POWER_LIMIT_W,
                    clock_events=0x20 if (self.name, index) in THROTTLED_GPUS and utilization > 70 else 0,
                    ecc_uncorrected=0,
                    rows_remap_pending=False,
                    rows_remap_failed=False,
                )
            )
        jobs = {id(job): job for job in self.jobs if job is not None}.values()
        cpu_percent = 2 + sum(job.cpu_percent for job in jobs) + self.random.gauss(0, 1.5)
        ram_used_mb = 12 * 1024 + sum(job.ram_mb for job in jobs) * self.random.uniform(0.98, 1.0)
        # Per user, CPU as a percent of one core, as top counts it.
        people: dict[str, dict] = {"root": {"user": "root", "cpu_percent": 30.0, "memory_mb": 6144.0}}
        for job in jobs:
            person = people.setdefault(job.username, {"user": job.username, "cpu_percent": 0.0, "memory_mb": 0.0})
            person["cpu_percent"] = round(person["cpu_percent"] + job.cpu_percent * self.cpu_count, 1)
            person["memory_mb"] = round(person["memory_mb"] + job.ram_mb, 1)
        return CollectionResult(
            host=self.name,
            sampled_at=now,
            duration_ms=self.random.randint(1150, 1400),
            success=True,
            gpus=tuple(gpus),
            processes=tuple(processes),
            system=SystemStat(
                cpu_percent=round(min(100, max(0, cpu_percent)), 1),
                cpu_count=self.cpu_count,
                memory_used_mb=round(min(ram_used_mb, self.ram_mb), 1),
                memory_total_mb=self.ram_mb,
                memory_cache_mb=round((self.ram_mb - min(ram_used_mb, self.ram_mb)) * 0.6, 1),
                swap_used_mb=round(8192 * min(1.0, ram_used_mb / self.ram_mb * 1.4), 1),
                swap_total_mb=8192.0,
                load_averages=tuple(
                    round(self.cpu_count * cpu_percent / 100 * factor, 2) for factor in (1.0, 0.95, 0.9)
                ),
                uptime_seconds=31 * 86400 + 4 * 3600,
                cpu_model="AMD EPYC 9555 64-Core Processor",
                cpu_sockets=2,
                cpu_cores=self.cpu_count,
                users=tuple(sorted(people.values(), key=lambda person: person["memory_mb"], reverse=True)),
            ),
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Simulated GPU servers for previewing /top")
    parser.add_argument("work_dir", type=Path)
    parser.add_argument("--days", type=int, default=35, help="days of history to simulate")
    parser.add_argument("--live", action="store_true", help="keep adding a sample every 30 s")
    args = parser.parse_args()

    args.work_dir.mkdir(parents=True, exist_ok=True)
    database_path = args.work_dir / "sample.sqlite3"
    for suffix in ("", "-wal", "-shm"):
        Path(f"{database_path}{suffix}").unlink(missing_ok=True)
    settings = Settings(
        host=None,
        remote_hosts=tuple(host[0] for host in HOSTS),
        database_path=database_path,
        interval_seconds=LIVE_INTERVAL_SECONDS,
    )
    hosts = [SimulatedHost(*host) for host in HOSTS]

    def advance(database: Database, start: int, end: int, step: int) -> None:
        database.save_many(
            host.sample(moment, step) for moment in range(start, end, step) for host in hosts
        )

    def publish(database: Database) -> None:
        files = build_files(settings, database)
        files["disks"] = public_disks(settings, database)
        files["roster"] = public_roster(settings, database)
        write_files(files, args.work_dir / "files")

    print(f"servermonitor.sample: simulating {args.days} days of usage…", flush=True)
    now = int(time.time())
    recent_start = now - RECENT_SECONDS
    # Older history only feeds the hourly sums, so it is sampled coarsely; each
    # Database credits users with up to twice its own interval per sample.
    history = Database(database_path, interval_seconds=HISTORY_INTERVAL_SECONDS)
    history.initialize()
    advance(history, now - args.days * 86400, recent_start, HISTORY_INTERVAL_SECONDS)
    database = Database(database_path, interval_seconds=LIVE_INTERVAL_SECONDS)
    advance(database, recent_start, now + 1, LIVE_INTERVAL_SECONDS)
    database.cleanup(settings.rollup_retention_days)
    for host in hosts:
        database.save_disks(host.disks(now))
    publish(database)
    print(f"servermonitor.sample: published to {args.work_dir / 'files'}", flush=True)

    if not args.live:
        return
    print("servermonitor.sample: adding a sample every 30 s (Ctrl+C to stop)", flush=True)
    parent = os.getppid()
    try:
        # Stop with whatever started us (e.g. the Vite dev server), never orphaned.
        while os.getppid() == parent:
            time.sleep(LIVE_INTERVAL_SECONDS - time.time() % LIVE_INTERVAL_SECONDS)
            moment = int(time.time())
            advance(database, moment, moment + 1, LIVE_INTERVAL_SECONDS)
            publish(database)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
