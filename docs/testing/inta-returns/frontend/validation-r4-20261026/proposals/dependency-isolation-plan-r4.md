# MC-002-INTA-FE-DEPENDENCY-ISOLATION-PLAN-R4

**Document ID**: MC-002-INTA-FE-DEPENDENCY-ISOLATION-PLAN-R4  
**Status**: PLAN_ONLY / CANDIDATE_STAGING / LIVE_RUNTIME_NOT_RELEASED  
**Author**: Antigravity (Frontend Execution Owner)  
**Coordinating Role**: Codex (PM / Coordination Owner)  
**Independent Review**: OpenCode  
**Normative Reference**: INTA-1§2 (Private attempt isolation, secret leakage prevention, no-store/default-off constraints)

---

## 1. Scope Boundary for R4

Under the current authorization for MC-002-INTA-FE-VALIDATION-R4:
1. **Zero Filesystem Mutation of Dependencies**: No dependencies are copied, downloaded, installed, or modified in R4.
2. **Frozen Read-Only Roots**:
   - Original Frontend: `/tmp/mc002-inta-fe` (`3e5a642`) — byte-frozen read-only.
   - Original Harness: `/tmp/mc002-inta-harness` (`48cc03e`) — byte-frozen read-only.
   - Guard Source: `/tmp/mc002-inta-harness/src/guards.ts` (SHA-256 `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928`) — read-only.
3. **Plan Purpose**: This document specifies the private attempt staging architecture required when the Product Owner and Codex authorize live runtime execution in subsequent stages.

---

## 2. Staging Architecture for Future Runtime Execution

When runtime execution is eventually authorized, the harness requires access to `node_modules` without compromising the read-only integrity of the baseline sources or leaking private artifacts.

### 2.1 Private Attempt Scratch Worktree
- Every execution run must execute within an isolated attempt directory:
  `/tmp/mc002-inta-evidence/frontend/attempt-<RUN_ID>/`
- The attempt directory contains:
  - `run-state/` (bound via `MC_INTA_STATE_DIR`) for observer states, locks, and logs.
  - `isolated-harness/` (a private copy/worktree of the harness).
  - Variant-specific subdirectories (`API_TOKEN_nonempty/`, `NODE_ENV_production/`, etc.).

### 2.2 Symlink & Realpath Escape Prevention
A primary security concern in Node.js staging environments is symlink escape via `.bin/` or `.pnpm/` virtual store structures.
1. **Canonical Path Verification**:
   Before launching any runner or compiler, all symlinks within `node_modules/.bin` and `node_modules` must be resolved using `os.path.realpath` / `fs.realpathSync`.
2. **Path Boundary Check**:
   Any link whose real target resolves to:
   - A parent directory outside the permitted project/harness tree;
   - Any sensitive user path (`~/.ssh`, `~/.aws`, `~/.codex`, `/etc`);
   - Or an unverified external directory;
   must immediately cause pre-flight failure, aborting before any process execution.
3. **Dangling Symlink Rejection**:
   Symlinks pointing to nonexistent targets must be flagged as configuration errors.

### 2.3 APFS Copy-on-Write (CoW) Cloning
To avoid network downloads (`npm install`) and multi-gigabyte disk duplication while ensuring write-isolation:
- **macOS (APFS)**: Use native Copy-on-Write clones via `cp -c -R <source> <target>`.
  - CoW clones create near-instantaneous metadata pointers.
  - If a runtime build or compiler modifies a file, APFS copies only the modified blocks locally to the private attempt tree.
  - The source baseline at `/tmp/mc002-inta-fe` and `/tmp/mc002-inta-harness` remains completely byte-identical and unaffected.
- **Linux (Fallback)**: Use `cp --reflink=auto -R` on Btrfs/XFS, or hardlinks for read-only static files combined with separate build output caches.

### 2.4 Strict Clean-Room Environment Propagation
The child environment must not inherit developer workstation configurations:
- `HOME` is overridden to a private scratch directory within the attempt folder.
- `TMPDIR` is bound to the attempt scratch folder.
- Sensitive environment variables are verified absent via the strict bounded allowlist (`ALLOWED_ENV_KEYS`).

---

## 3. Verification Strategy with Filesystem Doubles

In R4, this isolation strategy is verified without touching live dependencies through mock filesystem doubles in `runner/selfcheck-r4.py`:
1. **Refusal on Existing Directory (Test 41 & 44)**: Verifies that attempt directory collisions are strictly rejected before any state is written.
2. **Atomic State Writing & Directory Durability (Test 32 & 33)**: Verifies that state writes cannot corrupt or cross boundaries, propagating write errors fail-closed and ensuring parent directory fsync.
3. **Bounded Terminate Refusal (Test 26 & 27)**: Verifies that process management is strictly bound to verified owned handles, preventing signals to unowned external processes.

---

## 4. Gates Required Before Runtime Release

Prior to live execution using this plan:
1. Product Owner and Solution Architect must issue formal authorization to stage dependencies.
2. Codex must verify SHA-256 hashes of `package.json` and lockfiles against review baseline.
3. Staged directory pre-flight must confirm zero git mutations, zero untracked root files, and verified symlink boundaries.
