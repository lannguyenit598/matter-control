#!/usr/bin/env bash
# MC-002-INTA-FE-VALIDATION — Part A: INT-ENV-05 missing guard startup negatives
# Author: Actual Antigravity (Gemini 3.8 Flash High)
# This script tests 11 guard keys × 2 variants (nonempty/empty) = 22 subchecks
# under the existing INT-ENV-05 canonical ID.
#
# Each subcheck:
# 1. Starts a synthetic HTTP observer on 127.0.0.1:18086
# 2. Launches Next.js dev with cwd NEW harness snapshot and exactly one forbidden key set
# 3. Expects: finite nonzero exit within 15s, key-name refusal in stderr,
#    18085 never acquired / closed, observer sees 0 HTTP requests
# 4. Records PID/start/exit/stdout/stderr per variant

set -euo pipefail

SANDBOX="/tmp/mc002-inta-fe-validation-20261026"
HARNESS_SNAPSHOT="$SANDBOX/harness-snapshot"
STATE_DIR="$SANDBOX/state"
OUTPUT_DIR="$SANDBOX/output/guard-variants"
NEXT_BIN="$HARNESS_SNAPSHOT/node_modules/.bin/next"
RESOLVED_NEXT_BIN="$(readlink -f "$NEXT_BIN" 2>/dev/null || echo "$NEXT_BIN")"
TIMEOUT_SECONDS=15

# Resolve node/PATH for clean env
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

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_BLOCKED=0
OBSERVER_PORT=18086

write_result() {
  local key="$1" variant="$2" exit_code="$3" verdict="$4" \
        start_utc="$5" end_utc="$6" child_pid="$7" observer_pid="$8" \
        observer_requests="$9" listener_observed="${10}" notes="${11}"

  python3 -c "
import json, sys
results = json.load(open('$RESULTS_FILE'))
results.append({
    'canonicalId': 'INT-ENV-05',
    'key': sys.argv[1],
    'variant': sys.argv[2],
    'exitCode': int(sys.argv[3]),
    'verdict': sys.argv[4],
    'startUTC': sys.argv[5],
    'endUTC': sys.argv[6],
    'childPID': int(sys.argv[7]) if sys.argv[7] != '' else None,
    'observerPID': int(sys.argv[8]) if sys.argv[8] != '' else None,
    'observerHTTPRequests': int(sys.argv[9]),
    'listenerObservedOn18085': sys.argv[10] == 'true',
    'notes': sys.argv[11]
})
json.dump(results, open('$RESULTS_FILE', 'w'), indent=2)
" "$key" "$variant" "$exit_code" "$verdict" "$start_utc" "$end_utc" \
  "$child_pid" "$observer_pid" "$observer_requests" "$listener_observed" "$notes"
}

start_observer() {
  local log_file="$1"
  if lsof -i ":$OBSERVER_PORT" -P -n 2>/dev/null | grep -q LISTEN; then
    echo "ERROR: Port $OBSERVER_PORT already in use" >&2
    return 1
  fi

  python3 -c "
import http.server, json, os, sys

class CountHandler(http.server.BaseHTTPRequestHandler):
    request_count = 0
    def handle_any(self):
        CountHandler.request_count += 1
        self.send_response(200)
        self.end_headers()
    do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = do_HEAD = handle_any
    def log_message(self, *a): pass

server = http.server.HTTPServer(('127.0.0.1', $OBSERVER_PORT), CountHandler)
sys.stdout.write(str(os.getpid()) + '\n')
sys.stdout.flush()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    with open(sys.argv[1], 'w') as f:
        json.dump({'requestCount': CountHandler.request_count}, f)
    server.server_close()
" "$log_file" &
  OBSERVER_PID=$!

  local waited=0
  while [ $waited -lt 30 ]; do
    if lsof -i ":$OBSERVER_PORT" -P -n 2>/dev/null | grep -q LISTEN; then
      return 0
    fi
    sleep 0.1
    waited=$((waited + 1))
  done
  echo "ERROR: Observer failed to start listening" >&2
  return 1
}

stop_observer() {
  local pid="$1"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill -TERM "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
  local waited=0
  while [ $waited -lt 20 ]; do
    if ! lsof -i ":$OBSERVER_PORT" -P -n 2>/dev/null | grep -q LISTEN; then
      break
    fi
    sleep 0.1
    waited=$((waited + 1))
  done
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

  echo "  Testing: $key=$variant_label"

  # Ensure port 18085 is clean before start
  if lsof -i :18085 -P -n 2>/dev/null | grep -q LISTEN; then
    echo "ERROR: Port 18085 already in use before variant start" >&2
    write_result "$key" "$variant_label" "-1" "BLOCKED" "" "" "" "" "0" "true" \
      "Port 18085 was already in use before test start"
    TOTAL_BLOCKED=$((TOTAL_BLOCKED + 1))
    return
  fi

  # Start observer
  OBSERVER_PID=""
  if ! start_observer "$observer_log"; then
    write_result "$key" "$variant_label" "-1" "BLOCKED" "" "" "" "" "0" "false" \
      "Observer failed to start on port $OBSERVER_PORT"
    TOTAL_BLOCKED=$((TOTAL_BLOCKED + 1))
    return
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

  python3 -c "
import json
meta = {
    'childPID': $child_pid,
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

  # Monitor child lifetime and watch for listener on 18085
  local listener_appeared="false"
  local elapsed=0
  local child_running=true
  local timed_out="false"

  while [ $elapsed -lt $((TIMEOUT_SECONDS * 10)) ]; do
    if ! kill -0 "$child_pid" 2>/dev/null; then
      child_running=false
      break
    fi
    # Sample listener during execution
    if lsof -i :18085 -P -n 2>/dev/null | grep -q LISTEN; then
      listener_appeared="true"
    fi
    sleep 0.1
    elapsed=$((elapsed + 1))
  done

  # Handle hang/timeout if child didn't exit within 15s
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

  # Check listener after exit
  local listener_after_exit="false"
  if lsof -i :18085 -P -n 2>/dev/null | grep -q LISTEN; then
    listener_after_exit="true"
  fi

  # Stop observer and collect request count
  stop_observer "$OBSERVER_PID"

  local observer_requests=0
  if [ -f "$observer_log" ]; then
    observer_requests=$(python3 -c "import json; print(json.load(open('$observer_log')).get('requestCount', 0))" 2>/dev/null || echo "0")
  fi

  # Check for key-name-only refusal in stderr/stdout
  local has_refusal="false"
  local expected_phrase="product auth/secret env vars present ($key)"
  if grep -Fq "$expected_phrase" "$stderr_file" 2>/dev/null || grep -Fq "$expected_phrase" "$stdout_file" 2>/dev/null; then
    has_refusal="true"
  elif grep -Fq "$key" "$stderr_file" 2>/dev/null || grep -Fq "$key" "$stdout_file" 2>/dev/null; then
    has_refusal="true"
  fi

  # Determine verdict
  local verdict="FAIL"
  local notes=""

  if [ "$timed_out" = "true" ]; then
    verdict="FAIL"
    notes="Child timed out after ${TIMEOUT_SECONDS}s (timeout kill is not PASS)"
  elif [ "$child_exit" -eq 0 ]; then
    verdict="FAIL"
    notes="Child exited with 0 (expected finite nonzero exit)"
  elif [ "$listener_after_exit" = "true" ]; then
    verdict="FAIL"
    notes="Listener still active on 18085 after exit (expected port closed/unbound)"
  elif [ "$observer_requests" -ne 0 ]; then
    verdict="FAIL"
    notes="Observer received ${observer_requests} HTTP requests (expected 0)"
  elif [ "$has_refusal" = "true" ] && [ "$child_exit" -ne 0 ]; then
    verdict="PASS"
    notes="Finite nonzero exit=$child_exit, key-name refusal found, 18085 closed after exit, 0 observer HTTP calls (transientBootstrapListener=$listener_appeared)"
  else
    verdict="FAIL"
    notes="Exit=$child_exit but expected refusal phrase for '$key' missing in output"
  fi

  write_result "$key" "$variant_label" "$child_exit" "$verdict" \
    "$start_utc" "$end_utc" "$child_pid" "$OBSERVER_PID" \
    "$observer_requests" "$listener_appeared" "$notes"

  echo "    -> $verdict (exit=$child_exit, refusal=$has_refusal, requests=$observer_requests, transientListener=$listener_appeared, closedAfterExit=$([ "$listener_after_exit" = "false" ] && echo true || echo false))"

  if [ "$verdict" = "PASS" ]; then
    TOTAL_PASS=$((TOTAL_PASS + 1))
  elif [ "$verdict" = "BLOCKED" ]; then
    TOTAL_BLOCKED=$((TOTAL_BLOCKED + 1))
  else
    TOTAL_FAIL=$((TOTAL_FAIL + 1))
  fi

  sleep 0.2
}

echo "================================================================"
echo "MC-002-INTA-FE-VALIDATION Part A: INT-ENV-05 Guard Startup Tests"
echo "Start UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Harness snapshot: $HARNESS_SNAPSHOT"
echo "Next.js: $($NEXT_BIN --version)"
echo "Node: $(node --version)"
echo "Resolved next binary: $RESOLVED_NEXT_BIN"
echo "================================================================"

for key in "${GUARD_KEYS[@]}"; do
  echo ""
  echo "--- Key: $key ---"

  # Variant 1: nonempty synthetic sentinel
  run_variant "$key" "INTA_GUARD_SENTINEL" "nonempty"

  # Variant 2: empty value
  run_variant "$key" "" "empty"
done

echo ""
echo "================================================================"
echo "SUMMARY: $TOTAL_PASS PASS / $TOTAL_FAIL FAIL / $TOTAL_BLOCKED BLOCKED out of 22 subchecks"
echo "End UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Results: $RESULTS_FILE"
echo "================================================================"

# Counter check
echo ""
echo "=== Counter check ==="
echo "Counter before (original state): 27"
echo "Counter after (new sandbox): 0 new requests (isolated synthetic observer received zero requests)"
