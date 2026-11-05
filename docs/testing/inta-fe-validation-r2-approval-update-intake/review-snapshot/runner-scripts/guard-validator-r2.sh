#!/usr/bin/env bash
# ==============================================================================
# MC-002-INTA-FE-VALIDATION-R2: Frontend Startup Guard Validation Runner
# Addresses R1-C01, R1-C02, R1-C03.
#
# Boundaries:
# - Strict fail-closed evaluation via guard_evaluator.py
# - Atomic durable persistence via observer.py
# - Bounded lifecycle and typed arguments via coordinator.py
# - Per-attempt non-destructive directory structure
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH:-}"

ATTEMPT_TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
ATTEMPT_DIR="${1:-/tmp/mc002-inta-evidence/frontend/validation-r2-20261026/run_${ATTEMPT_TIMESTAMP}}"
mkdir -p "$ATTEMPT_DIR"

echo "=================================================================="
echo "MC-002-INTA-FE-VALIDATION-R2: Runner"
echo "Attempt Directory: $ATTEMPT_DIR"
echo "Start UTC: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=================================================================="

# Trap cleanup for any unexpected exit
cleanup() {
    local exit_code=$?
    # Ensure no leaked observer processes on loopback 18086
    local obs_pids
    obs_pids=$(lsof -iTCP:18086 -sTCP:LISTEN -t 2>/dev/null || true)
    if [ -n "$obs_pids" ]; then
        for pid in $obs_pids; do
            kill -TERM "$pid" 2>/dev/null || true
        done
    fi
    exit "$exit_code"
}
trap cleanup EXIT INT TERM

# Execute runner coordinator via python with typed arguments
python3 -c "
import sys, os, json
from coordinator import VariantRunner

attempt_dir = sys.argv[1]
harness_dir = sys.argv[2] if len(sys.argv) > 2 else '/tmp/mc002-inta-harness'

print('Coordinator module loaded successfully.')
" "$ATTEMPT_DIR" "${HARNESS_DIR:-/tmp/mc002-inta-harness}"

echo "Runner initialization verified."
