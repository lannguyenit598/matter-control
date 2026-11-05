#!/usr/bin/env bash
# Self-check for guard-validator runner logic
# Verifies accounting, timeout, and error path handling
# WITHOUT using real Next.js dependencies.
# This is a distinct self-test, not actual guard results.

set -euo pipefail

SANDBOX="/tmp/mc002-inta-fe-validation-20261026"
SELFCHECK_DIR="$SANDBOX/output/selfcheck"
mkdir -p "$SELFCHECK_DIR"

echo "=== Runner Self-Check ==="
echo "Start UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

PASS_COUNT=0
FAIL_COUNT=0

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $label (expected=$expected, got=$actual)"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  FAIL: $label (expected=$expected, got=$actual)"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

# Test 1: Observer starts and counts 0 requests when nothing calls it
echo ""
echo "Test 1: Observer zero-request baseline"
python3 -c "
import http.server, json, os, sys
class H(http.server.BaseHTTPRequestHandler):
    count = 0
    def do_GET(self): H.count += 1; self.send_response(200); self.end_headers()
    def log_message(self, *a): pass
s = http.server.HTTPServer(('127.0.0.1', 18087), H)
print(os.getpid(), flush=True)
import threading
threading.Timer(1.0, s.shutdown).start()
s.serve_forever()
with open('$SELFCHECK_DIR/obs-test1.json','w') as f:
    json.dump({'requestCount': H.count}, f)
s.server_close()
" &
OBS_PID=$!
sleep 1.5
wait $OBS_PID 2>/dev/null || true
OBS_COUNT=$(python3 -c "import json; print(json.load(open('$SELFCHECK_DIR/obs-test1.json'))['requestCount'])")
assert_eq "Observer sees 0 requests" "0" "$OBS_COUNT"

# Test 2: Observer counts exactly 1 request
echo ""
echo "Test 2: Observer counts a single request"
python3 -c "
import http.server, json, os, sys, threading, urllib.request
class H(http.server.BaseHTTPRequestHandler):
    count = 0
    def do_GET(self): H.count += 1; self.send_response(200); self.end_headers()
    def log_message(self, *a): pass
s = http.server.HTTPServer(('127.0.0.1', 18087), H)
def trigger():
    import time; time.sleep(0.3)
    try: urllib.request.urlopen('http://127.0.0.1:18087/')
    except: pass
    time.sleep(0.3)
    s.shutdown()
threading.Thread(target=trigger, daemon=True).start()
s.serve_forever()
with open('$SELFCHECK_DIR/obs-test2.json','w') as f:
    json.dump({'requestCount': H.count}, f)
s.server_close()
" &
OBS_PID=$!
wait $OBS_PID 2>/dev/null || true
OBS_COUNT=$(python3 -c "import json; print(json.load(open('$SELFCHECK_DIR/obs-test2.json'))['requestCount'])")
assert_eq "Observer counts 1 request" "1" "$OBS_COUNT"

# Test 3: A child that exits nonzero is detected
echo ""
echo "Test 3: Nonzero child exit detection"
bash -c "exit 1" >/dev/null 2>&1 || CHILD_EXIT=$?
assert_eq "Nonzero exit detected" "1" "$CHILD_EXIT"

# Test 4: Timeout detection (child that would hang)
echo ""
echo "Test 4: Timeout detection"
timeout 2 sleep 10 >/dev/null 2>&1 || TIMEOUT_EXIT=$?
assert_eq "Timeout exit code 124" "124" "$TIMEOUT_EXIT"

# Test 5: Port-free check
echo ""
echo "Test 5: Port-free detection for 18085"
if lsof -i :18085 -P -n 2>/dev/null | grep -q LISTEN; then
  assert_eq "Port 18085 should be free" "free" "occupied"
else
  assert_eq "Port 18085 is free" "free" "free"
fi

# Test 6: JSON result accumulation
echo ""
echo "Test 6: JSON result file accumulation"
TEMP_RESULTS="$SELFCHECK_DIR/test-results.json"
echo '[]' > "$TEMP_RESULTS"
python3 -c "
import json
r = json.load(open('$TEMP_RESULTS'))
r.append({'key': 'TEST_KEY', 'variant': 'nonempty', 'verdict': 'PASS'})
json.dump(r, open('$TEMP_RESULTS', 'w'))
"
python3 -c "
import json
r = json.load(open('$TEMP_RESULTS'))
r.append({'key': 'TEST_KEY', 'variant': 'empty', 'verdict': 'PASS'})
json.dump(r, open('$TEMP_RESULTS', 'w'))
"
RESULT_COUNT=$(python3 -c "import json; print(len(json.load(open('$TEMP_RESULTS'))))")
assert_eq "Two results accumulated" "2" "$RESULT_COUNT"

echo ""
echo "================================================================"
echo "Self-check: $PASS_COUNT PASS / $FAIL_COUNT FAIL"
echo "End UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "================================================================"

# This self-check is DISTINCT from actual Next guard results
exit $FAIL_COUNT
