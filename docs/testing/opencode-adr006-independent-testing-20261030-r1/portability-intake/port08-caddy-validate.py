#!/usr/bin/env python3
"""OpenCode independent QA — PORT-08 Caddyfile extraction + caddy validate (network none)."""
import json, pathlib, re, subprocess

REPO = pathlib.Path("/Users/nguyenvanlan/Documents/code/pet-projects/matter-control")
CI = REPO / "docs/testing/opencode-adr006-independent-testing-20261030-r1/portability-intake/renders/compute-engine/cloud-init.yaml"
SCRATCH = pathlib.Path("/private/tmp/mc-opencode-adr006-qa-caddy-20261030")
SCRATCH.mkdir(parents=True, exist_ok=True)

text = CI.read_text()
# Extract the Caddyfile block from the rendered cloud-config (between 'content: |' of the Caddyfile entry and the next '- path:' / 'runcmd:').
m = re.search(
    r"^  - path: /etc/mattercontrol/Caddyfile\n^    permissions: '[0-9]+'\n^    content: \|\n((?:^      .*\n)+)",
    text,
    re.M,
)
block = m.group(1)
# strip the 6-space indentation
caddyfile = re.sub(r"^ {6}", "", block, flags=re.M).rstrip() + "\n"
target = SCRATCH / "Caddyfile"
target.write_text(caddyfile)

img = "caddy@sha256:eb4d35b7452d1ab6171fbdbe8d9275b2301dad6dad92115d91e19fb9b24d510f"
cmd = ["docker", "run", "--rm", "--network", "none", "-v", f"{target}:/etc/caddy/Caddyfile:ro", img, "caddy", "validate", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
p = subprocess.run(["rtk", "proxy"] + cmd, capture_output=True, text=True)
print(json.dumps({
    "scratch": str(target), "image": img,
    "argv": cmd,
    "exit": p.returncode,
    "stdout_tail": p.stdout[-1500:], "stderr_tail": p.stderr[-1500:],
    "network_none": True,
    "notes": "local digest-cached public caddy image; no retained container state; caddy validate only (no TLS issuance/firewall/systemd).",
}, indent=1))
