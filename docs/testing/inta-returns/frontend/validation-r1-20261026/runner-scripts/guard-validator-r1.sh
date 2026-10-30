#!/usr/bin/env bash
# MC-002-INTA-FE-VALIDATION-R1 — Corrected INT-ENV-05 Guard Startup Negatives Runner
# Author: Actual Antigravity (Gemini 3.8 Flash High)
#
# Incorporates all fixes from FEVAL-F01, FEVAL-F02, FEVAL-F03:
# - Observer handles SIGTERM explicitly, flushing final count with cleanShutdown=true
# - Uses guard_evaluator.py for fail-closed verdict evaluation
# - Treats probe errors as PROBE_ERROR, never defaulting to "no listener"
# - Stops immediately upon first failure / unexpected listener acquisition
# - Captures child and observer process identity, start/end UTC, and exit codes
#
# NOTE: This script is prepared as corrected source ONLY per R1 requirements.
# Do not run live without explicit owner authorization.

set -euo pipefail

SANDBOX="/tmp/mc002-inta-fe-validation-r1-20261026"
HARNESS_SNAPSHOT="$SANDBOX/harness-snapshot"
STATE_DIR="$SANDBOX/state"
OUTPUT_DIR="$SANDBOX/output/guard-variants-r1"
RUNNER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NEXT_BIN="$HARNESS_SNAPSHOT/node_modules/.bin/next"
RESOLVED_NEXT_BIN="$(readlink -f "$NEXT_BIN" 2>/dev/null || echo "$NEXT_BIN")"
TIMEOUT_SECONDS=15

# Resolve clean environment
NODE_BIN="$(which node)"
NODE_DIR="$(dirname "$NODE_BIN")"
CLEAN_PATH="$NODE_DIR:/usr/bin:/bin:/usr/sbin:/sbin"

mkdir -p "$OUTPUT_DIR"

GUARD_KEYS=(
  API_TOKEN
  API_BASE_URL
  AUTH_ALLOW_ANONYMOUS
  API_TIMEOUT_MS
  AUTH_SECRET
  NEXTAUTH_SECRET
  CLERK_SECRET_KEY
  SESSION_SECRET
  COOKIE_SECRET
  DATABASE_URL
  JWT_SECRET
)

RESULTS_FILE="$OUTPUT_DIR/results.json"
echo '[]' > "$RESULTS_FILE"

OBSERVER_PORT=18086
HARNESS_PORT=18085

# Start durable observer with explicit SIGTERM handler
start_observer() {
  local log_file="$1"

  # Fail-closed check: verify port is free
  local probe_out
  probe_out=$(lsof -i ":$OBSERVER_PORT" -P -n 2>&1) || true
  if echo "$probe_out" | grep -q LISTEN; then
    echo "ERROR: Observer port $OBSERVER_PORT already in use" >&2
    return 1
  fi

  python3 -c "
import http.server, json, os, signal, sys

class CountHandler(http.server.BaseHTTPRequestHandler):
    request_count = 0
    def handle_any(self):
        CountHandler.request_count += 1
        self.send_response(200)
        self.end_headers()
    do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = do_HEAD = handle_any
    def log_message(self, *a): pass

log_path = sys.argv[1]

def flush_final(clean):
    try:
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump({
                'requestCount': CountHandler.request_count,
                'cleanShutdown': clean,
                'pid': os.getpid()
            }, f)
    except Exception as e:
        sys.stderr.write(f'Observer write error: {e}\n')

def sig_term_handler(signum, frame):
    flush_final(clean=True)
    sys.exit(0)

signal.signal(signal.SIGTERM, sig_term_handler)
signal.signal(signal.SIGINT, sig_term_handler)

try:
    server = http.server.HTTPServer(('127.0.0.1', $OBSERVER_PORT), CountHandler)
    sys.stdout.write(str(os.getpid()) + '\n')
    sys.stdout.flush()
    server.serve_forever()
except Exception as e:
    with open(log_path, 'w', encoding='utf-8') as f:
        json.dump({'error': str(e), 'cleanShutdown': False, 'requestCount': CountHandler.request_count}, f)
    sys.exit(1)
" "$log_file" &
  OBSERVER_PID=$!

  # Wait for observer socket to bind
  local waited=0
  while [ $waited -lt 30 ]; do
    if lsof -i ":$OBSERVER_PORT" -P -n 2>/dev/null | grep -q LISTEN; then
      return 0
    fi
    sleep 0.1
    waited=$((waited + 1))
  done
  echo "ERROR: Observer failed to start listening within 3s" >&2
  return 1
}

stop_observer() {
  local pid="$1"
  local log_file="$2"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill -TERM "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi

  # Verify port released
  local waited=0
  while [ $waited -lt 20 ]; do
    if ! lsof -i ":$OBSERVER_PORT" -P -n 2>/dev/null | grep -q LISTEN; then
      break
    fi
    sleep 0.1
    waited=$((waited + 1))
  done

  # Verify observer log was written with clean shutdown
  if [ ! -f "$log_file" ]; then
    echo "ERROR: Observer failed to write counter log at $log_file" >&2
    return 1
  fi
}

run_variant() {
  local key="$1"
  local value="$2"
  local variant_label="$3"
  local variant_dir="$OUTPUT_DIR/${key}_${variant_label}"

  rm -rf "$variant_dir"
  mkdir -p "$variant_dir"

  local observer_log="$variant_dir/observer.json"
  local stdout_file="$variant_dir/stdout.log"
  local stderr_file="$variant_dir/stderr.log"
  local meta_file="$variant_dir/meta.json"
  local eval_file="$variant_dir/eval.json"

  echo "  Testing: $key=$variant_label"

  # Probe 18085 before starting
  local pre_probe_err=false
  local pre_probe_detail=""
  if ! lsof_out=$(lsof -i :$HARNESS_PORT -P -n 2>&1); then
    # lsof returns 1 when no match; other codes mean error
    local lsof_exit=$?
    if [ "$lsof_exit" -ne 1 ]; then
      pre_probe_err=true
      pre_probe_detail="pre-lsof error exit $lsof_exit: $lsof_out"
    fi
  else
    if echo "$lsof_out" | grep -q LISTEN; then
      echo "ERROR: Port $HARNESS_PORT already in use before variant start" >&2
      return 1
    fi
  fi

  # Start observer
  OBSERVER_PID=""
  if ! start_observer "$observer_log"; then
    echo "ERROR: Observer failed to start" >&2
    return 1
  fi

  local start_utc
  start_utc="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

  local variant_state_dir="$STATE_DIR/guard-${key}-${variant_label}"
  rm -rf "$variant_state_dir"
  mkdir -p "$variant_state_dir"

  local env_args=(
    "PATH=$CLEAN_PATH"
    "HOME=$SANDBOX/home"
    "NODE_ENV=development"
    "MC_INTA_ENABLE=1"
    "MC_INTA_GO_BASE_URL=http://127.0.0.1:18086"
    "MC_INTA_STATE_DIR=$variant_state_dir"
    "${key}=${value}"
  )

  # Launch child with cwd = $HARNESS_SNAPSHOT
  (
    cd "$HARNESS_SNAPSHOT"
    exec env -i "${env_args[@]}" "$NEXT_BIN" dev -H 127.0.0.1 -p 18085 --webpack \
      >"$stdout_file" 2>"$stderr_file"
  ) &
  local child_pid=$!

  # Record process metadata
  python3 -c "
import json
meta = {
    'childPID': $child_pid,
    'parentPID': os.getpid(),
    'nextBin': '$NEXT_BIN',
    'resolvedNextBin': '$RESOLVED_NEXT_BIN',
    'cwd': '$HARNESS_SNAPSHOT',
    'observerPID': $OBSERVER_PID,
    'testedKey': '$key',
    'variant': '$variant_label',
    'hasNonEmptyValue': bool('$value' != '')
}
json.dump(meta, open('$meta_file', 'w'), indent=2)
"

  # Monitor child lifetime and sample listener state
  local listener_appeared="false"
  local probe_error="false"
  local probe_error_detail=""
  local elapsed=0
  local child_running=true
  local timed_out="false"

  while [ $elapsed -lt $((TIMEOUT_SECONDS * 10)) ]; do
    if ! kill -0 "$child_pid" 2>/dev/null; then
      child_running=false
      break
    fi
    # Sample listener state
    if ! lsof_sample=$(lsof -i :$HARNESS_PORT -P -n 2>&1); then
      local sample_exit=$?
      if [ "$sample_exit" -ne 1 ]; then
        probe_error="true"
        probe_error_detail="sample-lsof exit $sample_exit: $lsof_sample"
      fi
    else
      if echo "$lsof_sample" | grep -q LISTEN; then
        listener_appeared="true"
      fi
    fi
    sleep 0.1
    elapsed=$((elapsed + 1))
  done

  # Handle hang/timeout
  local child_exit=0
  if $child_running && kill -0 "$child_pid" 2>/dev/null; then
    timed_out="true"
    kill -TERM "$child_pid" 2>/dev/null || true
    local tw=0
    while [ $tw -lt 30 ] && kill -0 "$child_pid" 2>/dev/null; do
      sleep 0.1
      tw=$((tw + 1))
    done
    if kill -0 "$child_pid" 2>/dev/null; then
      kill -9 "$child_pid" 2>/dev/null || true
    fi
  fi

  wait "$child_pid" 2>/dev/null || child_exit=$?

  local end_utc
  end_utc="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

  # Check listener after child exit
  local listener_after="false"
  if ! post_lsof=$(lsof -i :$HARNESS_PORT -P -n 2>&1); then
    local post_exit=$?
    if [ "$post_exit" -ne 1 ]; then
      probe_error="true"
      probe_error_detail="post-lsof exit $post_exit: $post_lsof"
    fi
  else
    if echo "$post_lsof" | grep -q LISTEN; then
      listener_after="true"
    fi
  fi

  # Stop observer gracefully
  stop_observer "$OBSERVER_PID" "$observer_log" || true

  # Invoke guard_evaluator.py for strict fail-closed evaluation
  python3 -c "
import json, sys
sys.path.insert(0, '$RUNNER_DIR')
import guard_evaluator

stderr_text = open('$stderr_file', 'r', errors='ignore').read()
stdout_text = open('$stdout_file', 'r', errors='ignore').read()

eval_res = guard_evaluator.evaluate_variant(
    key='$key',
    variant_label='$variant_label',
    child_exit=$child_exit,
    timed_out=($timed_out == 'true'),
    stderr_text=stderr_text,
    stdout_text=stdout_text,
    observer_log_path='$observer_log',
    listener_during=($listener_appeared == 'true'),
    listener_after=($listener_after == 'true'),
    probe_error=($probe_error == 'true'),
    probe_error_detail='$probe_error_detail'
)

eval_res['startUTC'] = '$start_utc'
eval_res['endUTC'] = '$end_utc'
eval_res['childPID'] = $child_pid
eval_res['observerPID'] = $OBSERVER_PID

with open('$eval_file', 'w', encoding='utf-8') as f:
    json.dump(eval_res, f, indent=2)

results = json.load(open('$RESULTS_FILE'))
results.append(eval_res)
with open('$RESULTS_FILE', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)

print(f'    -> {eval_res[\"verdict\"]} ({eval_res[\"verdictCode\"]}) exit={child_exit} listener={eval_res[\"listenerObservedDuring\"]} reqs={eval_res[\"observerHTTPRequests\"]}')
"

  # Read verdict from eval_file
  local verdict
  verdict=$(python3 -c "import json; print(json.load(open('$eval_file'))['verdict'])")

  # FEVAL-F01 requirement: STOP immediately on failure or unexpected listener/request
  if [ "$verdict" != "PASS" ]; then
    echo "CRITICAL: Variant failed or acquired listener. Stopping execution immediately per fail-closed protocol." >&2
    return 2
  fi
}

echo "================================================================"
echo "MC-002-INTA-FE-VALIDATION-R1: Corrected Guard Validator"
echo "Start UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Harness snapshot: $HARNESS_SNAPSHOT"
echo "Next.js: $($NEXT_BIN --version 2>/dev/null || echo 'not verified')"
echo "================================================================"

for key in "${GUARD_KEYS[@]}"; do
  echo ""
  echo "--- Key: $key ---"
  if ! run_variant "$key" "INTA_GUARD_SENTINEL" "nonempty"; then
    echo "ABORTED: Failure detected on $key=nonempty. Stopping." >&2
    exit 1
  fi
  if ! run_variant "$key" "" "empty"; then
    echo "ABORTED: Failure detected on $key=empty. Stopping." >&2
    exit 1
  fi
done

echo "================================================================"
echo "All 22 variants completed successfully."
echo "================================================================"
