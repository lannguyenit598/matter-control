# MC-P0-FINAL-SOURCE-RESTORE-R1 — Restore execution return

Owner: actual Local Codex, Restore session. Priority P0. Requirements NFR-003/004 + CL-07. Proposed status **IN_REVIEW**; local synthetic runtime result **PASS_LOCAL_SYNTHETIC_FINAL_SOURCE**. Reviewer: actual independent QA; primary Codex owns intake. This session did not author or change primary source or the pinned restore scripts. It does not award independent recovery acceptance.

## Identity, scope and inputs

Execution used Local Codex tools `exec_command` / `write_stdin`, RTK 1.1.0, Python 3.14.4, GNU Bash 3.2.57, Go 1.27.3 darwin/arm64, Docker client 29.9.2 and container pg_dump/pg_restore 17.10. Session model identity is GPT-6; exact deployment model identifier is not exposed and is not inferred from another agent.

Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base and closing HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. No Git mutation performed. All existing dirty work preserved.

All six PO-supplied SHA256 pins matched; input byte lengths are recorded in `inputs.json`. All 714 final-source entries and 102 R9 deliverables matched at opening and closing. The two retained successful runs and previous blocked final-source receipt were read and hashed without modification. Task/candidate-return checkpoint plus repeated matching source hashes established stable execution inputs; process liveness was not treated as a writer signal. No writer or subagent was created.

Changed files are confined to this new Restore namespace: `return.md`, `inputs.json`, `commands.json`, `resource-disposition.json`, `runs/20261028T075912Z/**` and `outputs-manifest.json`. Temporary orchestration wrappers and private logs are identified in the resource disposition. No primary source, task, workboard, contract or prior evidence was edited.

## Executed checks and observed acceptance

- Pure checker: `rtk proxy python3 -B -m unittest -v test_verify.py` from `ops/p0-local/restore-rehearsal`; **9/9 PASS**, exit 0. Shell syntax: `rtk proxy bash -n ops/p0-local/restore-rehearsal/run.sh`, exit 0. DSN helper replaces the database structurally with/without a query and rejects target-override parameters.
- Container identities, ownership labels, running state and loopback ports were verified before runtime; Docker system identifiers were distinct. Source `4d09d047440d…`, product-test, `127.0.0.1:55442`, cluster `7701370528434774049`; target `3c207de99a03…`, restore-target, `127.0.0.1:55443`, cluster `7701411304873082914`. Full identifiers are in `resource-disposition.json`.
- Exact pinned command `rtk proxy bash ops/p0-local/restore-rehearsal/run.sh`: **exit 0**, 2026-10-28 07:59:12–07:59:48 UTC. Script hash `8e4af211f4b6fadedccafa853d0939d1ef6b91b3cd2a1f602ebbb571477ec288`. It generated fresh `mc_rr_src_20261028t075912z` / `mc_rr_dst_20261028t075912z` / `mc_rr_neg_20261028t075912z`, checking absence before CREATE. Work/output roots were absent before execution. No full Go race suite ran alongside it.
- Boundary B source and restored target: **54/54 Matters**, exact identity and service fact sets match; all **34 table** census row counts/hashes and **3 object** path/SHA256 entries identical. All 3 stored objects passed readback hash validation, zero object failures. This count was measured, not an expected fixture constant.
- Post-boundary marker: source **1**, restored **0**. Repeated readback in a fresh Go test process was byte-identical. This is fresh-process service evidence, not an application-server/container restart.
- Corrupt and truncated archive: each pg_restore **exit 1**, **0 public tables** left in its disposable negative database. The negative database was removed by the pinned script and confirmed absent afterward.
- Altered object: service readback **exit 1**, 1 object failure; exact readback comparison detects the changed Matter facts. Missing object: readback **exit 0**, objectsChecked falls **3 → 2** and one Matter fact set differs; exact comparison detects it. No claim that missing content independently returns a nonzero service exit.
- Archive: 241,340 bytes; SHA256 `8aaf4175a3a7ccac3dbd2ecdf0ce4ed57a6a6de3c80a931fbcdb5fa9fabe0054`; measured dump 0.269 s and restore 0.216 s. These are local operation timings, not production RPO/RTO.

See `runs/20261028T075912Z/summary.json`, `acceptance.json`, census/readback/object comparisons, refusal receipts and exported private test logs. Same-session follow-up assertions used the pinned checker against good, altered and missing readbacks; all passed. Independent QA has not run in this session.

## Permissions, privacy and disposition

Initial sandbox Docker access was denied. The official `require_escalated` mechanism then authorized read-only inspection, the bounded runtime and exact own-run archive cleanup; each succeeded. The historical approval-quota failure remains historical and unchanged. There was no new approval-review rejection or quota failure and no bypass. A process-name inventory was blocked before launch; isolation used new databases and source checkpoints instead.

Only the allowlisted credential file was opened, in subprocess memory after regular-file/current-owner/mode0600/non-symlink checks. No credential-file hash, DSN, password, token, cookie or assertion was exported. Raw runtime/test logs remain private; `resource-disposition.json` links raw hashes to redacted public exports. Public evidence was scanned against actual in-memory DSNs/passwords and URI patterns, with zero matches. All database and Matter data in this run was synthetic.

Both original container IDs remained running. New source/target databases, source/restored object roots and private logs remain for QA. Only this run's container temporary dump paths and three local temporary archives were removed; their hashes/disposition were retained. Existing DBs, volumes, containers, native fixture55441, `mc_p0_run`, IdP and Cloud resources were not mutated.

Evidence limits: initial discovery/denied calls preceded the command recorder, so their exact UTC was not captured and is explicitly null. Runtime/preflight/postflight commands have UTC start/end/exit and export hashes. Individual internal shell commands were not traced, to avoid credential-bearing argv/logs; exact pinned script bytes, top-level argv/timing/exit, step timestamps and private raw lineage are retained. Do not read this as complete per-child process telemetry.

Skipped: source remediation, full BE/FE/race suites, HTTP/browser/human/IdP/Cloud/production checks and Git commit/merge/deploy. No MC-002/C01-PRODUCT/INT-A formal51/AC-137/Cloudflare/cost/release gate is closed.
Remaining risk: final independent QA must accept these exact bytes and evidence; local synthetic PASS establishes neither production recovery nor a production RPO/RTO commitment.
