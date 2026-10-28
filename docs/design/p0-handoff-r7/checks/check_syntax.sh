#!/usr/bin/env bash
set -euo pipefail

TARGET_HTML="/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r7/prototype.html"
EXTRACTED_JS="/tmp/r7-extracted-logic.js"

python3 -c "
import re
with open('$TARGET_HTML', 'r', encoding='utf-8') as f:
    text = f.read()
m = re.search(r'<script id=\"concept-logic\">(.*?)</script>', text, re.DOTALL)
if not m:
    raise RuntimeError('concept-logic script not found in prototype.html')
with open('$EXTRACTED_JS', 'w', encoding='utf-8') as out:
    out.write(m.group(1))
"

echo "Extracted concept-logic script: $(wc -c < "$EXTRACTED_JS") bytes."
node --check "$EXTRACTED_JS"
echo "PASS: node --check verified zero syntax errors in prototype.html concept-logic."
