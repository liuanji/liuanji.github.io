#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
mkdir -p "$project_dir/data"
cd "$project_dir"

exec /usr/bin/flock -n "$project_dir/data/servermonitor.lock" \
    "${GPU_MONITOR_PYTHON:-/usr/bin/python3}" -m servermonitor serve >/dev/null 2>&1
