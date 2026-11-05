## MC-002-VERIFY-021-RECHECK — Verdict

**PASS_WITH_LIMITATIONS** — narrow recheck of Low F1/F2/F3 and material-regression scan, against the exactly supplied snapshots only. No tools, no replay. All three corrections are substantively addressed in the supplied records; no material new regression found.

## Dispositions

**F1 — CLOSED (Low, evidence-completeness addressed).**
- `antigravity-execution.json` now records `stdout_artifact`/`installed_help_artifact`, `stderr: ""`, `command_flags` (`--mode plan --sandbox --model --effort high --output-format json --print-timeout 180s -p`), and a usage block (31726 in / 6835 out / 3196 thinking / 38561 total; input+output = 38561, arithmetic consistent) matching the usage embedded in `antigravity-output.json` (`status SUCCESS`, `num_turns 1`, duration 59.82s < elapsed 63.66s — plausible CLI overhead; conversation `36d93b38-79c3…` matches the previously cited ID).
- `agent-help.json` supplies raw output previously absent: `agy --version` → `1.4.7`, exit 0; `agy --help` → full usage (stderr, exit 0), and `zcode` (node cjs) `--help` → `zcode 0.17.0`, exit 0. Every flag used in `command_flags` appears in the `agy` help text — internally consistent.
- Residual (kept, not blocking): token counts/exits are CLI-self-reported; no hash agreed for `agent-help.json`/`antigravity-output.json`; help check timestamped 14:09:13 but the audit run's wall time is not juxtaposed in the packet; `zcode --help` succeeding does not contradict the recorded direct-probe exit 1 (help does not load `zcode-builtin.json`).

**F2 — CLOSED.** `local-backup-restore.md` §9 now reads "Tmpfs data ceases to exist at container stop"; validation doc says "tmpfs data was discarded after evidence capture"; recheck manifest `cleanup` string says the same. Command log (34–42) shows only inspect/logs/stop/inspect for label-verified owned containers — no volume, prune, or delete operations. Consistent across all three documents.

**F3 — CLOSED.**
- (a) Readiness polls now flow through `run(expected="any")` and appear exhaustively in the command log: source commands 06–09 exit 1 (transient `head: …/postmaster.pid: No such file or directory`), 10 exit 0, then confirming `pg_isready` (11); target 22–23 exit 1, 24 exit 0, confirming (25). This matches "every readiness poll is now logged, including expected transient failures."
- (b) The sequence probe is now a single `BEGIN; … INSERT … RETURNING id; ROLLBACK;` block (cmd 29 stdout: `BEGIN / DO / md5 / 101 / INSERT 0 1 / ROLLBACK`), immediately followed by a separate count assert returning `100` (cmd 30). `validation_effects` explicitly qualifies that sequence values consumed by validation remain nontransactional — stated, not overclaimed.

**Rerun regression scan — no defect found.** Two new token-labeled containers (distinct IDs, `NetworkMode none`, `Mounts: []`, `Binds: null`, `PortBindings {}`, tmpfs `/var/lib/postgresql` 256m, 256MB/1CPU) verified in recorded inspects; trust-auth warnings retained in logs (36/40.stderr). Archive SHA `a41ab5b6…` / 5957 bytes matches the doc; content md5 `09dfcf31…` identical on source (14) and restored target (29); sequence 101; markers `2` on source (34); corrupt-copy exit 1 (18); negative FK/CHECK/PK exits 3 (31–33) with matching server-log lines in 40.stderr; `pg_restore --list` TOC coherent; timings (restore-only 0.046824s, recovery 1.2475s, total 7.2956s) match manifest and stated UTC window; status `PASS_LOCAL_TOOLING_DRILL`. Initial run remains historical as stated; no retroactive replacement.

## Non-blocking residuals (Info-level, not new Low findings)

1. After the three negative inserts (exit 3 mid-transaction; rollback occurs only via connection termination), target row count is not re-asserted — safe by PostgreSQL semantics but unasserted.
2. `opencode-execution.json` (the prior review's own execution evidence) is referenced but not supplied in this packet.
3. Verbatim report still floats the unsourced "10 ms / 10–20 ms CPU" Workers figures — confirmed preserved-only and unadopted (F4 unchanged).

## Limits of this recheck

Textual/numeric cross-consistency within supplied snapshots only; I cannot verify those files exist on disk, the rebase branch/base, or that the recheck run actually occurred, and I trust self-reported exits, hashes, tokens, and provenance as presented. No hash recomputation or runtime replay. No product, architecture, Cloudflare, cost, or release approval is expressed or implied.

MC-002 remains **OWNER_VALIDATION_BLOCKED / WAITING_REMAINING_APPROVALS**; this recheck closes the three Low findings on evidence supplied and does not clear the Quality Gate (owner manual PoCs and POC-02-07 remain NOT_RUN).
