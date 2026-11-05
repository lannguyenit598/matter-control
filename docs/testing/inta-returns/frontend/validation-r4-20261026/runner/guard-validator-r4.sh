#!/usr/bin/env bash
# ==============================================================================
# MC-002-INTA-FE-VALIDATION-R4: Frontend Startup Guard Validation Runner
# Addresses R2-I01, R3-N01..06, NF-1..6:
# - Thin wrapper delegating execution to coordinator.py
# - Refuses existing attempt directories without reuse or truncation
# - No port-based process enumeration or killing in shell trap
# - Preserves process exit codes faithfully
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH:-}"

if [ "$#" -lt 1 ]; then
    ATTEMPT_TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
    ATTEMPT_DIR="/tmp/mc002-inta-evidence/frontend/validation-r4-20261026/run_${ATTEMPT_TIMESTAMP}"
else
    ATTEMPT_DIR="$1"
fi

HARNESS_DIR="${2:-/tmp/mc002-inta-harness}"
PORT="${3:-18085}"
OBSERVER_PORT="${4:-18086}"

# Refuse existing attempt directory (R2-I01, R3-N05)
if [ -e "$ATTEMPT_DIR" ]; then
    echo "ERROR: Attempt directory already exists: $ATTEMPT_DIR" >&2
    exit 2
fi

echo "=================================================================="
echo "MC-002-INTA-FE-VALIDATION-R4: Runner Entrypoint"
echo "Attempt Directory: $ATTEMPT_DIR"
echo "Harness Directory: $HARNESS_DIR"
echo "Start UTC: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=================================================================="

# Invoke coordinator plan execution with typed arguments
exec python3 "$SCRIPT_DIR/coordinator.py" "$ATTEMPT_DIR" "$HARNESS_DIR" "$PORT" "$OBSERVER_PORT"
