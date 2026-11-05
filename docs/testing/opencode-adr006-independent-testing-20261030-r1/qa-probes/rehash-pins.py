#!/usr/bin/env python3
"""QA probe: rehash preparation pins and every member of author manifests.

Sources of pins:
  1. docs/testing/opencode-adr006-test-plan-20261030-r1/input-pins.json        (paths relative to REPO)
  2. docs/testing/opencode-adr006-test-plan-20261030-r1/preparation-manifest.json (relative to REPO)
  3. docs/testing/codex-adr006-remediation-20261030-r1/source-manifest.json    (relative to REPO)
  4. docs/testing/codex-adr006-remediation-20261030-r1/outputs-manifest.json   (relative to its own dir)

Output: rehash-pins.json in the reviewer output dir (public: paths/hashes only).
"""
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(sys.argv[1]).resolve()
OUT = Path(sys.argv[2]).resolve()

SOURCES = [
    ("input-pins", REPO / "docs/testing/opencode-adr006-test-plan-20261030-r1/input-pins.json", REPO),
    ("preparation-manifest", REPO / "docs/testing/opencode-adr006-test-plan-20261030-r1/preparation-manifest.json", REPO),
    ("codex-source-manifest", REPO / "docs/testing/codex-adr006-remediation-20261030-r1/source-manifest.json", REPO),
    ("codex-outputs-manifest", REPO / "docs/testing/codex-adr006-remediation-20261030-r1/outputs-manifest.json",
     REPO / "docs/testing/codex-adr006-remediation-20261030-r1"),
]


def sha256_file(path: Path):
    h = hashlib.sha256()
    n = 0
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            n += len(chunk)
            h.update(chunk)
    return n, h.hexdigest()


def item_pin(item: dict):
    """Extract (relative_path, expected_bytes, expected_sha256) or None for non-file entries."""
    name = item.get("path") or item.get("file")
    if not isinstance(name, str) or not name:
        return None
    exp_bytes = item.get("bytes")
    if not isinstance(exp_bytes, int):
        exp_bytes = item.get("size_bytes")
    return str(name), exp_bytes, item.get("sha256")


def main():
    results = []
    skipped_nonfile = []
    for label, manifest_path, base in SOURCES:
        data = json.loads(manifest_path.read_text())
        items = data.get("items") or []
        for item in items:
            if not isinstance(item, dict):
                skipped_nonfile.append({"source": label, "item": repr(item)[:80]})
                continue
            pinned = item_pin(item)
            if pinned is None:
                skipped_nonfile.append({"source": label, "item": json.dumps(item)[:120]})
                continue
            rel, exp_bytes, exp_sha = pinned
            target = base / rel
            row = {
                "source": label,
                "path": rel,
                "expected_bytes": exp_bytes,
                "expected_sha256": exp_sha,
            }
            if not target.exists():
                row["match"] = "MISSING"
                results.append(row)
                continue
            try:
                obs_bytes, obs_sha = sha256_file(target)
            except Exception as exc:  # unreadable file
                row["match"] = f"UNREADABLE ({type(exc).__name__})"
                results.append(row)
                continue
            row["observed_bytes"] = obs_bytes
            row["observed_sha256"] = obs_sha
            sha_ok = (exp_sha is None) or (obs_sha == exp_sha)
            bytes_ok = (exp_bytes is None) or (obs_bytes == exp_bytes)
            row["match"] = "OK" if (sha_ok and bytes_ok) else "MISMATCH"
            results.append(row)

    counts = {}
    for r in results:
        counts[r["match"]] = counts.get(r["match"], 0) + 1
    report = {
        "probe": "rehash-pins",
        "probe_identity": "OpenCode independent QA",
        "recorded_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "manifests": [{"label": s[0], "manifest_path": str(s[1].relative_to(REPO))} for s in SOURCES],
        "totals": {"pin_rows": len(results), "skipped_nonfile_entries": len(skipped_nonfile), "match_counts": counts},
        "skipped_nonfile_entries": skipped_nonfile,
        "rows": results,
    }
    out_path = OUT / "rehash-pins.json"
    out_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"out": str(out_path), "totals": report["totals"]}))


if __name__ == "__main__":
    main()
