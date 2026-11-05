# P0 final verification — manual assignments

Prepared by actual Local Codex, 2026-10-28. **PREPARED_NOT_DISPATCHED**. User requested copy/paste prompts; no external agent/extra Codex chat or runtime has been started by this preparation.

| Prompt | Paste into | Starts now? | Sole ownership |
|---|---|---|---|
| `01-INDEPENDENT-REVIEW.md` | OpenCode, or a new nonauthor Codex review session chosen by operator | Yes, source/pure tests only | `docs/testing/p0-final-parallel-20261028/review/` |
| `02-CODEX-RESTORE.md` | Separate Codex Restore session | Yes if official tool permissions available | New isolated restore DBs/object roots/evidence; never existing DB/volume |
| `03-CODEX-ZITADEL-RUNTIME.md` | Separate Codex Auth/Runtime session + human login | Yes, preflight/new local runtime; interactive steps need human | Lifecycle of new product Cloud-test runtime and auth fixtures |
| `04-ANTIGRAVITY-UI-E2E.md` | Antigravity | Source/spec now; runtime after ready + auth-slot-release receipts | UI QA artifacts/specs; no app edits or lifecycle |
| `05-CODEX-INTEGRATE-AND-FIX.md` | This primary Codex session after returns | Intake as returns arrive; fixes after testing slots/source freeze released | Only primary source writer; integration evidence/workboard |

User can copy the whole individual file, or paste a launcher telling the intended agent to read/perform that absolute file. Inability/quota of a named product is not a reason to fabricate its execution; operator may pick an actual nonauthor replacement and preserve identity.

## Dependencies and collisions

A independent review, B fresh-DB restore and C Cloud preflight can run in parallel while source is frozen. D starts mapping source/spec in parallel, then waits for actual C runtime-ready and auth-slot-released receipts. D does not steal port3000, reuse Cloud browser session or stop C processes. C must release disruptive auth/logout/role/outage testing before D runtime; ongoing refresh waiting may remain separate. B/C may share the task-owned PostgreSQL container only with different newly-created database names; never full destructive suites on shared runtime DB. E fixes only after readers/testing slots are released, then produces new pins and bounded rechecks.

No automatic global permission/provider change. Historical automatic-approval quota failure remains a real barrier until that mechanism works. No current prompt authorizes bypass, production/paid changes, or Git mutation. Source/test success alone cannot close browser/human/release gates.

## Baseline verified while preparing

Branch `codex/unified-project-flow`, HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`; 714 source pins verified without drift. Current author gates: backend764pass/4skip, FE444tests plus Webpackbuild;54Matter/3object restored snapshot predates the final legacy-owner correction. Final review delta/restore/browser/Cloud/human remain open. All exact hashes are in each prompt and `manifest.json`.
