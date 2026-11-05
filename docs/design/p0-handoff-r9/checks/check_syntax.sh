#!/usr/bin/env bash
# Extract each inline script and run node --check. Output goes to a run-scoped
# directory passed as $1 so no pinned log is ever overwritten.
set -euo pipefail

PKG="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-${TMPDIR:-/tmp}/mc-r8-syntax-$$}"
mkdir -p "$OUT"

extract() {
  python3 - "$1" "$2" "$3" <<'PY'
import re, sys
src, script_id, dest = sys.argv[1], sys.argv[2], sys.argv[3]
text = open(src, encoding='utf-8').read()
m = re.search(r'<script id="%s">(.*?)</script>' % re.escape(script_id), text, re.DOTALL)
if not m:
    raise SystemExit('script id=%s not found in %s' % (script_id, src))
open(dest, 'w', encoding='utf-8').write(m.group(1))
print('%s: %d bytes' % (script_id, len(m.group(1).encode())))
PY
}

extract "$PKG/prototype.html" concept-logic "$OUT/concept-logic.js"
node --check "$OUT/concept-logic.js"
extract "$PKG/study/participant-surface.html" study-logic "$OUT/study-logic.js"
node --check "$OUT/study-logic.js"
node --check "$PKG/checks/strict_dom.js"
node --check "$PKG/checks/check_mock_dom_bootstrap.js"

echo "PASS: node --check reports zero syntax errors in every inline script and check module."
echo "Extracted copies: $OUT"
