# MC-BE-ECHO-REVIEW-CONFIRM-20261106 — Non-author confirmation pass (executed 2026-11-07)

**CONFIRMATION_REVIEW (non-author — OpenCode)**

- **Task**: MC-BE-ECHO-CONFIRM-20261106 (as part of MC-OPENCODE-CONFIRM-20261107, task A) · Routed by the Product Owner · Executed by an OpenCode session (independent, non-author; mode REVIEW_ONLY; the only file this pass wrote is this `confirmation.md`).
- **Reviewed artifact**: `docs/testing/be-echo-review-20261106-r1/report.md` (r1, PASS_WITH_LIMITATIONS, re-pin `b86152d2015d0b6b502dde55c48ced5814f42ea9`) + `commands/commands.md` + `evidence/`, labelled SELF-REVIEW / OWNER-CONFIRMATION by `ERRATUM-1-self-review-label.md`. Nothing here is a re-review; it verifies or refutes the recorded evidence only.
- **Environment**: OpenCode harness session; model GLM-5.3-Flash Free (provider opencode). Tools: go1.27.3 darwin/arm64, golangci-lint 2.14.0, docker 29.9.2, git 2.54.0 (Apple Git-157). All shell commands `rtk`-prefixed (RTK.md present); raw counts captured with `rtk proxy` to avoid the wrapper's output compression. Data: synthetic only. No code edits, no commits, no dependency installs, no hook refusals encountered, no processes killed that I did not start.

## Pre-flight (handoff §1)

- `rtk git rev-parse HEAD` → `5a00dbc162d3f8fd4d38cbcba1cc98122a4dd301` (exit 0, branch `develop`).
- `git diff --stat b86152d2..HEAD -- apps/backend` → **not empty**: 11 files (go.mod/go.sum — echo bump W1; term_sheet_handlers.go / port+domain mentions / termsheet_service.go + import test — deleted-count W2; matter.sql + mcsqlc + keyset test — keyset W3; `data_server_test.go.orig` removed in `6f8b2b8f`). Per handoff §1, untouched items bind to `b86152d2` bytes; touched-file-related items were re-checked at current HEAD **and**, where cheap, at the pin bytes (`git show b86152d2:…`). No writer session touched `apps/backend` during this pass (dirty files observed were FE/docs only — see Notes).
- `git status --porcelain` at start: 4 untracked handoff prompts + `docs/testing/fe-nextjs-review-20261106-r1/` (other sessions'; untouched).

## 1. Evidence integrity — CONFIRMED (2 count-dialect notes)

- Evidence directory exists with `report.md`, `commands/commands.md`, `ERRATUM-1-self-review-label.md`, `evidence/{make-check-b86152d2-exit0.log, explain-plans.md, gitleaks-backend-tree-8fp.json, govulncheck-followup.txt, migration-apply.log}`.
- **Binding scan substance reproduced exactly**:
  - Hand-written production SQL files = **exactly 2**: classification re-run (`rtk proxy grep -rlE '\.(Exec|Query|QueryRow)\(' --include='*.go' apps/backend/internal apps/backend/cmd` excluding tests, `/mcsqlc/`, `/repotest/`, `/pgtest/`) → **`bff_retention.go`, `matter_migrate.go`** and nothing else. Both verified parameterized/constant at pin and HEAD: `bff_retention.go:30-37` ctid-batched DELETE with `$1/$2` only; `matter_migrate.go:71` goose provider + `to_regclass` constant query.
  - String-concatenated SQL literals in non-test Go: **0 hits** — reproduced at pin (`git grep -nE '"(SELECT|INSERT|UPDATE|DELETE|WITH) .*\+"' b86152d2 -- apps/backend/internal apps/backend/cmd '/*.go'` → 0; exit 1) and at HEAD via the recorded command form (exit 1).
  - `fmt.Sprintf`-near-SQL candidate verified non-SQL: `filing.go:386` read in full — it is a `RejectedError` message (`"a filing cannot move from %s to %s; allowed: %v"`), **not SQL**.
- **Note 1 — raw-site count dialect**: the recorded "255 raw `Exec/Query` sites / 22 files" is not exactly reproducible with an unfiltered grep: `git grep at b86152d2` → **277 matches / 23 files**; working-tree count → 278 (+1 from fix-wave-touched touched files). The classification outcome (2 production files) is unaffected. Most plausible cause: rtk output compression or a slightly narrower pattern in the original run. Recorded as a transcript-fidelity note, not a finding refutation.

## 2. Objective gate re-run — CONFIRMED

- First attempt failed on **my own fixture error** (I passed `-p 5436:5432` after the image name in `docker run`, so no port mapping was published → connection refused; lint/tidy/sqlc all still passed). Recorded honestly per evidence rules; no code bearing.
- Corrected fixture: `docker run … -p 5436:5432 postgres:18-alpine` (`mc-oc-confirm-pg`, my own, torn down after the run; `pg_isready` green).
- `env MC_TEST_DATABASE_URL="postgres://mattercontrol:mattercontrol@127.0.0.1:5436/mattercontrol?sslmode=disable" rtk make check` in `apps/backend` → **exit 0**: sqlc-check, gofmt, `go mod tidy -diff`, golangci-lint (**0 issues**), `go test -race -count=1 ./...` all packages ok (productapi 2.78s, zitadel 3.26s, objectstore 5.53s, **postgres 105.24s**, pgtest, repotest/mattercontrol, sheet, system, app, config, domain/matter, policy, service, observability). This runs at HEAD bytes (includes the fix-wave commits); per handoff §1 this is the sanctioned current-tree gate with the drift limited to the fix-wave items (which Task B's own confirmation binds to the same commits).

## 3. Binding scan re-run (2 greps) — CONFIRMED (see Note 1 + Note 2)

- Grep 1: `rtk grep -rn "fmt\.Sprintf" --include='*.go' apps/backend/internal apps/backend/cmd | grep -v '_test.go' | grep -iE 'SELECT|INSERT|UPDATE|DELETE|WITH |string\(|sql'` → 1 production hit: `termsheet_service.go:354` — `fmt.Sprintf("%s: %s", line.Field.String(), value)` — an error-message/prefix join, **not SQL** (my filter's extra `string\(|sql` terms caught it; with strictly SQL keywords only the unfiltered result is 0 test-file catches).
- **Note 2 — filter nuance**: the recorded transcript's "1 hit = filing.go:386" implies the original filter included a keyword my strict-SQL set lacked (filing.go:386 contains `from %s`-style prose, so a JOIN/FROM/WHERE-style filter reproduces it; a strict SELECT/INSERT/UPDATE/DELETE filter yields 0 production hits). Either way the binding claim — **no fmt.Sprintf constructs SQL** — holds; both candidates are error messages. Record is not contradicted; the transcript's exact filter is not reproduced.

## 4. Spot-check of 3 of the 9 REMEDIATED dispositions — CONFIRMED

| Disposition | Verified bytes | Result |
|---|---|---|
| Membership CAS `matter.sql:132-134` | pin (`git show b86152d2`) and HEAD | `UPDATE matter_memberships SET status = sqlc.arg(status), revision = sqlc.arg(expected_revision) + 1 WHERE matter_id = $1 AND user_id = $2 AND revision = sqlc.arg(expected_revision) RETURNING revision;` at lines 132-134 in both — byte-identical (fix-wave touched only the keyset predicate at 147). Workspace-membership sibling CAS also present (107-109). |
| `0010_access_path_indexes.sql` | HEAD (file untouched by drift) | Exists; creates exactly the named indexes: `review_answers_cell_history (grid_id, version_id, question_id, answered_at DESC, id DESC)`, `matter_memberships_user (user_id, matter_id)`, `workspace_memberships_user (user_id, workspace_id)`, `matters_workspace (workspace_id, id)`; reversible `+goose Down` DROPs present. (EXPLAIN runtime numbers not re-measured — out of scope.) |
| `authorizeReceiptScope` `matter_service.go:299-319` | HEAD (file untouched by drift) | Present exactly at cited lines: ACTIVE workspace membership + per-represented-matter read authorization (`policy.DecideReadRequirement`) in the same tx; lost access → `port.ErrNotFound` (receipt invisible). Logic matches the report's description verbatim. |

## 5. Term-sheet spot-check — CONFIRMED

- **Rejected import does not burn the idempotency key**: at pin (`git show b86152d2:...termsheet_service.go`) — parse-rejection path `if len(rejected) > 0 { res.Rejected = rejected; return nil }` (lines 240-243) and the promoted-fact veto `if len(res.Rejected) > 0 { return nil }` (inside `replaceTermSheet`, 303-305) both return **before** `StoreReceipt` (only reached on the success path). Same regions verified unchanged at HEAD. No receipt is stored on any rejection → the key is not burned.
- **Promoted-fact protection named codes**: at pin — `Code: "promoted"` rejection rows at lines 293 ("cannot change") and 299 ("must stay in the sheet"); identical at HEAD.

## Verdict: **CONFIRMED_WITH_NOTES**

All five confirmation sections verify the r1 evidence; the two notes (transcript count dialect in §1, Sprintf-filter nuance in §3) concern recorded-transcript reproductions, not the review's verdicts. Nothing in the r1 report is refuted by this pass.

**Gate citation**: the r1 results may be cited in gates with attribution **"owner-confirmed + non-author-confirmed (OpenCode, this file)"**, subject to the r1's own recorded limitations (govulncheck followed up post-return; EXPLAIN measured on the disposable fixture; passes E/G skipped; org tenancy STILL_OPEN; real-bucket R2 NOT_RUN — all unchanged).

## Skipped / remaining risk

- Skipped deliberately (out of scope): Passes A/C/D/F re-runs, E/G, EXPLAIN re-measure, gitleaks re-runs, org-tenancy adjudication, the 4 P3 fixes' verification beyond fix-wave scope. NOT_RUN stays NOT_RUN.
- Remaining risk: conventions of dynamic checkout state — this pass verified bytes, not histories beyond the two commits; the concurrent FE writer session (page-metadata work) was active near the end but never touched backend or this file. The `make check` re-run ran at HEAD `5a00dbc1` (fix-wave included) rather than re-building `b86152d2` byte-for-byte — acceptable per handoff §1's drift rule; the drift is fully accounted for by the two Task-B-bound fix-wave commits plus the `.orig` removal.
