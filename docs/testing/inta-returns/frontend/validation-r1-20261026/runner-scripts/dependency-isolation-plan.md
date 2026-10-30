# Private Dependency Isolation Plan (R1 Assessment)

**Workstream**: MC-002-INTA-FE-VALIDATION-R1  
**Requirement Traced**: INT-ISO-01, FEVAL-F05  
**Status**: ASSESSMENT_AND_PLAN_ONLY / NO_DEPENDENCY_MUTATION_IN_R1  
**Author**: Actual Antigravity (Gemini 3.8 Flash High)  

---

## 1. Actual Limitation in Historical Initial Validation Run

In the initial MC-002-INTA-FE-VALIDATION run:
- The product snapshot (`/tmp/mc002-inta-fe-validation-20261026/product-snapshot/node_modules`) was created using an APFS copy-on-write clone (`cp -cR`), ensuring private physical isolation without write-through.
- However, the harness snapshot (`/tmp/mc002-inta-fe-validation-20261026/harness-snapshot/node_modules`) was created using a direct symbolic link (`ln -s /tmp/mc002-inta-fe/node_modules ...`).
- **Limitation**: As diagnosed in Codex intake finding **FEVAL-F05**, a direct symlink to `/private/tmp/mc002-inta-fe/node_modules` does not meet the strict handoff mandate: *"Use only verified already-installed pinned dependencies in a private copy/clone that cannot write through to originals."*
- Although pre/post verification confirmed that product source `3e5a642` and harness source `48cc03e` remained clean, **source tree cleanliness alone does not prove that shared node_modules was not written to**. Symlinking introduced a potential write-through surface.

---

## 2. Technical Root Cause in pnpm Virtual Store

The harness borrows dependencies from the product template (`/tmp/mc002-inta-fe/node_modules`) because the temporary harness does not have its own independent installation to prevent network downloads and lockfile updates.

`pnpm` structures `node_modules` as:
1. Top-level symlinks (e.g. `node_modules/next -> .pnpm/next@16.4.2.../node_modules/next`).
2. Virtual store directory (`node_modules/.pnpm`).

When `ln -s /tmp/mc002-inta-fe/node_modules harness-snapshot/node_modules` was used, any write to `harness-snapshot/node_modules/.cache` or `.next` inside node_modules resolved directly into `/tmp/mc002-inta-fe/node_modules`.

---

## 3. Plan for Private Dependency Isolation in Future Execution

For any future live validation execution (when authorized by Codex/PO), the following procedure will be enforced:

### 3.1 Pre-Execution Preparation (APFS Clone / Deep Copy)
Instead of a symbolic link, create an isolated directory clone of the pinned `node_modules`:

```bash
# Remove any existing symlink
rm -f "$HARNESS_SNAPSHOT/node_modules"

# Perform an APFS copy-on-write clone (or deep copy if not on APFS)
# On macOS, cp -c creates an instant clone that shares blocks until written to
cp -cR /tmp/mc002-inta-fe/node_modules "$HARNESS_SNAPSHOT/node_modules"
```

### 3.2 Preflight Isolation Verification
Before any command or process is spawned, verify:
1. `[ ! -L "$HARNESS_SNAPSHOT/node_modules" ]` — Must NOT be a symlink.
2. `[ -d "$HARNESS_SNAPSHOT/node_modules" ]` — Must be a real directory.
3. Path resolution check:
   ```bash
   resolved_target=$(readlink -f "$HARNESS_SNAPSHOT/node_modules" || realpath "$HARNESS_SNAPSHOT/node_modules")
   if [[ "$resolved_target" == *"/tmp/mc002-inta-fe/node_modules"* ]]; then
     echo "ERROR: node_modules resolves back to product source directory!" >&2
     exit 1
   fi
   ```
4. Record SHA-256 baseline of critical binaries (`node_modules/.bin/next`).

### 3.3 Post-Execution Integrity Check
After execution:
1. Verify original `/tmp/mc002-inta-fe/node_modules` modification timestamp and content hashes remain unchanged.
2. Verify original `/tmp/mc002-inta-fe` and `/tmp/mc002-inta-harness` git status remain clean.

---

## 4. Current R1 State: Zero Dependency Mutation

In accordance with R1 instructions:
- **No dependencies have been copied, cloned, installed, downloaded, or modified in this step.**
- All R1 activities are strictly documentary, analytical, and in-process unit testing (`selfcheck-r1.py`).
