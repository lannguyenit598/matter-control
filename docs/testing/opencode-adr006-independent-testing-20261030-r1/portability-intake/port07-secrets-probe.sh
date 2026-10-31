#!/bin/bash
# OpenCode independent QA — PORT-07: rendered fetch-secrets.sh boundary probe.
# Extracts the ACTUAL rendered /etc/mattercontrol/fetch-secrets.sh from
# portability-intake/renders/compute-engine/cloud-init.yaml, records every
# adaptation, and drives the script against a STUBBED fetch boundary:
#   ok / fail-on-4th-fetch / empty-3rd-value / stale-after-failure
# No root-path writes, no metadata calls, no real Secret Manager access.
set -uo pipefail

REPO=/Users/nguyenvanlan/Documents/code/pet-projects/matter-control
BASE="$REPO/docs/testing/opencode-adr006-independent-testing-20261030-r1/portability-intake"
RENDER="$BASE/renders/compute-engine/cloud-init.yaml"
SCRATCH=/private/tmp/mc-opencode-adr006-qa-secrets-20261030
rm -rf "$SCRATCH"; mkdir -p "$SCRATCH/bin" "$SCRATCH/run"

# --- 1. extract the rendered script verbatim (8/6-space YAML block) ---------
python3 - "$RENDER" "$SCRATCH/fetch-secrets.rendered.sh" <<'PY'
import pathlib, re, sys
text = pathlib.Path(sys.argv[1]).read_text()
m = re.search(
    r"^  - path: /etc/mattercontrol/fetch-secrets\.sh\n^    permissions: '[0-9]+'\n^    content: \|\n((?:^      .*\n)+)",
    text, re.M)
if not m:
    raise SystemExit("fetch-secrets block not found")
block = re.sub(r"^ {6}", "", m.group(1), flags=re.M).rstrip() + "\n"
pathlib.Path(sys.argv[2]).write_text(block)
PY

# --- 2. adaptations (recorded, mechanical only) -----------------------------
# a) /run/mattercontrol -> owned scratch run dir
# b) /usr/bin/docker     -> stub controlled by STUB_MODE
# c) install -o 65532 -g 65532 -> removed (no uid 65532 on macOS; mode logic kept)
# d) key dir mode 0500 -> 0700 (script runs as uid 0 on COS; a non-root owner
#    cannot create api-key.json inside an 0500 dir — 0700 reproduces root's write
#    capability while the FILE mode 0400 + non-world-readable dir assertions stay)
# e) chown 65532:65532   -> no-op (uid 65532 absent on macOS)
sed -e "s#/run/mattercontrol#$SCRATCH/run/mattercontrol#g" \
    -e "s#/usr/bin/docker#$SCRATCH/bin/docker-stub.sh#g" \
    -e "s#install -d -m 0500 -o 65532 -g 65532 #install -d -m 0700 #" \
    -e "s#^chown 65532:65532 #true #" \
    "$SCRATCH/fetch-secrets.rendered.sh" > "$SCRATCH/fetch-secrets.adapted.sh"

# --- 3. stubbed fetch boundary (gcloud image invocation shape) -------------
cat > "$SCRATCH/bin/docker-stub.sh" <<STUB
#!/bin/bash
# stub: counts invocations; STUB_MODE=fail_at_N fails the Nth call; empty_N returns empty on Nth.
n=\$(( \$(cat "$SCRATCH/calls") + 1 )); echo "\$n" > "$SCRATCH/calls"
case "\${STUB_MODE:-ok}" in
  fail_at_*) [ "\$n" = "\${STUB_MODE#fail_at_}" ] && exit 1 ;;
  empty_*)   [ "\$n" = "\${STUB_MODE#empty_}" ] && { printf ''; exit 0; } ;;
esac
case "\$*" in
  *--secret=mc-qadatabase-url*)        printf 'postgres://qa-synth:demo@db.invalid/mcqa' ;;
  *--secret=mc-qar2-key-id*)          printf 'qa-synth-r2-key-id' ;;
  *--secret=mc-qar2-secret*)          printf 'qa-synth-r2-secret' ;;
  *--secret=mc-qamigrate-url*)        printf 'postgres://qa-synth-owner:demo@db.invalid/mcqa' ;;
  *--secret=mc-qaidp-key*)            printf '{"type":"service_account","private_key":"qa-synthetic-not-real"}' ;;
  *) echo "unexpected stub invocation: \$*" >&2; exit 97 ;;
esac
STUB
chmod 755 "$SCRATCH/bin/docker-stub.sh" "$SCRATCH/fetch-secrets.adapted.sh"

run_case() { # name mode expect_exit
  local name=$1 mode=$2 expect=$3
  rm -f "$SCRATCH/calls"
  STUB_MODE=$mode bash "$SCRATCH/fetch-secrets.adapted.sh" >"$SCRATCH/$name.out" 2>"$SCRATCH/$name.err"
  local ec=$?
  local mode_dir mode_env mode_key mode_keydir
  mode_dir=$(stat -f '%Lp' "$SCRATCH/run/mattercontrol" 2>/dev/null || echo MISSING)
  mode_env=$(stat -f '%Lp' "$SCRATCH/run/mattercontrol/mcapi-secrets.env" 2>/dev/null || echo MISSING)
  mode_key=$(stat -f '%Lp' "$SCRATCH/run/mattercontrol/oidc/api-key.json" 2>/dev/null || echo MISSING)
  mode_keydir=$(stat -f '%Lp' "$SCRATCH/run/mattercontrol/oidc" 2>/dev/null || echo MISSING)
  local leak=no
  grep -q -e 'qa-synth-r2-secret' -e 'qa-synthetic-not-real' -e 'demo@db.invalid' "$SCRATCH/$name.out" "$SCRATCH/$name.err" && leak=yes
  local env_body=""
  [ -f "$SCRATCH/run/mattercontrol/mcapi-secrets.env" ] && env_body=$(LC_ALL=C sed -e 's/demo@db.invalid/<redacted-host>/g' -e 's/qa-synth-r2-secret/<redacted-value>/g' "$SCRATCH/run/mattercontrol/mcapi-secrets.env")
  python3 - "$name" "$mode" "$expect" "$ec" "$mode_dir" "$mode_env" "$mode_key" "$mode_keydir" "$leak" "$env_body" <<'PY'
import json, sys
name, mode, expect, ec, md, me, mk, mkd, leak, body = sys.argv[1:]
print(json.dumps({"case": name, "stub_mode": mode, "expected_exit": int(expect), "exit": int(ec),
                  "dir_mode": md, "env_mode": me, "key_mode": mk, "key_dir_mode": mkd,
                  "secret_in_output": leak, "env_file_body_sanitized": body}))
PY
}

echo '== fail-closed: 4th fetch fails, nothing written =='
run_case fail_mid fail_at_4 1
echo '== empty-success: 3rd fetch returns empty payload with exit 0 =='
run_case empty_value empty_3 0
echo '== stale-after-failure: previous files survive a failed run =='
rm -rf "$SCRATCH/run"   # fresh boot simulation (COS script runs as root; a non-root rerun cannot overwrite its own 0400 key file)
run_case stale_ok ok 0
run_case stale_fail fail_at_1 1

# overall secret-leak scan across every captured output and emitted file
python3 - "$SCRATCH" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
needles = [b"qa-synth-r2-secret", b"qa-synthetic-not-real"]
files = list(root.glob("*.out")) + list(root.glob("*.err")) + list((root / "run").rglob("*"))
files = [f for f in files if f.is_file()]
hits = []
for f in files:
    data = f.read_bytes()
    if any(n in data for n in needles) and f.name not in ("mcapi-secrets.env", "migrate-secrets.env", "api-key.json"):
        hits.append(str(f))
print(json.dumps({
    "scanned_files": len(files),
    "unexpected_known_synthetic_secret_matches": hits,
    "secret_bearing_files_are_intended_private_artifacts": sorted(
        str(f) for f in files if f.name in ("mcapi-secrets.env", "migrate-secrets.env", "api-key.json")),
}))
PY
