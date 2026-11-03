import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from verify import compare_readback, summary_errors, isolated_dsn


class RestoreVerificationTests(unittest.TestCase):
    def setUp(self):
        self.readback = {
            "matterCount": 2,
            "objectsChecked": 3,
            "objectFailures": 0,
            "matter-A": {"history": ["created", "reviewed"], "object": "digest-A"},
            "matter-B": {"history": ["created"], "object": "digest-B"},
        }
        self.summary = {
            "census": "IDENTICAL",
            "objects": "IDENTICAL",
            "marker_in_source": "1",
            "marker_in_restore": "0",
            "readback_restored_vs_source": "IDENTICAL",
            "readback_after_restart": "IDENTICAL",
            "altered_object_readback_exit": 1,
            "missing_object": "DETECTED",
            "archive_refusals": {
                "corrupt": {"exit": 1, "tables_left": 0},
                "truncated": {"exit": 1, "tables_left": 0},
            },
        }

    def test_identical_boundary_readback_passes(self):
        self.assertTrue(compare_readback(self.readback, copy.deepcopy(self.readback))[0])
        self.assertEqual(summary_errors(self.summary), [])

    def test_lost_matter_cannot_be_excused_as_a_post_boundary_marker(self):
        restored = copy.deepcopy(self.readback)
        del restored["matter-B"]
        restored["matterCount"] = 1
        ok, differences = compare_readback(self.readback, restored)
        self.assertFalse(ok)
        self.assertEqual(differences["missing_matters"], ["matter-B"])

    def test_equal_counts_cannot_hide_replaced_matter_or_changed_provenance(self):
        for mode in ("replace", "history", "object"):
            with self.subTest(mode=mode):
                restored = copy.deepcopy(self.readback)
                if mode == "replace":
                    restored["marker"] = restored.pop("matter-B")
                elif mode == "history":
                    restored["matter-A"]["history"].pop()
                else:
                    restored["matter-A"]["object"] = "wrong-digest"
                self.assertFalse(compare_readback(self.readback, restored)[0])

    def test_malformed_or_inconsistent_counts_fail_closed(self):
        for value in (True, "2", -1, 3):
            with self.subTest(value=value), self.assertRaises(ValueError):
                restored = copy.deepcopy(self.readback)
                restored["matterCount"] = value
                compare_readback(self.readback, restored)

    def test_every_required_failure_prevents_summary_acceptance(self):
        for key in self.summary:
            with self.subTest(key=key):
                summary = copy.deepcopy(self.summary)
                del summary[key]
                self.assertTrue(summary_errors(summary))
        for key in ("census", "objects", "readback_restored_vs_source", "readback_after_restart"):
            with self.subTest(key=key):
                summary = copy.deepcopy(self.summary)
                summary[key] = "DIFFERENT"
                self.assertIn(key, summary_errors(summary))

    def test_unproved_corruption_refusal_or_object_detection_fails(self):
        for value in (0, True, "1"):
            with self.subTest(value=value):
                summary = copy.deepcopy(self.summary)
                summary["archive_refusals"]["corrupt"]["exit"] = value
                self.assertTrue(summary_errors(summary))
                summary = copy.deepcopy(self.summary)
                summary["altered_object_readback_exit"] = value
                self.assertTrue(summary_errors(summary))
        summary = copy.deepcopy(self.summary)
        summary["archive_refusals"]["truncated"]["tables_left"] = 1
        self.assertTrue(summary_errors(summary))

    def test_cli_exit_status_is_the_acceptance_verdict(self):
        with tempfile.TemporaryDirectory() as directory:
            evidence = Path(directory) / "summary.json"
            command = [sys.executable, str(Path(__file__).with_name("verify.py")), "summary", str(evidence)]
            evidence.write_text(json.dumps(self.summary))
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, 0)
            self.summary["census"] = "DIFFERENT"
            evidence.write_text(json.dumps(self.summary))
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, 1)
            evidence.write_text("{")
            self.assertEqual(subprocess.run(command, capture_output=True).returncode, 1)



class IsolatedDSNTests(unittest.TestCase):
    def test_replaces_database_with_and_without_query(self):
        for query in ("", "?sslmode=disable"):
            base = "postgres://user:synthetic@127.0.0.1:55442/base" + query
            self.assertEqual(isolated_dsn(base, "mc_rr_src_new"), "postgres://user:synthetic@127.0.0.1:55442/mc_rr_src_new" + query)

    def test_refuses_remote_or_ambiguous_targets(self):
        for base in ("postgres://u:p@remote/base", "postgres://u:p@127.0.0.1/base?dbname=base", "postgres://u:p@127.0.0.1/base?%64bname=base", "postgres://u:p@127.0.0.1/base#fragment", "postgres://u:p@127.0.0.1/base?host=remote", "postgres://u:p@127.0.0.1/base\n"):
            with self.assertRaises(ValueError):
                isolated_dsn(base, "mc_rr_dst_new")
        with self.assertRaises(ValueError):
            isolated_dsn("postgres://u:p@127.0.0.1/base", "other/name")

if __name__ == "__main__":
    unittest.main()
