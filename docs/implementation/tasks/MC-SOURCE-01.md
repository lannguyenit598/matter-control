# MC-SOURCE-01 — import coded source into MatterControl

Status: IN_REVIEW / IMPORT_COMPLETE / COMMIT_BLOCKED. Owner: Local Codex. Priority:P0. Requirement linkage: source continuity, MC-BE-01, MC-002-INT-A and future BE02; no new FR or business policy. Reviewer: existing scoped source reviews retained; import integrity available for PO/independent inspection. No source-review or production approval is self-awarded.

Authority: PO explicitly selected “Đưa source vào repo này” after requesting a check of coded/committed work missing from this repository. Outputs: apps/backend, apps/frontend, tools/inta-harness, source manifest/layout, primary README/AGENTS routing and scoped workflow/status updates.

Inputs: verified backend136eae6+reviewed stagedpatch33297560, frontendbaseline3e5a642, harness48cc03e, source instructions and existing review/gate records. Dependency: ordinary supported Mimosa gate resolution before commit; no remote exists for push. No remote or execution-context workaround is authorized.

Allowed changes: new source snapshots under the three named component roots, docs/source-import/**, source-layout.md, this task, primary README/AGENTS routing and narrow workflow/status entries. Preserve imported component bytes/modes/symlinks, original source indexes/checkouts, template histories, frozen INT-A runtime and all unrelated dirty governance work. No new product features, package upgrades, module rename, implementation gate waiver, history merge, force push, credential/env/runtime copy or live resource mutation.

Acceptance:
1. Actual origin HEAD/branch and working-tree correction are explicit; no uncommitted patch is described as an existing commit.
2. All485Git-indexed source files copied with matching bytes/modes and safe internal symlinks; no nested Git metadata, dependency/build/runtime/private artifacts.
3. Every copied path is visible/not ignored in the destination; source HEAD/index/status unchanged.
4. README/source routing points to actual primary paths and discloses baseline/harness limitations.
5. Commit/push and gate status reported honestly; local import is not runtime verification or implementation authorization.

Checks: full source SHA256/mode/symlink comparison, source Git-state preservation, target ignore check and focused document/link/whitespace validation. Evidence: docs/source-import/manifest.json and checks.json. No functional baseline replay, install/build/server/DB/browser/lifecycle or provider action.

Next: use supported resolution of the existing Mimosa finding. Only after ordinary permission and a fresh staged/source review, record the import with an exact selected-path local commit. Do not include unrelated existing untracked/dirty files. Configure/push only to an explicitly supplied destination if requested; none is currently configured. Future source tasks should pin the permitted primary import commit and component paths.

Skipped: commit/push, harness portability, root CI and product tests. Risk: source is visible on disk but remains uncommitted; harness retains its original external aliases/dependency arrangement, and product HTTP/auth/frontend remain incomplete.
