#!/usr/bin/env bash
# ==============================================================================
# MC-002-INTA-FE — Owned Process Graceful Stop Script (INTA-FE-R08, F07, R2-F04)
# Stop ONLY the exact recorded owned PID from .run-state/harness.pid with
# verified start-identity provenance matching (.run-state/harness.provenance).
# NEVER kill by port, never use lsof/xargs kill, never killall.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HARNESS_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PID_FILE="${HARNESS_ROOT}/.run-state/harness.pid"
PROVENANCE_FILE="${HARNESS_ROOT}/.run-state/harness.provenance"

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Stopping owned harness process..."

if [[ ! -f "${PID_FILE}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] No PID file found at ${PID_FILE}. Harness process is not running or already stopped."
  exit 0
fi

TARGET_PID="$(cat "${PID_FILE}" | tr -d '[:space:]')"

if [[ -z "${TARGET_PID}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] PID file was empty. Removing ${PID_FILE} with zero signals sent."
  rm -f "${PID_FILE}" "${PROVENANCE_FILE}"
  exit 0
fi

# Strict numeric validation: must be positive integer (>= 1) (F07)
if [[ ! "${TARGET_PID}" =~ ^[1-9][0-9]*$ ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Refusing invalid PID format '${TARGET_PID}' in ${PID_FILE} (must be a positive integer). Zero signals sent." >&2
  exit 1
fi

# Verify process is currently running
if ! kill -0 "${TARGET_PID}" 2>/dev/null; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Process ${TARGET_PID} is not running. Stale PID file removed with zero signals sent."
  rm -f "${PID_FILE}" "${PROVENANCE_FILE}"
  exit 0
fi

# R2-F04, R3-F02: Verify start-identity provenance before sending any signal
if [[ ! -f "${PROVENANCE_FILE}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Missing provenance file ${PROVENANCE_FILE}. Cannot verify ownership of PID ${TARGET_PID}. Refusing to signal foreign process. Zero signals sent." >&2
  exit 1
fi

PROV_PID="$(grep '^pid=' "${PROVENANCE_FILE}" 2>/dev/null | head -n1 | cut -d= -f2- | tr -d '[:space:]' || true)"
PROV_START="$(grep '^startTime=' "${PROVENANCE_FILE}" 2>/dev/null | head -n1 | cut -d= -f2- || true)"
PROV_CMD="$(grep '^cmd=' "${PROVENANCE_FILE}" 2>/dev/null | head -n1 | cut -d= -f2- || true)"

# Normalize recorded provenance fields identically (strip CR, trim leading/trailing whitespace)
PROV_START_NORM="$(echo "${PROV_START}" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
PROV_CMD_NORM="$(echo "${PROV_CMD}" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"

if [[ -z "${PROV_PID}" || -z "${PROV_START_NORM}" || -z "${PROV_CMD_NORM}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Missing or blank required provenance fields in ${PROVENANCE_FILE} (pid='${PROV_PID}', startTime='${PROV_START_NORM}', cmd='${PROV_CMD_NORM}'). Refusing to signal unverified target. Retaining files for manual disposition. Zero signals sent." >&2
  exit 1
fi

if [[ "${PROV_PID}" != "${TARGET_PID}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Provenance PID mismatch (recorded: '${PROV_PID}', target: '${TARGET_PID}'). Refusing to signal foreign PID. Retaining files for manual disposition. Zero signals sent." >&2
  exit 1
fi

ACTUAL_START="$(ps -p "${TARGET_PID}" -o lstart= 2>/dev/null | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' || true)"
ACTUAL_CMD="$(ps -p "${TARGET_PID}" -o command= 2>/dev/null | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' || true)"

if [[ -z "${ACTUAL_START}" || -z "${ACTUAL_CMD}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Failed to capture live ps identity for target PID ${TARGET_PID}. Refusing to signal target without identity verification. Retaining files for manual disposition. Zero signals sent." >&2
  exit 1
fi

if [[ "${ACTUAL_START}" != "${PROV_START_NORM}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Process start time mismatch for PID ${TARGET_PID} (recorded: '${PROV_START_NORM}', actual: '${ACTUAL_START}'). Stale PID reuse detected. Retaining files for manual disposition. Zero signals sent." >&2
  exit 1
fi

if [[ "${ACTUAL_CMD}" != "${PROV_CMD_NORM}" ]]; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] ERROR: Process command mismatch for PID ${TARGET_PID} (recorded: '${PROV_CMD_NORM}', actual: '${ACTUAL_CMD}'). Foreign process detected. Retaining files for manual disposition. Zero signals sent." >&2
  exit 1
fi

echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Verified provenance for owned PID ${TARGET_PID} (started: '${ACTUAL_START}'). Sending SIGTERM..."
kill -TERM "${TARGET_PID}" || true

# Wait up to 5 seconds for graceful exit
WAITED=0
while kill -0 "${TARGET_PID}" 2>/dev/null && [ ${WAITED} -lt 50 ]; do
  sleep 0.1
  WAITED=$((WAITED + 1))
done

if kill -0 "${TARGET_PID}" 2>/dev/null; then
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Process ${TARGET_PID} did not stop gracefully within 5s. Sending SIGKILL to owned PID..."
  kill -KILL "${TARGET_PID}" || true
  sleep 0.2
else
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Process ${TARGET_PID} stopped gracefully."
fi

rm -f "${PID_FILE}" "${PROVENANCE_FILE}"
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Stopped owned PID ${TARGET_PID}. PID and provenance files removed."

# Verify port 18085 closed verification (F07)
if command -v nc >/dev/null 2>&1; then
  if nc -z 127.0.0.1 18085 2>/dev/null; then
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] WARNING: Port 18085 still in use after stopping PID ${TARGET_PID}." >&2
  else
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Port 18085 verified closed."
  fi
fi

exit 0
