#!/usr/bin/env python3
"""OpenCode independent QA — PORT-06/PORT-08 render + real-parser matrix.

Renders both ADR-007 backend profiles from NON-SECRET synthetic values via the
product renderer (ops/deploy/profiles.mjs, invoked through the product CLI),
exercises fail-closed negatives (key names only), then parses every rendered
YAML plus apps/frontend/apphosting.yaml with PyYAML (a real YAML parser, not
the test's regex). Prints one JSON evidence block.
"""
import json, pathlib, subprocess, sys

REPO = pathlib.Path("/Users/nguyenvanlan/Documents/code/pet-projects/matter-control")
OUT = REPO / "docs/testing/opencode-adr006-independent-testing-20261030-r1/portability-intake/renders"
QA = REPO / "docs/testing/opencode-adr006-independent-testing-20261030-r1/portability-intake/qa-values"
PROF = REPO / "ops/deploy/profiles.mjs"
DIG64 = format(0x1f2e3d4c5b6a7988, "x").ljust(64, "0")

base_common = {
    "IMAGE": f"qa-synth-registry.invalid/mcqa/mcapi@sha256:{DIG64}",
    "OIDC_ISSUER": "https://idp-qa-synth.invalid/oidc",
    "OIDC_INTROSPECTION_URL": "https://idp-qa-synth.invalid/api/introspect",
    "OIDC_AUDIENCE": "mcqa-audience-synth",
    "OIDC_API_CLIENT_ID": "mcqa-api-client-synth",
    "R2_ENDPOINT": "https://s3-qa-synth.invalid",
    "R2_BUCKET": "mcqa-synth-bucket",
    "DATABASE_URL_SECRET": "mc-qadatabase-url",
    "MIGRATE_DATABASE_URL_SECRET": "mc-qamigrate-url",
    "R2_ACCESS_KEY_ID_SECRET": "mc-qar2-key-id",
    "R2_SECRET_ACCESS_KEY_SECRET": "mc-qar2-secret",
    "OIDC_KEY_SECRET": "mc-qaidp-key",
}


def run(argv, cwd=REPO):
    p = subprocess.run(["rtk", "proxy"] + argv, cwd=cwd, capture_output=True, text=True)
    return {"argv": argv, "exit": p.returncode, "stdout_tail": p.stdout[-800:], "stderr_tail": p.stderr[-800:]}


block = {"target_us": OUT.as_posix(), "renders": [], "negatives": [], "parse": {}}

# --- PORT-06: two renders, one values per render (single SERVICE_ACCOUNT key exists).
OUT.mkdir(exist_ok=True); (QA).mkdir(exist_ok=True)
import shutil
for outdir in OUT.glob("*"):
    if outdir.is_dir(): shutil.rmtree(outdir)
sa1 = "mcqa-synth-qa@qa-synth-project.iam.gserviceaccount.com"
sa2 = "mcqa-migrator@qa-synth-project.iam.gserviceaccount.com"
for values, outdir in [
    ({**base_common, "SERVICE_NAME": "mcqa-synth-service", "REGION": "asia-southeast1",
      "SERVICE_ACCOUNT": sa1, "MAX_INSTANCES": "3"}, "cloud-run-sa1"),
    ({**base_common, "SERVICE_NAME": "mcqa-synth-service", "REGION": "asia-southeast1",
      "SERVICE_ACCOUNT": sa2, "MAX_INSTANCES": "3"}, "cloud-run-sa2"),
    ({**base_common, "PROJECT_ID": "qa-synth-project", "API_HOSTNAME": "mcapi-qa-synth.invalid",
      "REGISTRY_HOST": "qa-synth-registry.invalid",
      "GCLOUD_IMAGE": f"qa-synth-registry.invalid/qa-synth/gcloud@sha256:{DIG64}",
      "CADDY_IMAGE": "qa-synth-registry.invalid/library/caddy@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f"},
     "compute-engine"),
]:
    vf = QA / f"values-{outdir}.json"
    vf.write_text(json.dumps(values, indent=1) + "\n")
    d = OUT / outdir
    if d.exists(): block["renders"].append({"prescript": f"rm -rf {d}"})
    r = run(["node", PROF.relative_to(REPO).as_posix(), "cloud-run" if outdir.startswith("cloud-run") else "compute-engine",
             vf.relative_to(REPO).as_posix(), d.relative_to(REPO).as_posix()])
    r["outdir"] = outdir
    block["renders"].append(r)

# --- PORT-06 negatives: fail-closed on placeholder / http / mutable tag / inline secret-looking value.
neg1 = {k: v.replace("https://", "http://", 1) if k == "R2_ENDPOINT" else v for k, v in base_common.items()}
neg2 = {k: ("REPLACEME" if k == "DATABASE_URL_SECRET" else v) for k, v in base_common.items()}
neg3 = {k: v for k, v in base_common.items()}
neg3["IMAGE"] = "qa-synth-registry.invalid/mcqa/mcapi:latest"
neg4 = {k: v for k, v in base_common.items()}
neg4["DATABASE_URL_SECRET"] = "postgres://svcuser:hunter2@s3-qa-synth.invalid/db2"
for label, vals in [("http_endpoint", neg1), ("placeholder_secret_name", neg2), ("mutable_tag", neg3), ("secret_value_in_secret_ref", neg4)]:
    p = subprocess.run(
        ["rtk", "proxy", "node", "--input-type=module", "-e",
         f"const m = await import('file://{PROF}');\n"
         f"const problems = m.problems('cloud-run', {json.dumps(vals)});\n"
         f"console.log(JSON.stringify(problems));"],
        cwd=REPO, capture_output=True, text=True)
    block["negatives"].append({"case": label, "exit": p.returncode, "problems": p.stdout.strip(), "stderr": p.stderr[-200:]})

# --- renderer unknown-profile + fresh-directory guards via CLI
block["cli_unknown_profile"] = run(["node", PROF.relative_to(REPO).as_posix(), "kubernetes", QA.joinpath("values-cloud-run-sa1.json").relative_to(REPO).as_posix(), OUT.joinpath("never").relative_to(REPO).as_posix()])
block["cli_reuse_guard"] = run(["node", PROF.relative_to(REPO).as_posix(), "cloud-run", QA.joinpath("values-cloud-run-sa1.json").relative_to(REPO).as_posix(), OUT.joinpath("cloud-run-sa1").relative_to(REPO).as_posix()])

# --- PORT-08: real parser over rendered + checked YAML
import yaml  # PyYAML 6.0.3

def parse(path):
    rel = path.relative_to(REPO).as_posix()
    try:
        d = yaml.safe_load(path.read_text())
        return {"file": rel, "parsed": True, "top_keys": sorted(d.keys()) if isinstance(d, dict) else type(d).__name__}
    except Exception as e:
        return {"file": rel, "parsed": False, "error": f"{type(e).__name__}: {e}"}

files = [
    OUT / "cloud-run-sa1/service.yaml", OUT / "cloud-run-sa1/migrate-job.yaml",
    OUT / "compute-engine/cloud-init.yaml", REPO / "apps/frontend/apphosting.yaml",
]
block["parse"]["yaml"] = [parse(f) for f in files]
sv = yaml.safe_load((OUT / "cloud-run-sa1/service.yaml").read_text())
mj = yaml.safe_load((OUT / "cloud-run-sa1/migrate-job.yaml").read_text())
block["parse"]["cloud_run_identity"] = {
    "service_serviceAccount": sv["spec"]["template"]["spec"]["serviceAccountName"],
    "job_serviceAccount": mj["spec"]["template"]["spec"]["template"]["spec"]["serviceAccountName"],
    "equal": sv["spec"]["template"]["spec"]["serviceAccountName"] == mj["spec"]["template"]["spec"]["template"]["spec"]["serviceAccountName"],
    "service_paths": sorted({e.get("name") for t in sv["spec"]["template"]["spec"]["containers"] for e in t.get("env", [])}),
    "job_paths": sorted({e.get("name") for t in mj["spec"]["template"]["spec"]["template"]["spec"]["containers"] for e in t.get("env", [])}),
    "service_has_MC_MIGRATE_DATABASE_URL": any(e.get("name") == "MC_MIGRATE_DATABASE_URL"
        for t in sv["spec"]["template"]["spec"]["containers"] for e in t.get("env", [])),
}
ci = (OUT / "compute-engine/cloud-init.yaml").read_text()
block["parse"]["cloud_init"] = {
    "starts_with_comment": ci.startswith("#cloud-config"),
    "cache_ttl_line": [l.strip() for l in ci.splitlines() if "MC_OIDC_CACHE_TTL" in l],
    "secret_file_paths": [l.strip() for l in ci.splitlines() if l.strip().startswith("- path:")],
}
print(json.dumps(block, indent=1))
