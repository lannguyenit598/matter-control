# Private Dependency Isolation Plan (R2 Revision)

**Task Reference**: MC-002-INTA-FE-VALIDATION-R2  
**Addresses**: Finding FEVAL-F05, OpenCode Review R1-C04  
**Status**: Planning Document Only (Zero Dependency Copy/Install in R2)  

---

## 1. Disclosure of Historical Limitation & Live Symlink Chain

As independently confirmed by OpenCode Review R1 (§2, R1-C04), the dependency layout during the initial validation run had the following symlink chain:

```text
/tmp/mc002-inta-fe-validation-20261026/harness-snapshot/node_modules
    └── (symlink) ──> /tmp/mc002-inta-harness/node_modules
                           └── (symlink) ──> /private/tmp/mc002-inta-fe/node_modules
```

While original sources at `/tmp/mc002-inta-fe` (`3e5a642`) and `/tmp/mc002-inta-harness` (`48cc03e`) remained clean and unmutated, symlinking does not provide true write-through isolation. Any temporary build artifacts, `.cache`, or mutation within `node_modules` could theoretically write into product dependency directories.

Furthermore, OpenCode identified a critical gap in the R1 plan: **verifying the top-level directory `realpath` alone is insufficient**, because pnpm and npm create nested symlinks under `node_modules/.bin/` and `node_modules/.pnpm/` pointing to external stores or parent directories.

---

## 2. Comprehensive Private Isolation Strategy for Future Runs

For any future live validation execution authorized by Codex, the harness snapshot must establish an entirely self-contained, isolated dependency tree.

### 2.1 Copy-on-Write Clone via APFS (`cp -cR`)
On macOS APFS, `cp -cR` creates instant copy-on-write clones without disk duplication and without symlinks:
```bash
# Target isolated directory in private scratch space
ISOLATED_HARNESS_DIR="/tmp/mc002-inta-fe-validation-r3/harness-isolated"
mkdir -p "$ISOLATED_HARNESS_DIR"

# Clone product node_modules as an independent APFS tree
cp -cR /tmp/mc002-inta-fe/node_modules "$ISOLATED_HARNESS_DIR/node_modules"
```

### 2.2 Deep Nested-Symlink Enumeration & Realpath Verification
Before any future runner execution, an automated preflight script must enumerate **all** symlinks within the cloned `node_modules` and resolve their canonical targets:

```python
import os, sys

def verify_dependency_isolation(node_modules_dir: str, allowed_root: str):
    allowed_root = os.path.realpath(allowed_root)
    escapes = []

    for root, dirs, files in os.walk(node_modules_dir, followlinks=False):
        for name in dirs + files:
            path = os.path.join(root, name)
            if os.path.islink(path):
                target_realpath = os.path.realpath(path)
                # Verify resolved target does NOT escape outside allowed private root
                if not target_realpath.startswith(allowed_root):
                    escapes.append({
                        "link": path,
                        "resolvesTo": target_realpath,
                        "violation": "Target escapes private sandbox boundary"
                    })
                # Specifically verify no resolution back to original product source
                if "/tmp/mc002-inta-fe" in target_realpath or "/apps/frontend" in target_realpath:
                    escapes.append({
                        "link": path,
                        "resolvesTo": target_realpath,
                        "violation": "Target resolves back to product source repository"
                    })

    if escapes:
        print(f"PREFLIGHT ISOLATION FAILURE: {len(escapes)} escaping symlinks found:")
        for e in escapes:
            print(f"  {e['link']} -> {e['resolvesTo']} ({e['violation']})")
        sys.exit(1)

    print("PREFLIGHT ISOLATION PASS: All nested symlinks strictly contained within private sandbox.")
```

### 2.3 Post-Run Baseline Proof
- Record SHA-256 tree hash of original `/tmp/mc002-inta-fe/node_modules` before execution.
- Re-verify SHA-256 tree hash after execution.
- A clean source hash alone does not prove dependency isolation; the post-run hash baseline of the actual dependency directories must be recorded.

---

## 3. Strict Boundary Confirmation for R2

- **Zero Dependency Operations**: No files under `node_modules` were copied, installed, cloned, or downloaded during R2.
- **Historical Layout Preserved**: The historical symlink chain at `/tmp/mc002-inta-harness` is preserved untouched; no attempts were made to unlink or repair historical dependencies in this step.
