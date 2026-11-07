# MC-DOCS-GITLEAKS-CLASSIFY-20261107 — Dispatch prompt (coordinator: classify the docs/ history gitleaks prose-FP family)

Task ID: MC-DOCS-GITLEAKS-CLASSIFY-20261107
Purpose: the 1171 gitleaks findings under `docs/` in git history (recorded repeatedly since 2026-10-29, all presumed prose false-positives) have never received a classified disposition list. Produce one, so future scans can cite a ruling instead of re-triaging.
Executor: any session (read-heavy, mechanical). REVIEW/CLASSIFY only — no history rewriting, ever; no config commits.

## 0. Mode

- Your only repo write: the report + proposed allowlist file inside your evidence dir (§4). No commits of allowlist config (`.gitleaks.toml` changes are a PO decision — proposal only). No code changes. No history mutation of any kind.
- `rtk` prefix on every shell command; no `sed`/`perl -i`; record tool version (`gitleaks version`), exact commands, exit codes.

## 1. Reproduce the scan

- Working-tree scan of `docs/` (expected: 0 — the family is history-only) and the history scan the prior sessions ran (identify the exact invocation from the earlier evidence — e.g. BE echo review §3 Pass D / BE-R1-05 notes — and re-run it). Expect ≈1171 hits, all under `docs/`. If your count differs materially, report the delta with the command used rather than forcing the number.

## 2. Classify

Group hits into families by (rule ID × path pattern × content shape). For each family:

- `FALSE_POSITIVE_PROSE` — secret-shaped strings inside narrative text (examples, regex demonstrations, redaction documentation, URL patterns). Cite 2–3 representative `commit:path:line` samples per family.
- `NEEDS_REVIEW` — anything that looks like it could have been real once (tokens in old runbooks, example credentials that were also real). List these individually with context; do NOT bulk-classify them.
- `TRUE_POSITIVE` — if any: STOP that item, do not remediate yourself; escalate to the coordinator/PO as a P1 finding (rotation/revocation decision is theirs).

Sanity bar: a family may only be `FALSE_POSITIVE_PROSE` if every sampled member is visibly non-functional prose (no resolvable endpoint, no plausible live credential format, or the value is a documented dummy).

## 3. Adjudicate the 8 working-tree FPs (already known)

The BE echo review recorded 8 tree hits, all `go.sum` checksums snapshotted inside git-ignored `.mimosa/hook-state/` artifacts (FP). Re-verify that classification still holds and include it as a one-line family entry.

## 4. Output

`docs/testing/gitleaks-classify-20261107-r1/` containing:

- `report.md` — families table (family · rule · path pattern · count · classification · representative samples · recommended action), the NEEDS_REVIEW list, the TRUE_POSITIVE escalation section (if any), totals reconciled against the raw scan.
- `allowlist-proposal.toml` — proposed gitleaks allowlist entries (rule-targeted, path-scoped, commented with the family rationale) for the PO to adopt or reject. Explicitly marked PROPOSAL — not applied.
- `commands/` — scan + grouping transcripts.

## 5. Return

Task ID · actual agent identity · scan invocation + counts · family summary (counts per classification) · any NEEDS_REVIEW/TRUE_POSITIVE items · risks · proposed next status (recommendation to the PO on adopting/rejecting the allowlist proposal). End with skipped + remaining risk. Never claim the history is "clean" — the claim is "classified, with dispositions".
