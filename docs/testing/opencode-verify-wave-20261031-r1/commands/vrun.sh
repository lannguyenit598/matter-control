#!/bin/bash
# MC-OPENCODE-VERIFY-WAVE-20261031 — evidence runner (same contract as the
# reviewer's 2026-10-30 qa-run.sh: env_file, cwd, sanitized logs, argv/cwd/UTC/exit).
# Usage: vrun.sh <envfile|NONE> <cwd> <name> <argv...>
set -uo pipefail

NS="/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/opencode-verify-wave-20261031-r1/commands"
ENVF="$1"; CWD="$2"; NAME="$3"; shift 3
DIR="$NS/$NAME"
mkdir -p "$DIR"
ST="$DIR/started.utc"; ET="$DIR/ended.utc"
date -u +%Y-%m-%dT%H:%M:%SZ > "$ST"

if [ "$ENVF" = "NONE" ]; then
  cd "$CWD" && rtk proxy "$@" > "$DIR/stdout.raw" 2> "$DIR/stderr.raw"
  EC=$?
else
  cd "$CWD" && { set -o allexport; source "$ENVF"; set +o allexport; rtk proxy "$@" > "$DIR/stdout.raw" 2> "$DIR/stderr.raw"; }
  EC=$?
fi
date -u +%Y-%m-%dT%H:%M:%SZ > "$ET"

cp "$DIR/stdout.raw" "$DIR/stdout.final"; cp "$DIR/stderr.raw" "$DIR/stderr.final"
python3 - "$ENVF" "$CWD" "$NAME" "$DIR" "$EC" "$@" <<'PY'
import json, os, sys
envf, cwd, name, d, ec = sys.argv[1:6]; argv = sys.argv[6:]
meta = {
  "run": name, "argv": argv, "cwd": cwd, "env_file": envf,
  "started_utc": open(os.path.join(d, "started.utc")).read().strip(),
  "ended_utc": open(os.path.join(d, "ended.utc")).read().strip(),
  "exit": int(ec),
  "identity": "OpenCode independent QA",
  "sanitize": "DSN/password URLs scrubbed in .final copies; secret VALUES never captured in argv; env file never copied",
}
env_keys = None
if envf != "NONE":
    env_keys = sorted(l.split("=", 1)[0] for l in open(envf) if "=" in l)
meta["env_keys"] = env_keys
json.dump(meta, open(os.path.join(d, "meta.json"), "w"), indent=1)
PY

# scrub DSN-looking strings from the .final copies (user:<pw>@, and the review targets' synthetic creds)
python3 - "$DIR" <<'PY'
import os, re, sys
d = sys.argv[1]
pw = None
env = "/private/tmp/mc-opencode-verify-wave-20261031/private/pg.env"
if os.path.exists(env):
    pw = dict(l.split("=", 1) for l in open(env).read().strip().splitlines()).get("POSTGRES_PASSWORD")
def scrub(p):
    if not os.path.exists(p): return
    t = open(p, "rb").read().decode("utf-8", "replace")
    if pw: t = t.replace(pw, "<synthetic-password-redacted>")
    t = re.sub(r"postgres(sr|)://[^:!\s]+:[^@\s]+@", r"postgres\1://<redacted-user>:<redacted-password>@", t)
    open(p, "wb").write(t.encode())
scrub(os.path.join(d, "stdout.final")); scrub(os.path.join(d, "stderr.final"))
PY

echo "run=$NAME exit=$EC"
exit $EC
