#!/usr/bin/env python3
"""OpenCode independent QA — PORT-09: approved introspection-cache TTL vs candidate bytes.

Reads the CANDIDATE bytes from git HEAD (never the drifting worktree) plus the
reviewer's pinned rendered profiles, and reports the values by source. Prints
JSON only; no network, no provider, no worktree dependency for source values.
"""
import json, pathlib, re, subprocess

REPO = pathlib.Path("/Users/nguyenvanlan/Documents/code/pet-projects/matter-control")
BASE = REPO / "docs/testing/opencode-adr006-independent-testing-20261030-r1/portability-intake"


def head(path: str) -> str:
    return subprocess.run(["git", "-C", str(REPO), "show", f"HEAD:{path}"], capture_output=True, text=True, check=True).stdout


def first(pattern: str, text: str):
    m = re.search(pattern, text)
    return m.group(1) if m else None


adr = (REPO / "docs/architecture/adr/ADR-004-production-hosting-topology-review.md").read_text()
product_go = head("apps/backend/internal/config/product.go")
product_test = head("apps/backend/internal/config/product_test.go")
service = head("ops/deploy/cloud-run/service.yaml")
cloud_init = head("ops/deploy/compute-engine/cloud-init.yaml")
rendered_service = (BASE / "renders/cloud-run-sa1/service.yaml").read_text()
rendered_ci = (BASE / "renders/compute-engine/cloud-init.yaml").read_text()

report = {
    "approved": {
        "source": "docs/architecture/adr/ADR-004-production-hosting-topology-review.md (decision row 4)",
        "value": first(r"APPROVED: `MC_OIDC_CACHE_TTL=(\d+s)`", adr),
        "line": next((i + 1 for i, l in enumerate(adr.splitlines()) if "MC_OIDC_CACHE_TTL=" in l), None),
    },
    "candidate_head": subprocess.run(["git", "-C", str(REPO), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip(),
    "go_default": {
        "source": "HEAD:apps/backend/internal/config/product.go",
        "value": first(r'duration\("MC_OIDC_CACHE_TTL", "(\d+s)"\)', product_go),
    },
    "go_test_assertion": {
        "source": "HEAD:apps/backend/internal/config/product_test.go",
        "value": first(r"OIDC\.CacheTTL != (\d+)\*time\.Second", product_test),
        "converted": None,
    },
    "template_service": {
        "source": "HEAD:ops/deploy/cloud-run/service.yaml",
        "value": first(r"name: MC_OIDC_CACHE_TTL, value: (\d+s)", service),
    },
    "template_cloud_init": {
        "source": "HEAD:ops/deploy/compute-engine/cloud-init.yaml",
        "value": first(r"MC_OIDC_CACHE_TTL=(\d+s)", cloud_init),
    },
    "rendered_service": {
        "source": "portability-intake/renders/cloud-run-sa1/service.yaml (pinned output)",
        "value": first(r"name: MC_OIDC_CACHE_TTL, value: (\d+s)", rendered_service),
    },
    "rendered_cloud_init": {
        "source": "portability-intake/renders/compute-engine/cloud-init.yaml (pinned output)",
        "value": first(r"MC_OIDC_CACHE_TTL=(\d+s)", rendered_ci),
    },
    "semantics": (
        "The introspection cache bounds how long a token revoked at the IdP can still be accepted. "
        "Matter-membership reauthorization is a separate PostgreSQL check, and JWKS rotation is separate again. "
        "The candidate's 15s is shorter than the approved 30s, so it is an approval/configuration mismatch rather "
        "than a weaker revocation window; the corrected profile must still be regression-tested at the approved value."
    ),
}
t = report["go_test_assertion"]["value"]
report["go_test_assertion"]["converted"] = f"{t}s" if t else None
vals = [report["approved"]["value"], report["go_default"]["value"], report["go_test_assertion"]["converted"],
        report["template_service"]["value"], report["template_cloud_init"]["value"],
        report["rendered_service"]["value"], report["rendered_cloud_init"]["value"]]
report["all_equal"] = len(set(vals)) == 1
report["mismatch_between_approved_and_candidate"] = report["approved"]["value"] != report["go_default"]["value"]
print(json.dumps(report, indent=1))
