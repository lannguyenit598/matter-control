#!/usr/bin/env bash
# ==============================================================================
# MC-002-INTA-FE-VALIDATION-R3: Frontend Startup Guard Validation Runner
# Addresses R2-I01:
# - Thin wrapper delegating execution to coordinator.py
# - Refuses occupied attempt directories (no silent overwrite or collision)
# - No port-based process enumeration or killing in shell trap
# - Preserves process exit codes faithfully
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${SCRIPT_DIR}:${PYTHONPATH:-}"

if [ "$#" -lt 1 ]; then
    ATTEMPT_TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
    ATTEMPT_DIR="/tmp/mc002-inta-evidence/frontend/validation-r3-20261026/run_${ATTEMPT_TIMESTAMP}"
else
    ATTEMPT_DIR="$1"
fi

HARNESS_DIR="${2:-/tmp/mc002-inta-harness}"
PORT="${3:-18085}"
OBSERVER_PORT="${4:-18086}"

# Refuse occupied attempt directory (R2-I01)
if [ -d "$ATTEMPT_DIR" ] && [ "$(ls -A "$ATTEMPT_DIR" 2>/dev/null || true)" ]; then
    echo "ERROR: Attempt directory already exists and is non-empty: $ATTEMPT_DIR" >&2
    exit 2
fi

mkdir -p "$ATTEMPT_DIR"

echo "=================================================================="
echo "MC-002-INTA-FE-VALIDATION-R3: Runner Entrypoint"
echo "Attempt Directory: $ATTEMPT_DIR"
echo "Harness Directory: $HARNESS_DIR"
echo "Start UTC: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=================================================================="

# Invoke coordinator plan execution with typed arguments
exec python3 "$SCRIPT_DIR/coordinator.py" "$ATTEMPT_DIR" "$HARNESS_DIR" "$PORT" "$OBSERVER_PORT"
