#!/bin/bash
# mint-token.sh — hand out synthetic walkthrough bearer tokens (CO-17, D-1(b)).
#
# Tokens are opaque strings ("tok-<subject>"); the stub IdP (up.sh) maps them to
# an introspection answer for the matching subject. Roles are NOT in tokens —
# they live in workspace memberships granted via the API during the walkthrough.
#
# Usage:
#   mint-token.sh <user>            print the bearer token for one user
#   mint-token.sh --all             list all 5 synthetic principals
#   mint-token.sh --u7              print a fresh UUIDv7 (Idempotency-Key)
#   mint-token.sh --example <user>  print a ready-to-paste curl example
set -euo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH

API_PORT="${MC_WT_API_PORT:-18083}"
API="http://127.0.0.1:${API_PORT}/api/v1"

persona() {
  case "$1" in
    wt-alice) echo "OWNER persona" ;;
    wt-binh) echo "EDITOR, designated verifier" ;;
    wt-editor2) echo "EDITOR (submit/verify separation)" ;;
    wt-cuc) echo "VIEWER persona" ;;
    wt-dung) echo "non-member persona (negative cases)" ;;
    *) return 1 ;;
  esac
}

usage() {
  echo "usage: mint-token.sh <wt-alice|wt-binh|wt-editor2|wt-cuc|wt-dung>" >&2
  echo "       mint-token.sh --all | --u7 | --example <user>"
  exit 2
}

u7() {
  python3 - <<'PY'
import os, time
ms = int(time.time() * 1000)
b = bytearray(os.urandom(16))
b[6] = (b[6] & 0x0F) | 0x70
b[8] = (b[8] & 0x3F) | 0x80
b[0:6] = ms.to_bytes(6, "big")
h = b.hex()
print(f"{h[0:8]}-{h[8:12]}-{h[12:16]}-{h[16:20]}-{h[20:32]}")
PY
}

[[ $# -ge 1 ]] || usage
case "$1" in
  --u7)
    u7
    ;;
  --all)
    for u in wt-alice wt-binh wt-editor2 wt-cuc wt-dung; do
      printf '%-12s %-40s tok-%s\n' "$u" "$(persona "$u")" "$u"
    done
    ;;
  --example)
    [[ $# -eq 2 ]] || usage
    U="$2"
    persona "$U" >/dev/null || usage
    P="$(persona "$U")"
    KEY="$(u7)"
    cat <<EX
# Example — create a workspace as ${U} (${P}). The Idempotency-Key is a fresh
# UUIDv7 (macOS uuidgen emits v4, which the API contract rejects).
curl -sS -X POST "${API}/workspaces" \\
  -H "Authorization: Bearer tok-${U}" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: ${KEY}" \\
  -d '{"name":"Walkthrough WS"}'
EX
    ;;
  *)
    U="$1"
    persona "$U" >/dev/null || usage
    echo "tok-$U"
    ;;
esac
