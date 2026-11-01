#!/bin/zsh
# UX probe (F7): the 22-route timeline, rerun on the wave's prod build (F4 fix D-2).
# Method: server HTML at t=0 (curl, no JS) with Cookie ui-locale=vi against the isolated prod
# server (next start, port 18923, API_MODE=rest with an unreachable API base → every page that
# needs data renders the localized ReadFailure; the layout, headings and chrome are still the
# real prod render). Assert per route: (1) <html lang="vi"> at t=0, (2) a vi string present,
# (3) an <h1 present (UX-L-05: failures keep the h1).
set -u
BASE=http://127.0.0.1:18924
OUT=docs/testing/mc-p1-fix-wave-20261031-r1/commands/probe-22-routes.log
routes=(
  /login
  /my-actions
  /my-reviews
  /matters
  /workspaces
  /workspaces/ws1
  /matters/m1
  /matters/m1/control-room
  /matters/m1/work
  /matters/m1/documents
  /matters/m1/documents/doc1
  /matters/m1/reviews
  /matters/m1/filings
  /matters/m1/filings/new
  /matters/m1/filings/f1
  /matters/m1/planning
  /matters/m1/agenda
  /matters/m1/data
  /matters/m1/history
  /matters/m1/work/i1
  /requirements/r1
  /nonexistent-route-404
)
: > "$OUT"
pass=0; fail=0
for r in "${routes[@]}"; do
  html=$(curl -s --max-time 10 -H "Cookie: ui-locale=vi" "$BASE$r")
  lang=$(echo "$html" | grep -o '<html lang="[^"]*"' | head -1)
  h1=$(echo "$html" | grep -oE '<h1[^>]*>' | head -1)
  vi_hit=$(echo "$html" | grep -c 'Không gian làm việc\|Đăng nhập\|Cần đăng nhập\|Không tìm thấy trang\|Việc của tôi\|Tạm thời không khả dụng\|hồ sơ này không khả dụng\|Hồ sơ')
  if echo "$lang" | grep -q 'lang="vi"' && [ "$vi_hit" -ge 1 ] && [ -n "$h1" ]; then
    echo "PASS $r lang=vi vi_strings=$vi_hit h1=present" >> "$OUT"
    pass=$((pass+1))
  else
    echo "FAIL $r lang='$lang' vi_strings=$vi_hit h1='${h1:-absent}'" >> "$OUT"
    fail=$((fail+1))
  fi
done
echo "SUMMARY pass=$pass fail=$fail of ${#routes[@]} routes; server=next start on 127.0.0.1:18924 (isolated wave prod build, API_MODE=rest with unreachable API); cookie=ui-locale=vi; t=0 server HTML (no JS)" >> "$OUT"
cat "$OUT" | tail -5
