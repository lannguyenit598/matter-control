# MatterControl source layout and verified local commits

Date:2026-10-26. Task MC-SOURCE-01. Owner: Local Codex. Authority: direct PO instruction to bring the coded source into this repository. This supersedes the earlier governance-only layout for this source import; it does not authorize new product behavior or bypass security/release gates.

## Source now visible in this repository

| Destination | Imported source | Local source revision and state |
|---|---|---|
| `apps/backend/` | `/private/tmp/mattercontrol-backend-be01` | Branch codex/mc-be-01, HEAD136eae6ad403ae3ede797faf6a0d6179c3b95685 plus reviewed/staged R1 patch33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e;137files |
| `apps/frontend/` | `/private/tmp/mc002-inta-fe` | Clean codex/mc-002-inta-fe at3e5a642479acb789eb210e73fba956f3e85082e3;323files, original Next.js baseline |
| `tools/inta-harness/` | `/private/tmp/mc002-inta-harness` | Clean codex/mc-002-inta-harness-r4 at48cc03e949d66fc47a7d304413621eb79804e6c1;25files, temporary transport harness |

Exact485file/mode/size/SHA256 and source-index provenance: [manifest](../source-import/manifest.json). Source code, local tests, migration bundles, dependency locks and component instructions are copied byte-for-byte. Relative backend skill symlinks are preserved within the component. No nested Git repository, ignored/untracked source-tree file, dependency directory, binary/build cache, runtime state or actual env file is imported.

## What was committed elsewhere, and what was not

- C01 accepted native backend:52b60a4617081c41b949f2242e1784238c170f75 in `/private/tmp/mattercontrol-step022-backend-c01`, from the go-hexa-template clone. This is included by ancestry in BE01.
- BE01 initial service spine:136eae6,31files/+5243/-8 from52b60a4. Its nine-file R1 fix is fully staged but **not committed**; local Mimosa refused the commit. Imported backend includes those reviewed fix bytes, and its provenance must always name both HEAD and patch until a corrected canonical commit exists.
- INT-A harness commits: e25bbc6(initial),6e2f65b(R1),79322fc(R2),cfec869(R3),48cc03e(R4). These local commits are in the separate harness repository, not ancestors of MatterControl's governance history.
- Frontend source is the pinned baseline3e5a642. No completed MatterControl product UI or BE02 implementation is inferred from importing it. The user's separate live template checkout currently has its own newer fix/cve branch; it was not substituted for the pinned tested baseline.

These local objects/branches were verified directly. Remote publication was not checked. MatterControl itself has **no configured remote**, and its branch has no upstream. No remote was invented/configured and no push occurred.

## Development routing and preserved history

For new source tasks, use the primary repository directories `apps/backend` and `apps/frontend`, after a permitted import commit/base has been recorded and the task's existing implementation gates are satisfied. Read each component's AGENTS/rules first. Module/package names, locks and behavior remain unchanged; this is not a module rename or framework migration. Each component remains its own build working directory; no new root Go/pnpm workspace or root CI pipeline is asserted.

Historical `/private/tmp` checkouts, commits, raw logs and hash-pinned packets remain valid evidence. Existing already-dispatched runtime tasks keep their exact assigned checkout/process/barriers until a new explicit task updates their paths. Do not bulk-rewrite old evidence or run/import a second harness against the live environment.

When a normal permitted commit records this import, that primary commit plus the manifest can serve as the exact source base for future assignments. No merge of template Git histories is needed. Until then the import is an uncommitted source snapshot, not a new canonical accepted commit. Importing to this path does not evade the unresolved Mimosa finding or grant permission to commit elsewhere.

## Runtime limitations

The backend MatterControl increment is Create/Get Requirement at the service boundary; the existing userapi binary remains the native User server. Product HTTP/auth belongs to pending BE02. Frontend is the reusable Task/demo baseline; it is not the completed legal-work product.

The harness is intentionally copied unchanged for source visibility and comparison. Its tsconfig/Vitest aliases still refer to `/tmp/mc002-inta-fe`, and its original runtime borrows dependencies not declared as a complete standalone package. Portability/runtime setup from the new location is NOT_VERIFIED; no install, build, server start, DB request, live guard or lifecycle script was run. Do not execute stop scripts from the copied location against original owned processes. A later scoped portability task must update dependencies/paths and validate the relevant guards before use.

## Commit status and verification

All485copied files are verified against their origins and none is ignored by the destination Git rules. Original source HEAD/index/status bytes are rechecked after copying. This is source-integrity evidence, not a new functional test run. Existing code reviews/tests retain their original paths and limits.

The known official Mimosa gate refusal remains unresolved. No stage/commit was attempted from Codex, no hook/control state or immutable provisioning evidence was modified, and no alternative execution context was used to evade it. The existing [resolution dossier](../testing/be01-r1-commit-intake/MIMOSA-FINDING-RESOLUTION.md) remains the operator action. Source consolidation cannot establish production/auth/cost/recovery readiness.
