#!/usr/bin/env bash
# OV-R12-01 red/green probe (fix-wave #2 G5): the retention prune must keep exactly the newest
# MC_BACKUP_RETAIN archives (+ their sha256 sidecars), report the REAL number pruned, and report
# pruned:0 on an empty directory. Runs scheduled-dump.sh with fake pg_dump/pg_restore so no
# database or provider is touched (OpenCode leg-2 verify-R12-multistale-probe method).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
WORK="$(mktemp -d /tmp/g5-dump-prune.XXXXXX)"
mkdir -p "$WORK/bin"
cat > "$WORK/bin/pg_dump" <<'EOF'
#!/usr/bin/env bash
# fake: -f <file> ... <dsn> — write a plausible archive body
out=""
prev=""
for a in "$@"; do
  if [ "$prev" = "-f" ]; then out="$a"; fi
  prev="$a"
done
printf 'synthetic archive body\n' > "$out"
EOF
cat > "$WORK/bin/pg_restore" <<'EOF'
#!/usr/bin/env bash
echo "TABLE DATA - public - matters"
EOF
chmod +x "$WORK/bin/pg_dump" "$WORK/bin/pg_restore"
export MC_BACKUP_DSN="postgres://synthetic:synthetic@localhost:1/db?sslmode=disable"
export MC_BACKUP_RETAIN=2
export MC_BACKUP_PG_DUMP="$WORK/bin/pg_dump"
export MC_BACKUP_PG_RESTORE="$WORK/bin/pg_restore"

fail=0
# Case 1: four old dumps + one new run → exactly RETAIN(2) dumps must remain, pruned:3.
D="$WORK/four-old"
mkdir -p "$D"
for i in 1 2 3 4; do
  printf 'old\n' > "$D/mcapi-2026010${i}T000000Z.dump"
  printf 'old-sha\n' > "$D/mcapi-2026010${i}T000000Z.dump.sha256"
done
OUT="$(MC_BACKUP_DIR="$D" bash "$REPO/ops/backup/scheduled-dump.sh")"
DUMPS="$(ls -1 "$D"/mcapi-*.dump 2>/dev/null | wc -l | tr -d ' ')"
SIDECARS="$(ls -1 "$D"/mcapi-*.dump.sha256 2>/dev/null | wc -l | tr -d ' ')"
PRUNED="$(printf '%s' "$OUT" | sed -n 's/.*"pruned":\([0-9]*\).*/\1/p')"
echo "case1 dumps=$DUMPS sidecars=$SIDECARS pruned=$PRUNED"
[ "$DUMPS" = "2" ] || { echo "FAIL case1: expected 2 dumps, got $DUMPS"; fail=1; }
[ "$SIDECARS" = "2" ] || { echo "FAIL case1: expected 2 sidecars, got $SIDECARS"; fail=1; }
[ "$PRUNED" = "3" ] || { echo "FAIL case1: expected pruned:3, got $PRUNED"; fail=1; }

# Case 2: empty directory → one new archive, pruned:0.
D2="$WORK/empty"
OUT2="$(MC_BACKUP_DIR="$D2" bash "$REPO/ops/backup/scheduled-dump.sh")"
DUMPS2="$(ls -1 "$D2"/mcapi-*.dump 2>/dev/null | wc -l | tr -d ' ')"
PRUNED2="$(printf '%s' "$OUT2" | sed -n 's/.*"pruned":\([0-9]*\).*/\1/p')"
echo "case2 dumps=$DUMPS2 pruned=$PRUNED2"
[ "$DUMPS2" = "1" ] || { echo "FAIL case2: expected 1 dump, got $DUMPS2"; fail=1; }
[ "$PRUNED2" = "0" ] || { echo "FAIL case2: expected pruned:0, got $PRUNED2"; fail=1; }

rm -rf "$WORK"
if [ "$fail" = "0" ]; then echo "G5 PROBE: ALL PASS"; else echo "G5 PROBE: FAIL"; exit 1; fi
