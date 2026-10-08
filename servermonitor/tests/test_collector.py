import unittest
from subprocess import CompletedProcess
from unittest.mock import patch

from servermonitor.collector import (
    LocalCollector,
    SSHCollector,
    parse_accounts,
    parse_collector_output,
    parse_df_output,
)


SAMPLE_OUTPUT = """__SERVERMONITOR_GPUS__
0, GPU-aaa, NVIDIA RTX PRO 6000, 97, 30701, 97887, 63, 514.29, 600.00
1, GPU-bbb, NVIDIA RTX PRO 6000, 0, 4, 97887, 29, [N/A], [N/A]
__SERVERMONITOR_APPS__
GPU-aaa, 1234, /usr/bin/python, 30000
GPU-aaa, 5678, python, 700
__SERVERMONITOR_USERS__
   1234 alice
   5678 bob
"""


DF_OUTPUT = """Filesystem           1-blocks           Used     Available Capacity Mounted on
/dev/nvme2n1p1 15238728286208 10287580110848 4183083978752      72% /scratch1
/dev/nvme1n1p1 15238728286208  9953547710464 4517116379136      69% /scratch2
/dev/nvme2n1p1 15238728286208 10287580110848 4183083978752      72% /scratch1
"""


class DiskParserTest(unittest.TestCase):
    def test_parses_each_mount_once(self) -> None:
        disks = parse_df_output(DF_OUTPUT)

        self.assertEqual([disk.mount for disk in disks], ["/scratch1", "/scratch2"])
        self.assertEqual(disks[0].used_bytes, 10287580110848)
        self.assertEqual(disks[0].available_bytes, 4183083978752)

    def test_no_rows_is_an_error(self) -> None:
        with self.assertRaisesRegex(ValueError, "no disks"):
            parse_df_output("Filesystem 1-blocks Used Available Capacity Mounted on\n")


class AccountTest(unittest.TestCase):
    def test_parses_sorted_unique_usernames(self) -> None:
        self.assertEqual(parse_accounts("\nbob\nalice\nbob\n-rf\nnot a name\n"), ("alice", "bob"))

    def test_disk_check_returns_disks_and_accounts(self) -> None:
        output = DF_OUTPUT + "__SERVERMONITOR_ACCOUNTS__\nalice\nbob\n"
        with patch("subprocess.run", return_value=CompletedProcess([], 0, output, "")):
            result = SSHCollector().collect_disks("brezel")

        self.assertTrue(result.success)
        self.assertEqual(len(result.disks), 2)
        self.assertEqual(result.accounts, ("alice", "bob"))

    def test_disk_check_reads_the_usage_summary(self) -> None:
        summary = '{"checked_at": 5, "duration_seconds": 1.0, "mounts": [{"mount": "/scratch1", "errors": 0, "folders": [{"name": "alice", "owner": "alice", "bytes": 42}]}]}'
        output = DF_OUTPUT + "__SERVERMONITOR_ACCOUNTS__\nalice\n__SERVERMONITOR_USAGE__\n" + summary + "\n"
        with patch("subprocess.run", return_value=CompletedProcess([], 0, output, "")):
            result = SSHCollector().collect_disks("brezel")

        self.assertEqual(result.accounts, ("alice",))
        self.assertEqual(result.usage, {"checked_at": 5, "mounts": {"/scratch1": [{"owner": "alice", "bytes": 42}]}})

    def test_missing_or_broken_usage_summary_is_none(self) -> None:
        for tail in ("", "{not json", '{"mounts": []}'):
            output = DF_OUTPUT + "__SERVERMONITOR_ACCOUNTS__\nalice\n__SERVERMONITOR_USAGE__\n" + tail
            with patch("subprocess.run", return_value=CompletedProcess([], 0, output, "")):
                result = SSHCollector().collect_disks("brezel")
            self.assertTrue(result.success)
            self.assertIsNone(result.usage)
            self.assertEqual(result.accounts, ("alice",))

    def test_accounts_survive_a_host_without_disks(self) -> None:
        with patch("subprocess.run", return_value=CompletedProcess([], 0, "__SERVERMONITOR_ACCOUNTS__\nalice\n", "")):
            result = SSHCollector().collect_disks("brezel")

        self.assertFalse(result.success)
        self.assertEqual(result.accounts, ("alice",))


class CollectorParserTest(unittest.TestCase):
    def test_parses_gpus_processes_and_users(self) -> None:
        result = parse_collector_output("brezel", SAMPLE_OUTPUT, 1_700_000_000, 123)

        self.assertTrue(result.success)
        self.assertEqual(len(result.gpus), 2)
        self.assertEqual(result.gpus[0].index, 0)
        self.assertEqual(result.gpus[0].utilization, 97)
        self.assertIsNone(result.gpus[1].power_w)
        self.assertEqual(result.gpus[0].power_limit_w, 600)
        self.assertIsNone(result.gpus[1].power_limit_w)
        self.assertEqual([process.username for process in result.processes], ["alice", "bob"])
        self.assertEqual(result.processes[0].used_memory_mb, 30000)

    def test_parses_job_ages_health_and_people(self) -> None:
        output = SAMPLE_OUTPUT.replace("   1234 alice\n", "   1234 alice  7200\n") + (
            "__SERVERMONITOR_HEALTH__\n"
            "0, 0x0000000000000044, 2, No, Yes\n"
            "1, [N/A], [N/A], [N/A], [N/A]\n"
            "__SERVERMONITOR_PEOPLE__\n"
            "alice 350.5 4194304\n"
            "root 1.0 102400\n"
            "__SERVERMONITOR_SYSTEM__\n"
            "cpu  100 0 100 800 0 0 0 0\n"
            "cpu  200 0 200 1600 0 0 0 0\n"
            "MemTotal: 8192000 kB\nMemAvailable: 4096000 kB\n"
        )
        result = parse_collector_output("brezel", output, 1_700_000_000, 123)

        self.assertEqual([process.elapsed_seconds for process in result.processes], [7200, None])
        self.assertEqual(result.gpus[0].clock_events, 0x44)
        self.assertEqual(result.gpus[0].ecc_uncorrected, 2)
        self.assertTrue(result.gpus[0].rows_remap_failed)
        self.assertIsNone(result.gpus[1].clock_events)
        self.assertEqual(result.system.users[0], {"user": "alice", "cpu_percent": 350.5, "memory_mb": 4096.0})

    def test_parses_cpu_load_and_memory(self) -> None:
        output = SAMPLE_OUTPUT + (
            "__SERVERMONITOR_SYSTEM__\n"
            "cpu  1000 0 1000 7000 1000 0 0 0 0 0\n"
            "cpu  1300 0 1200 7400 1100 0 0 0 0 0\n"
            "MemTotal:       1048576 kB\n"
            "MemAvailable:    786432 kB\n"
            "Buffers:          10240 kB\n"
            "Cached:          512000 kB\n"
            "SwapTotal:        8192 kB\n"
            "SwapFree:         2048 kB\n"
            "128\n"
            "5.39 5.17 5.13 5/6604 707676\n"
            "uptime 2692648.60\n"
            "model name\t: AMD EPYC 9555 64-Core Processor\n"
            "sockets 2\n"
            "cores 128\n"
        )

        system = parse_collector_output("brezel", output, 1_700_000_000, 123).system

        # 1000 ticks passed, of which 400 idle and 100 iowait.
        self.assertEqual(system.cpu_percent, 50.0)
        self.assertEqual(system.cpu_count, 128)
        self.assertEqual(system.memory_total_mb, 1024)
        self.assertEqual(system.memory_used_mb, 256)
        self.assertEqual(system.memory_cache_mb, 510)
        self.assertEqual((system.swap_used_mb, system.swap_total_mb), (6, 8))
        self.assertEqual(system.load_averages, (5.39, 5.17, 5.13))
        self.assertEqual(system.uptime_seconds, 2692649)
        self.assertEqual(system.cpu_model, "AMD EPYC 9555 64-Core Processor")
        self.assertEqual((system.cpu_sockets, system.cpu_cores), (2, 128))

    def test_system_extras_are_optional(self) -> None:
        output = SAMPLE_OUTPUT + (
            "__SERVERMONITOR_SYSTEM__\n"
            "cpu  1000 0 1000 7000 1000 0 0 0 0 0\n"
            "cpu  1300 0 1200 7400 1100 0 0 0 0 0\n"
            "uptime \n"
        )

        system = parse_collector_output("brezel", output, 1_700_000_000, 123).system

        self.assertEqual(system.cpu_percent, 50.0)
        self.assertIsNone(system.load_averages)
        self.assertIsNone(system.uptime_seconds)
        self.assertIsNone(system.swap_total_mb)
        self.assertIsNone(system.cpu_sockets)

    def test_system_is_optional(self) -> None:
        self.assertIsNone(parse_collector_output("brezel", SAMPLE_OUTPUT, 1, 1).system)
        partial = SAMPLE_OUTPUT + "__SERVERMONITOR_SYSTEM__\n\ncpu  1 2 3 4 5 6 7 8 0 0\n"
        self.assertIsNone(parse_collector_output("brezel", partial, 1, 1).system)

    def test_rejects_output_without_gpu_rows(self) -> None:
        with self.assertRaisesRegex(ValueError, "no GPU rows"):
            parse_collector_output("toast", "", 1_700_000_000, 2)

    @patch("servermonitor.collector.subprocess.run")
    def test_local_collector_does_not_invoke_ssh(self, run) -> None:
        run.return_value = CompletedProcess(["sh", "-s"], 0, SAMPLE_OUTPUT, "")

        result = LocalCollector().collect("brezel")

        self.assertTrue(result.success)
        self.assertEqual(run.call_args.args[0], ["sh", "-s"])

    @patch("servermonitor.collector.subprocess.run")
    def test_ssh_collector_uses_batch_mode(self, run) -> None:
        run.return_value = CompletedProcess(["ssh"], 0, SAMPLE_OUTPUT, "")

        result = SSHCollector(timeout_seconds=7).collect("toast")

        self.assertTrue(result.success)
        self.assertEqual(result.host, "toast")
        self.assertEqual(
            run.call_args.args[0],
            [
                "ssh",
                "-T",
                "-o",
                "BatchMode=yes",
                "-o",
                "ConnectTimeout=7",
                "toast",
                "sh",
                "-s",
            ],
        )


if __name__ == "__main__":
    unittest.main()
