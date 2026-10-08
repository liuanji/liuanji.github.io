# scratch-usage

Measures how much each top-level folder of `/scratch1` and `/scratch2` uses
(each user keeps their files in `/scratchN/<user>`), every 2 hours, and writes
a world-readable summary to `/var/lib/scratch-usage/usage.json` for the GPU
monitor to show per-user storage.

It must run as root, since most users' folders are private. It runs `du`,
which only reads file sizes and directory listings (no file contents, no
writes beyond directory access times), at the lowest CPU priority. After the
first run the servers' memory caches most of this, so later runs mostly avoid
the disks.

| File | Installed as |
| --- | --- |
| `scratch-usage.py` | `/usr/local/bin/scratch-usage` |
| `scratch-usage.service` | `/etc/systemd/system/scratch-usage.service` (one measurement) |
| `scratch-usage.timer` | `/etc/systemd/system/scratch-usage.timer` (10 min after boot, then every 2 h) |

## Install (on each server: brezel, croissant, toast)

Copy the folder to the server, e.g. from the jump machine:

```bash
scp -r servermonitor/deploy/scratch-usage brezel:/tmp/
```

Then, on the server, from an account with sudo:

```bash
cd /tmp/scratch-usage
sudo install -m 0755 scratch-usage.py /usr/local/bin/scratch-usage
sudo install -m 0644 scratch-usage.service scratch-usage.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now scratch-usage.timer      # runs at every boot from now on
sudo systemctl start --no-block scratch-usage.service  # first measurement right away
```

The first run walks every file once and can take a few minutes.

## Check

```bash
systemctl list-timers scratch-usage.timer   # next and last run
journalctl -u scratch-usage -n 5            # "scratch-usage: /scratch1: 12 folders in 41.2 s, ..."
cat /var/lib/scratch-usage/usage.json
```

## Update or remove

To update, repeat the two `install` lines and `sudo systemctl daemon-reload`.
To remove:

```bash
sudo systemctl disable --now scratch-usage.timer
sudo rm /etc/systemd/system/scratch-usage.{service,timer} /usr/local/bin/scratch-usage
sudo rm -r /var/lib/scratch-usage
sudo systemctl daemon-reload
```
