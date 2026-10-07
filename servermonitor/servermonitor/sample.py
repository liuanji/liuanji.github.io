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

from .collector import CollectionResult, GPUStat, ProcessStat, SystemStat
from .config import Settings
from .database import Database
from .publish import build_files, write_files


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
USERS = ("alice", "bob", "carol", "dave", "erin", "frank", "grace")
USER_WEIGHTS = (6, 4, 3, 2, 2, 1, 1)


@dataclass(frozen=True)
class Job:
    username: str
    pid: int
    memory_mb: float
    load: float
    ends_at: int
    cpu_percent: float
    ram_mb: float


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
            )
            self.next_pid += 10
            for gpu_index in free[:size]:
                self.jobs[gpu_index] = job

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
                    self.random.uniform(0, 25)
                    if self.random.random() < 0.06
                    else min(100, max(0, self.random.gauss(job.load, 6)))
                )
                memory = job.memory_mb * self.random.uniform(0.97, 1.0)
                processes.append(
                    ProcessStat(uuid, job.pid + index, job.username, "python", round(memory))
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
                )
            )
        jobs = {id(job): job for job in self.jobs if job is not None}.values()
        cpu_percent = 2 + sum(job.cpu_percent for job in jobs) + self.random.gauss(0, 1.5)
        ram_used_mb = 12 * 1024 + sum(job.ram_mb for job in jobs) * self.random.uniform(0.98, 1.0)
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
        write_files(build_files(settings, database), args.work_dir / "files")

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
