#!/bin/bash
# QA runner: executes one command inside the snapshot cwd with private env,
# captures stdout/stderr/exit separately, redacts DSNs in public logs, records
# metadata (argv, cwd, env key names, UTC start/end, exit).
# usage: qa-run.sh <envfile|NONE> <cwd> <run_name> <args...>
set -uo pipefail

REPO=/Users/nguyenvanlan/Documents/code/pet-projects/matter-control
OUTBASE="$REPO/docs/testing/opencode-adr006-independent-testing-20261030-r1/commands"
ENVPATH=$1; CWD=$2; NAME=$3; shift 3
OUT="$OUTBASE/$NAME"
mkdir -p "$OUT"

if [ "$ENVPATH" != "NONE" ]; then
  while IFS= read -r line || [ -n "$line" ]; do
    [ -z "$line" ] && continue
    case "$line" in \#*) continue ;; esac
    key=${line%%=*}
    value=${line#*=}
    export "$key=$value"
  done < "$ENVPATH"
fi

export PATH="$PATH:$HOME/go/bin"
START=$(date -u +%Y-%m-%dT%H:%M:%SZ)
S0=$(date +%s)

set +e
cd "$CWD" && rtk proxy "$@" >"$OUT/stdout.raw" 2>"$OUT/stderr.raw"
EC=$?
set -u
E0=$(date +%s)
END=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# public sanitized copies: redact any user:pass@ DSN/password-bearing URI
python3 - "$OUT/stdout.raw" "$OUT/stdout.final" "$OUT/stderr.raw" "$OUT/stderr.final" <<'PY'
import pathlib, re, sys
red_goes = re.compile(r"(postgres(?:ql)?://[^/\s:]+:)[^@\s]+@", re.I)
for src, dst in ((sys.argv[1], sys.argv[2]), (sys.argv[3], sys.argv[4])):
    text = pathlib.Path(src).read_text(errors="replace")
    redacted = red_goes.sub(r"\1<redacted>@", text)
    pathlib.Path(dst).write_text(redacted)
PY
rm -f "$OUT/stdout.raw" "$OUT/stderr.raw"
chmod 644 "$OUT/stdout.final" "$OUT/stderr.final" 2>/dev/null

META="$OUT/meta.json"
python3 - "$META" "$NAME" "$CWD" "$ENVPATH" "$START" "$END" "$EC" "$S0" "$E0" "$@" <<'PY'
import json, pathlib, sys
meta_path, name, cwd, envpath, start, end, ec, s0, e0, *argv = sys.argv[1:]
env_keys = None
if envpath != "NONE":
    env_keys = sorted(
        line.split("=", 1)[0]
        for line in pathlib.Path(envpath).read_text(errors="replace").splitlines()
        if line and not line.startswith("#") and "=" in line
    )
meta = {
    "run": name,
    "argv": argv,
    "cwd": cwd,
    "env_file": None if envpath == "NONE" else envpath,
    "env_keys": env_keys,
    "started_utc": start,
    "ended_utc": end,
    "duration_seconds": int(e0) - int(s0),
    "exit": int(ec),
    "identity": "OpenCode independent QA",
    "sanitize": "postgres://user:<redacted>@ URLs scrubbed in public stdout/stderr copies; secrets never in argv",
    "evidence_class": "INDEPENDENT_EXECUTION",
}
pathlib.Path(meta_path).write_text(json.dumps(meta, indent=2) + "\n")
print(json.dumps({"run": name, "exit": int(ec), "duration_seconds": int(e0) - int(s0)}))
PY
echo "run=$NAME exit=$EC"
exit "$EC"
