# MC-DOCS-GITLEAKS-CLASSIFY-20261107 — gitleaks docs/ history classification r1

- Date: 2026-11-07 · Executor: actual ZCode (dispatch: "any session, read-heavy, mechanical").
- Tool: **gitleaks 8.30.1** (homebrew, `/opt/homebrew/bin/gitleaks`).
- Claim scope (binding): **"classified, with dispositions" — NEVER "history is clean"**.
- Writes: this evidence directory only. No history mutation, no `.gitleaks.toml` commit (allowlist is a PROPOSAL for the PO).

## 1. Scan reproduction (counts reconciled)

| Scan | Command | Exit | Count | Expected | Delta |
|---|---|---|---|---|---|
| docs/ working tree | `gitleaks detect --source docs --no-git` | 1 (findings) | **34** | 0 (dispatch: "family is history-only") | **+34, explained below** |
| apps/backend tree (re-verify) | `gitleaks detect --source apps/backend --no-git` | 1 | **8** | 8 (BE-R1-05 record) | 0 ✓ |
| Full git history | `gitleaks detect --source .` (145 commits, 101 MB) | recorded via pipeline (see commands) | **1187** | ≈1171 | **+16, explained below** |

Reconciliation:
- **History 1187 = 1171 (prior record) + 16** — the +16 are the prior session's own evidence file `docs/testing/be-echo-review-20261106-r1/evidence/gitleaks-backend-tree-8fp.json` (the JSON report of the 8 backend FPs, committed afterwards), which the scanner now re-detects. Verified: `byTop = {"docs": 1187}`, **non-docs hits: 0** — matches the prior claim "all under docs/, Go files: 0".
- **Tree docs/ 34** (not 0): 16 = the same be-echo meta-evidence file; 14 = `docs/design/step-03a/handoff/**` file-checksum manifests; 3 = handoff prompts with prose "key/secret" words; 1 = research provenance note. All fall into the families below (same shapes as history).

## 2. Rule landscape

All **1187** history hits: rule `generic-api-key`, except **1** `curl-auth-header`. No github-pat/jwt/aws/private-key rule fires. 34 tree hits: all `generic-api-key`.

## 3. Families (shape-classified across ALL 1187 hits — not sampled)

| Family | Rule | Shape (verified per member) | Count | Classification | Representative samples (masked) |
|---|---|---|---|---|---|
| F1 | generic-api-key | UUIDv7 record/command/idempotency keys (`"key":"01a192b1-94c6-7454-…"` `"CommandKey"`, `"idempotencyKey"`) inside local test-run transcripts (`calls.jsonl`, `readback-restored.json`, walkthrough captures) | **1056** | **FALSE_POSITIVE (non-credential identifier)** — a UUID authenticates nothing anywhere | `calls.jsonl:3` `key":"01a192b1-94c6-…461a"`; `readback-restored.json:608` `CommandKey":"01a1815d-0fc8-…046"` |
| F2 | generic-api-key | sha256 file-checksum manifests (`"<name>.md|json|sql|txt|pid": "<64-hex>"`) — integrity pins of evidence files | **102** (93 auto + 9 adjudicated: 4 password-file-name hashes, 3 pid/golden hashes, 1 credential-scan-file hash, 1 secrets-archive hash) | **FALSE_POSITIVE (hash-of-file, not the file)** — includes hashes OF local password/secret snapshots: the values committed are digests, the pinned files themselves were never committed | `source-pin-before.json:816` `admin-password.txt": "1b0b7e42…"`; `preservation.json:203` `secrets.source.gz": "4b7ace11…"` |
| F3 | generic-api-key | Go module checksums (`h1:6P7Q…=`) — in `.mimosa/hook-state/` tool artifacts (backend tree) and in the committed evidence JSON that recorded them (history) | **16** history + **8** backend tree | **FALSE_POSITIVE (module checksums)** — also scanner-on-scanner-evidence meta-FP | `gitleaks-backend-tree-8fp.json:9` `…h1:6P7Q7yH/GIwH…EY="` |
| F4 | generic-api-key | Prose containing the words key/secret ("keys, uniqueness/idempotency", "key versioning, expiry/logout", "secret values, UTC/exits/stdout/stderr") | **6** (2 auto + 4 adjudicated) | **FALSE_POSITIVE_PROSE** (textbook narrative) | `MC-002-INTA-MANUAL-PROMPTS.md:19` |
| F5 | generic-api-key | Documented spec/example tokens quoted in documentation research notes: OIDC Core example JWT (`kid "1e9gdk7"`) + the adjacent OAuth-docs example access_token | **2** | **FALSE_POSITIVE (documented dummy)** — published in open standards/docs; never issued by this project | `step-02-3/documentation-research.json:20` `id_token=eyJraWQiOiIxZTlnZGs3Ii…` |
| F6 | curl-auth-header | Dummy smoke token `tok-wt-alice` (synthetic user name baked into the literal) against `127.0.0.1:18083` | **1** | **FALSE_POSITIVE (documented dummy)** | `mc-enablement-minifix…/m2-smoke-milestones.log:9` |
| F7 | generic-api-key | Bare 40-hex in research provenance note (`API: 2b8cb18d…`) — git-SHA1 shape, repo-reference context | **1** | **FALSE_POSITIVE (identifier shape)** | `eigenwelt-20261029/user-guide/PROVENANCE.md:5` |
| **NR-A** | generic-api-key | Opaque 64-hex token captured from the **local Go backend** during the BA-flow walkthrough (`token":"245ccb4e…902cc"`) | **1** | **NEEDS_REVIEW** — real credential format, issued by the loopback-local mcapi whose runtime was torn down at flow close; dead by construction, but individually recorded per the sanity bar | `zcode-ba-flow-completeness-20261030-r1/commands/http-walkthrough/174150-509-gw01-doc-impact.json:1` |
| **NR-B** | generic-api-key | **Next.js previewModeSigningKey / previewModeEncryptionKey** (64-hex) in a validation-run `prerender-manifest.json` snapshot | **2** | **NEEDS_REVIEW** — plausible live-credential format; assessment: local validation build, preview mode never deployed, keys rotate per build — but PO confirms disposition | `inta-returns/frontend/validation-20261026/prerender-manifest.json:185-186` |

**Totals: 1184 FALSE_POSITIVE (families F1–F7) · 3 NEEDS_REVIEW (NR-A ×1, NR-B ×2) · 0 TRUE_POSITIVE · 1187 reconciled.**
Full per-hit shape assignment: `evidence/shape-classified.json`; path/rule grouping: `evidence/history-aggregated.json`.

## 4. The 8 backend working-tree FPs — re-verified

`gitleaks detect --source apps/backend --no-git` → **8 hits, unchanged** — all go.sum module checksums (`h1:…`) snapshotted inside git-ignored `.mimosa/hook-state/` tool artifacts (family F3). Matches the BE-R1-05 record verbatim. Disposition: **FALSE_POSITIVE, still holds**.

## 5. TRUE_POSITIVE escalation

**None.** No finding shows a resolvable external endpoint, a provider credential format (ghp_/sk_/AKIA/…), or a live issuer. NR-A/NR-B are the closest calls and are individually recorded for the PO, with the assessment above.

## 6. Recommended actions

1. **Adopt or reject `allowlist-proposal.toml`** (PO decision — not applied here). Rule-targeted (`[[rules.allowlists]]` extending the default `generic-api-key`/`curl-auth-header` rules), `condition="AND"` + `regexTarget="match"` + path-scoped, so real credentials in other contexts/paths are not muted. **Dry-run validated** (gitleaks 8.30.1, `--config` with `[extend] useDefault=true` + the proposal): **1187 → 12 remaining**, and the 12 are exactly the intentional keepers — F4 prose ×6, one UUID-in-narrative (.md, key name outside the F1 list), F7 ×1, one sha256-of-scan-file hash (key name outside the F2 shape), and NR-A/NR-B ×3 kept visible pending PO disposition. Zero unexpected survivors; TOML parse validated; per-regex sanity checks 7/7 (`commands/`).
2. **Accept or overrule the 3 NEEDS_REVIEW dispositions** (NR-A, NR-B ×2). Recommended: accept as dead (local-only issuers, runtime torn down / never deployed) — recorded individually so the acceptance is auditable.
3. **Scanner hygiene (optional, coordinator):** the meta-FP source is committed scanner output (`gitleaks-backend-tree-8fp.json`). Future evidence reports should mask `Secret` fields, or the file should move under a git-ignored path — otherwise every future history scan re-finds its own evidence (+16 and growing).
4. The 34 current-tree docs/ hits resolve to the same families (F2/F3/F4/F7 + meta-F3); they need no separate remediation beyond the allowlist ruling.
