#!/usr/bin/env python3
"""Hash every file of a directory tree into a JSON manifest (path/bytes/sha256).
Usage: hash-tree.py <root> <out.json> <recorded_utc> <identity>"""
import hashlib
import json
import sys
from pathlib import Path


def sha256_file(p: Path):
    h = hashlib.sha256()
    n = 0
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            n += len(chunk)
            h.update(chunk)
    return n, h.hexdigest()


def main():
    root = Path(sys.argv[1]).resolve()
    out = Path(sys.argv[2])
    recorded = sys.argv[3]
    identity = sys.argv[4]
    items = []
    total_bytes = 0
    for p in sorted(root.rglob("*")):
        rel = str(p.relative_to(root))
        if p.is_symlink():
            items.append({"path": rel, "type": "symlink", "target": str(p.readlink())})
            continue
        if p.is_dir():
            continue
        n, h = sha256_file(p)
        items.append({"path": rel, "bytes": n, "sha256": h})
        total_bytes += n
    report = {
        "root": str(root),
        "identified_by": identity,
        "recorded_utc": recorded,
        "file_count": len(items),
        "byte_total": total_bytes,
        "items": items,
    }
    out.write_text(json.dumps(report, indent=1) + "\n")
    print(json.dumps({"out": str(out), "file_count": len(items), "byte_total": total_bytes}))


if __name__ == "__main__":
    main()
