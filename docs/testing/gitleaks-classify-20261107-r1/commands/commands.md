# MC-DOCS-GITLEAKS-CLASSIFY-20261107 — command transcript

All commands rtk-prefixed; run from the repo root unless noted; date 2026-11-07; gitleaks 8.30.1 (`/opt/homebrew/bin/gitleaks`, homebrew). Raw scan JSONs kept in `/private/tmp/mc-gitleaks-classify/` (NOT committed — they contain unredacted match values); only masked aggregates committed under `evidence/`.

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `gitleaks detect --source docs --no-git --report-format json --report-path /private/tmp/mc-gitleaks-classify/tree-docs.json` | 1 (findings) | **34 hits**, all `generic-api-key` (16 = be-echo evidence file meta-FP, 14 = step-03a manifest digests, 3 = handoff prose, 1 = provenance SHA) |
| 2 | `gitleaks detect --source apps/backend --no-git --report-format json …` | 1 | **8 hits** — go.sum `h1:` checksums in git-ignored `.mimosa/hook-state/` — matches BE-R1-05 record verbatim |
| 3 | `gitleaks detect --source . --report-format json --report-path …/history-full.json --no-banner` | recorded through a pipeline (tail) — exit not captured on the first run; count taken from the report file | **1187 hits / 145 commits / 101 MB**; aggregation `node aggregate.mjs`: byTop `{"docs":1187}`, non-docs 0 |
| 4 | `node aggregate.mjs` → `evidence/history-aggregated.json` | 0 | rule×path families (37 groups; all `generic-api-key` + 1 `curl-auth-header`) |
| 5 | `node shapes.mjs` → `evidence/shape-classified.json` | 0 | shape buckets: UUID 1056 · sha256-manifest 93 · other 15 · bare-64hex 9 · go.sum 8 · prose 2 · preview-keys 2 · dummy 1 · opaque-token 1 → 27 NEEDS_REVIEW candidates |
| 6 | Per-item adjudication of the 27 (masked prints) | — | 24 → FALSE_POSITIVE (F3/F4/F5/F7 shapes), 3 → NEEDS_REVIEW (NR-A, NR-B ×2), 0 TRUE_POSITIVE |
| 7 | Regex sanity tests (JS equivalents of the Go `(?i)` forms) | 0 | 7/7 after fixing the match-target forms (first draft 5/9 — allowed the leading-quote mistake) |
| 8 | Dry-run v1: `[extend] useDefault=true` + proposal → `gitleaks detect --source . --config test-config.toml …` | 1 | **1184 remaining — proposal NOT working**: duplicate `[[rules]] id="generic-api-key"` blocks; the later block replaced the first (only F5+F6 muted). Lesson recorded. |
| 9 | Proposal rewritten: ONE generic-api-key rule carrying F1/F2/F3/F5 allowlists + one curl-auth-header rule (F6) | — | — |
| 10 | Dry-run v2 | 1 | **22 remaining** — F3 `Secret":` lines (8) and two `docs/reviews/*.md` digests outside path scope still firing |
| 11 | F3 regex extended (`Secret": "<43-base64>="` scoped to the one evidence file); F2 paths widened to `docs/reviews/*.md` — first patch attempt produced invalid TOML (detected via `python3 tomllib` line 120); file rewritten cleanly | — | — |
| 12 | **Dry-run v3 (final): TOML OK → 1187 → 12 remaining, all intentional keepers** (F4 ×6, F1-md ×1, F7 ×1, sha-of-scan-file ×1, NR-A/NR-B ×3) | 1 | proposal VALIDATED |

Files produced: `report.md`, `allowlist-proposal.toml` (PROPOSAL), `evidence/{history-aggregated,shape-classified}.json`, this transcript. Raw scans + config test file: `/private/tmp/mc-gitleaks-classify/` (out of repo).
