# Mimosa finding resolution — prepared operator/maintainer dossier

Status: READY_FOR_OPERATOR, NOT_SENT. This is a diagnostic request for a supported false-positive review/rule correction; it does not grant bypass, change scanner state or authorize a source/evidence rewrite.

## Target

- Enforcing project: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
- Finding: `finding:f4bd71af4f1cfebcec9cb0a4`; occurrence `occurrence:457d6114dd662aa87811834e`; high/CWE-798/hardcoded-credential.
- Location: `docs/testing/inta-returns/environment/env-intamvnmoems3pd/provision-command.py:46`.
- Scan: `scan-2026-10-26T00-40-19.307Z-e324c2f15ce2`, producer mimosa0.1.0; scan job completed but runStatus inconclusive/coverage partial/verdictEffect none.
- Owner session's ordinary commit was rejected before execution; no corrected commit exists.

## Source-based review request

The scanner message says the POSTGRES_PASSWORD credential value is directly embedded in source. The actual dataflow is:

1. Line13 generates password with `secrets.token_hex(32)` at runtime.
2. Line46 serializes that variable via private_write; the expression contains no literal password value.
3. The writer creates an exclusive0600 file under a private temporary directory outside the repository.
4. Relevant repository evidence writes check redaction before persistence.

Exact source hash/line excerpts and the read-only AST observation are in `flagged-source-analysis.json`; this report never executes the provisioning script or reads credentials. Sealed scan artifacts and refusal log are preserved losslessly beside it, with origin bytes/hashes in `intake.json`.

Please use the maintainer/operator's documented resolution mechanism to evaluate this finding's evidence and correct the rule/classification if it is a false positive. If a supported audited disposition exists, return its exact scope/status/authority and resulting permitted action. Otherwise report the maintainer fix required. A scanner rule fix should preserve detection of actual literal credentials; partial/inconclusive coverage must remain visible and must not be represented as a complete security PASS.

Do not edit the immutable provisioning evidence, add a broad allowlist/baseline, disable hooks or move the commit to another host/tool/context merely to evade this refusal. No external posting or scanner modification has been authorized or performed by this dossier.

## Source completion after supported resolution

Backend `/private/tmp/mattercontrol-backend-be01`, branch codex/mc-be-01, stillHEAD136eae6. Exactly nine staged paths and39source/support file hashes match the independently reviewed snapshot. Reviewed/staged patch SHA256: `33297560f457375f0eeae13f2e8c83e739f239e41b285e82bd3652cc5999633e`; no unstaged/untracked files at intake.

After an actual normal gate-state change, the source owner rechecks the gate/HEAD/index/file hashes and follows the existing commit-only contract. If source is unchanged, no redundant F01/F02/F03 correction/review or full baseline replay is requested. Any normal enforced checks still apply. Return the actual permitted commit or continued block; do not fake a successful exit or mark BE01 DONE before completion evidence.

Skipped: maintainer contact, scanner action and commit. Risk: no supported resolution route is exposed to the current Codex session, so this document alone cannot unblock the gate.
