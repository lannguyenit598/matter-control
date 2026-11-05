# R12 — Scheduled-dump retention (independent OpenCode leg 2)

- Anchor: HEAD `bb54d6e` (`codex/unified-project-flow`), pinned tree `/private/tmp/mc-opencode-verify-wave-20261031/snapshot-commit2`.
- Target: `ops/backup/scheduled-dump.sh`, blob `25ad1e0…` (3155 bytes) at `bb54d6e`.
- Owner container: `mc-opencode-verify-20261031` (postgres:18.6-alpine, 127.0.0.1:55432), synthetic DB `mcverify` (`backup_probe`, 1 row).
- Harness: `backup-bin/pg_dump` + `backup-bin/pg_restore` route through the container (the author's "container-routed" pattern); host DSN 127.0.0.1:55432 → container 127.0.0.1:5432. First attempt failed with `backup archive lists no TABLE DATA entries` because of a **harness** bug on macOS bash 3.2 (`set -u` + empty `args[@]` → `unbound variable` in the pg_restore wrapper), not a product defect; wrapper fixed, archives then list 41 TABLE DATA entries. The earlier failed attempt left dumps behind (script writes before validating), see defect B trigger.
- Runs: `commands/verify-R12-scheduled-dump-3x/`, `commands/verify-R12-multistale-probe/` (stdout raw/final, stderr, meta, UTC bounds, DSN-scrubbed).

## Result — literal R12 procedure: PASS

3× `bash ./scheduled-dump.sh` with `MC_BACKUP_RETAIN=2`:

| run | stamp | exit | table_data_entries | retained | pruned (reported) | pruned (actual) |
|---|---|---|---|---|---|---|
| 1 | 20261101T004822Z | 0 | 41 | 2 | 1 | 0 |
| 2 | 20261101T004824Z | 0 | 41 | 2 | 1 | 0 |
| 3 | 20261101T004825Z | 0 | 41 | 2 | 1 | 1 |

- End state: exactly 2 `.dump` + 2 `.sha256` sidecars (004824Z, 004825Z).
- Sidecar integrity: `sha256(dump)` = `b97ceac6…` = sidecar content.
- Archives parse and list 41 `TABLE DATA` entries (script self-check passes).

So the packet's R12 acceptance ("run the script 3× with RETAIN=2 → keeps exactly N") **passes**, and the author's "prune verified" claim is reproducible for exactly that sequence. It is not a general retention guarantee.

## Defect (new finding OV-R12-01, P2) — prune loop is a no-op once ≥2 archives are stale

`ops/backup/scheduled-dump.sh` L51:

```bash
for old in "$(ls -1t "$MC_BACKUP_DIR"/mcapi-*.dump 2>/dev/null | tail -n +$((RETAIN + 1)))"; do
  rm -f "$old" "$old.sha256"
  PRUNED=$((PRUNED + 1))
done
```

The command substitution is **quoted**, so it yields a single word. Two reproducible consequences:

- **≥2 stale archives → nothing is deleted.** One multiline "filename" is passed to `rm`; `rm -f` fails for it, the script has no `set -e`, so the loop continues and increments `PRUNED` regardless.
  Probe (`verify-R12-multistale-probe`, dir `probe-stale`): 4 old dumps + 1 new, `RETAIN=2` → JSON `"pruned":1`, **after = 5 dumps / 5 sidecars** (expected 2). The stated header contract ("keeps the most recent MC_BACKUP_RETAIN archives, delete the rest") is violated.
- **0 stale archives → `pruned` is falsely 1.** The empty substitution still yields one empty word; `rm -f "" ""` exits 0 (verified: `for x in "$(true)"; do echo "iter=[$x]"; done` prints `iter=[]`, `rm -f "" rc=0`), so `PRUNED` increments on every run.
  Probe (`probe-empty`): empty dir, 1 run → 1 dump on disk, JSON `"pruned":1`.

Realistic triggers for ≥2 stale: lowering `MC_BACKUP_RETAIN` (nothing is deleted), or any run that exits at L47 after writing the archive (validation failure leaves the dump behind — the second such failure crosses the threshold permanently). Effect: unbounded growth of the second-location backup directory until the disk fills, while the JSON metric reports successful pruning. Not a data-loss defect; a retention/monitoring defect in a pilot-facing ops script.

Recommendation (not applied — read-only QA): iterate with `while IFS= read -r old; do … done < <(ls -1t … | tail -n +$((RETAIN+1)))` (or `mapfile`), count only successful `rm`s, and add negative tests for the empty-dir and ≥2-stale cases.

## Verdict

- **R12 (packet procedure): PASS** — 3× RETAIN=2 end state exact, archives valid, sidecars match.
- **New finding OV-R12-01: OPEN, P2** — retention no-op with ≥2 stale archives + false `pruned` count in all cases.
- No fix performed; source untouched. Verdict binds `bb54d6e`; any later change to `scheduled-dump.sh` keeps this anchor and needs a re-run.
