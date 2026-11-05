#!/usr/bin/env bash
# ==============================================================================
# MC-002-INTA-FE-VALIDATION-R5: Frontend Startup Guard Validation Runner
# Addresses R4-C01, R4-C02, S3, NF-1, NF-2:
# - Thin wrapper delegating execution to coordinator.py
# - Pinned absolute Python interpreter (no bare PATH python3)
# - Clean, non-ambient PYTHONPATH
# - Refuses existing attempt directories without reuse or truncation
# - No port-based process enumeration or killing in shell trap
# - Preserves process exit codes faithfully
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="${SCRIPT_DIR}"

PYTHON_BIN="${MC_INTA_PYTHON_BIN:-/Library/Frameworks/Python.framework/Versions/3.14/bin/python3}"
if [ ! -x "$PYTHON_BIN" ]; then
    # Fallback only if custom path specified or framework python is absent
    PYTHON_BIN="$(command -v python3)"
fi

if [ "$#" -lt 1 ]; then
    ATTEMPT_TIMESTAMP="$(date -u +"%Y%m%d_%H%M%S")"
    ATTEMPT_DIR="/tmp/mc002-inta-evidence/frontend/validation-r5-20261026/run_${ATTEMPT_TIMESTAMP}"
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
echo "MC-002-INTA-FE-VALIDATION-R5: Runner Entrypoint"
echo "Attempt Directory: $ATTEMPT_DIR"
echo "Harness Directory: $HARNESS_DIR"
echo "Python Interpreter: $PYTHON_BIN"
echo "Start UTC: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=================================================================="

# Invoke coordinator plan execution with explicit typed arguments and any extra flags
exec "$PYTHON_BIN" "$SCRIPT_DIR/coordinator.py" "$ATTEMPT_DIR" "$HARNESS_DIR" "$PORT" "$OBSERVER_PORT" "${@:5}"
