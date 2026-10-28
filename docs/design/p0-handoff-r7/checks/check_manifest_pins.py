#!/usr/bin/env python3
"""Check that all 38 manifest inputs match exact bytes and SHA-256."""
import json
import hashlib
import os
import sys

manifest_path = "/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/p0-design-consolidated-inputs-20261027.json"
base_dir = "/Users/nguyenvanlan/Documents/code/pet-projects/matter-control"

if not os.path.exists(manifest_path):
    print(f"FAIL: Manifest not found at {manifest_path}", file=sys.stderr)
    sys.exit(1)

with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

pins = manifest.get("inputs", [])
print(f"Loaded {len(pins)} input pins from manifest.")

mismatches = []
for p in pins:
    rel_path = p["path"]
    expected_bytes = p["bytes"]
    expected_sha = p["sha256"]
    full_path = os.path.join(base_dir, rel_path)
    
    if not os.path.exists(full_path):
        mismatches.append(f"MISSING: {rel_path}")
        continue
        
    with open(full_path, "rb") as f:
        content = f.read()
        actual_bytes = len(content)
        actual_sha = hashlib.sha256(content).hexdigest()
        
    if actual_bytes != expected_bytes or actual_sha != expected_sha:
        mismatches.append(f"MISMATCH: {rel_path} (expected {expected_bytes}B/{expected_sha[:8]}, got {actual_bytes}B/{actual_sha[:8]})")

if mismatches:
    print(f"FAIL: {len(mismatches)} pin mismatches found:", file=sys.stderr)
    for m in mismatches:
        print("  " + m, file=sys.stderr)
    sys.exit(1)

print(f"PASS: All {len(pins)} manifest input pins verified matching exact bytes and SHA-256.")
