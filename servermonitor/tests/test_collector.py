import unittest
from subprocess import CompletedProcess
from unittest.mock import patch

from servermonitor.collector import LocalCollector, SSHCollector, parse_collector_output


SAMPLE_OUTPUT = """__SERVERMONITOR_GPUS__
0, GPU-aaa, NVIDIA RTX PRO 6000, 97, 30701, 97887, 63, 514.29
1, GPU-bbb, NVIDIA RTX PRO 6000, 0, 4, 97887, 29, [N/A]
__SERVERMONITOR_APPS__
GPU-aaa, 1234, /usr/bin/python, 30000
GPU-aaa, 5678, python, 700
__SERVERMONITOR_USERS__
   1234 alice
   5678 bob
"""


class CollectorParserTest(unittest.TestCase):
    def test_parses_gpus_processes_and_users(self) -> None:
        result = parse_collector_output("brezel", SAMPLE_OUTPUT, 1_700_000_000, 123)

        self.assertTrue(result.success)
        self.assertEqual(len(result.gpus), 2)
        self.assertEqual(result.gpus[0].index, 0)
        self.assertEqual(result.gpus[0].utilization, 97)
        self.assertIsNone(result.gpus[1].power_w)
        self.assertEqual([process.username for process in result.processes], ["alice", "bob"])
        self.assertEqual(result.processes[0].used_memory_mb, 30000)

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
