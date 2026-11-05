#!/bin/sh
# Repair helper for the :3000 CSS-500 incident.
# Written by actual ZCode for Local Codex (owner of the :3000 runtime). ZCode DID NOT run it
# (boundary: :3000 is Codex-owned; the PO chose handoff). Read README.md in this folder first.
# Restart step uses YOUR original command — edit that line before running.
set -eu

# repo root = 4 levels up from this script (docs/testing/<ns>/incident-css-3000/ -> repo root)
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../../.." && pwd)
APPDIR="$ROOT/apps/frontend"
NEXTDIR="$APPDIR/.next"

echo "[1/4] Inspect the current :3000 listener"
PID=$(lsof -tiTCP:3000 -sTCP:LISTEN -nP || true)
if [ -z "$PID" ]; then
  echo "  no listener on :3000 — nothing to stop; continue to step 3"
else
  ps -p "$PID" -o pid,lstart,command || true
  printf "  stop PID(s) %s now? type 'yes' to continue: " "$PID"
  read -r ANSWER
  if [ "$ANSWER" != "yes" ]; then echo "aborted"; exit 1; fi
  # shellcheck disable=SC2086
  kill $PID
  sleep 2
  if lsof -tiTCP:3000 -sTCP:LISTEN -nP >/dev/null 2>&1; then
    echo "  :3000 still listening — investigate before touching .next"; exit 1
  fi
fi

echo "[2/4] Remove stale build state (build artifact only, never source)"
rm -rf -- "$NEXTDIR"
echo "  removed $NEXTDIR"

echo "[3/4] Restart with YOUR original command (EDIT THIS LINE if different), e.g.:"
echo "  cd '$APPDIR' && pnpm dev    # REST mode via .env.local, as before"

echo "[4/4] Verify CSS serves 200 after restart"
echo "  CSSHREF=\$(curl -s http://127.0.0.1:3000/my-actions | grep -oE 'href=\"[^\"]*\\.css[^\"]*\"' | head -1 | sed 's/href=\"//; s/\"\$//')"
echo "  curl -s -o /dev/null -w '%{http_code} %{content_type}\\n' \"http://127.0.0.1:3000\$CSSHREF\""
echo "  expect: 200 text/css"
