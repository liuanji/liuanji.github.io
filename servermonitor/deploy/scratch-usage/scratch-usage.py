#!/usr/bin/env python3
"""Measures how much space each top-level folder of the scratch disks uses.

Every user keeps their files in /scratchN/<user>, so a folder's size is
roughly that user's usage. Most folders are private, so this runs as root
(from scratch-usage.service, every 2 hours) and writes a world-readable
summary that the GPU monitor reads over SSH with its disk check:

    {"checked_at": 1791430000, "duration_seconds": 41.2,
     "mounts": [{"mount": "/scratch1", "errors": 0,
                 "folders": [{"name": "anji", "owner": "anji", "bytes": 123}]}]}

du only reads file sizes and directory listings, never file contents.

Usage: scratch-usage [MOUNT ...]   (default: /scratch1 /scratch2)
The output path is SCRATCH_USAGE_OUTPUT, by default
/var/lib/scratch-usage/usage.json.
"""

from __future__ import annotations

import json
import os
import pwd
import subprocess
import sys
import tempfile
import time
from pathlib import Path

DEFAULT_MOUNTS = ("/scratch1", "/scratch2")
DEFAULT_OUTPUT = "/var/lib/scratch-usage/usage.json"


def owner(path: str) -> str:
    uid = os.lstat(path).st_uid
    try:
        return pwd.getpwuid(uid).pw_name
    except KeyError:
        return str(uid)


def measure(mount: str) -> dict:
    """One du call per disk, so a file hard-linked into two folders counts once.
    -x stays on this disk, -B1 counts bytes actually allocated (as df does), and
    -0 ends each line with NUL, so any folder name parses safely."""
    names = sorted(entry.name for entry in os.scandir(mount))
    if not names:
        return {"mount": mount, "errors": 0, "folders": []}
    paths = [os.path.join(mount, name) for name in names]
    # du exits 1 when some files could not be read (e.g. deleted mid-scan) but
    # still reports every folder, so its output is used either way.
    completed = subprocess.run(
        ["du", "-s", "-x", "-B1", "-0", "--", *paths],
        capture_output=True,
        check=False,
    )
    sizes: dict[str, int] = {}
    for record in completed.stdout.split(b"\0"):
        size, _, path = record.partition(b"\t")
        if size.isdigit():
            sizes[os.fsdecode(path)] = int(size)
    folders = []
    for name, path in zip(names, paths):
        if path not in sizes:
            continue
        try:
            folder_owner = owner(path)
        except OSError:
            continue  # removed since the scan
        folders.append({"name": name, "owner": folder_owner, "bytes": sizes[path]})
    folders.sort(key=lambda folder: folder["bytes"], reverse=True)
    errors = sum(1 for line in completed.stderr.splitlines() if line.strip())
    return {"mount": mount, "errors": errors, "folders": folders}


def write_atomically(payload: dict, output: Path) -> None:
    """Readers never see a half-written file: write beside it, then rename."""
    output.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary = tempfile.mkstemp(dir=output.parent, prefix=".usage-", suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as file:
            json.dump(payload, file, separators=(",", ":"))
        os.chmod(temporary, 0o644)
        os.replace(temporary, output)
    except BaseException:
        Path(temporary).unlink(missing_ok=True)
        raise


def main() -> int:
    mounts = sys.argv[1:] or list(DEFAULT_MOUNTS)
    output = Path(os.environ.get("SCRATCH_USAGE_OUTPUT", DEFAULT_OUTPUT))
    started = time.monotonic()
    checked_at = int(time.time())
    results = []
    for mount in mounts:
        if not os.path.isdir(mount):
            print(f"scratch-usage: {mount} is not a directory, skipped", file=sys.stderr)
            continue
        results.append(measure(mount))
    write_atomically(
        {
            "checked_at": checked_at,
            "duration_seconds": round(time.monotonic() - started, 1),
            "mounts": results,
        },
        output,
    )
    summary = ", ".join(f"{item['mount']}: {len(item['folders'])} folders" for item in results)
    print(f"scratch-usage: {summary} in {time.monotonic() - started:.1f} s, written to {output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
