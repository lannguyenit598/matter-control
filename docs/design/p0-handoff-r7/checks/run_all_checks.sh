#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r7"
CHECKS_DIR="$BASE_DIR/checks"
EVIDENCE_DIR="$BASE_DIR/evidence"

mkdir -p "$EVIDENCE_DIR"

echo "=== MatterControl R7 Automated Verification Suite ===" > "$EVIDENCE_DIR/all-checks.log"
echo "Start UTC: $(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$EVIDENCE_DIR/all-checks.log"

run_check() {
  local name="$1"
  local cmd="$2"
  local log="$3"
  echo "--- Running $name ---" | tee -a "$EVIDENCE_DIR/all-checks.log"
  echo "Command: $cmd" > "$log"
  echo "Timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$log"
  eval "$cmd" >> "$log" 2>&1
  local ec=$?
  echo "Exit Code: $ec" >> "$log"
  if [ $ec -eq 0 ]; then
    echo "Result: PASS" | tee -a "$EVIDENCE_DIR/all-checks.log"
  else
    echo "Result: FAIL (ec=$ec)" | tee -a "$EVIDENCE_DIR/all-checks.log"
    exit $ec
  fi
  cat "$log" >> "$EVIDENCE_DIR/all-checks.log"
  echo "" >> "$EVIDENCE_DIR/all-checks.log"
}

run_check "1. Manifest Pins Check" "python3 $CHECKS_DIR/check_manifest_pins.py" "$EVIDENCE_DIR/manifest-check.log"
run_check "2. JavaScript Syntax Check" "bash $CHECKS_DIR/check_syntax.sh" "$EVIDENCE_DIR/syntax-check.log"
run_check "3. Mock DOM Bootstrap Check" "node $CHECKS_DIR/check_mock_dom_bootstrap.js" "$EVIDENCE_DIR/mock-dom-bootstrap.log"
run_check "4. Canonical Facts & Proof Check" "python3 $CHECKS_DIR/check_canonical_dataset_and_proof.py" "$EVIDENCE_DIR/canonical-facts.log"
run_check "5. CSS Byte Identity Check" "python3 $CHECKS_DIR/check_css_byte_identity.py" "$EVIDENCE_DIR/css-identity.log"
run_check "6. Screen State Matrix Traceability Check" "python3 $CHECKS_DIR/check_screen_state_matrix.py" "$EVIDENCE_DIR/matrix-traceability.log"

echo "End UTC: $(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$EVIDENCE_DIR/all-checks.log"
echo "All automated source checks PASSED cleanly." | tee -a "$EVIDENCE_DIR/all-checks.log"
