# Step02.3 — Execution, Decision Gate and Evidence Handoff

Codex PM/BA/Cloud/DevOps,2026-10-25 Asia/Ho_Chi_Minh. Task MC-002-INT-DEC, branch task/MC-002-solution-architecture, base e377568ac47f8f1b88e3875a8f13d7e57fc30667. Proposed current status **IN_REVIEW / WAITING_PO_APPROVAL / PRE_DISPATCH_ARCH_CLARIFICATION_PENDING**. This step did not implement or execute integration.

## Actual external execution

| Record | Actual session | CLI exit | Elapsed | Result |
|---|---|---|---|---|
| claude-execution.json | 1aa5f9c4-9e72-477d-8c77-fcd9e3effe2a | 0 | 238.472s | success; is_error=False |
| claude-correction-execution.json | a6577bf0-ce08-4d72-9e69-3fa29bb7b00f | 0 | 259.598s | success; is_error=False |
| claude-final-execution.json | d1a79db1-e87d-4a5f-ab92-416b6f1f2449 | 1 | 1.517s | success; is_error=True |
| opencode-execution.json | ses_e90e5cf7bffeqtOKafnvhwOwFK | 0 | 430.878s | PASS_DOCUMENT_ONLY; is_error=n/a |
| opencode-final-execution.json | ses_e8f69b65effeTBK0EZOkBIkSuD | 0 | 222.377s | PASS_DOCUMENT_ONLY; is_error=n/a |

Claude Code2.1.309 / claude-opus-5-5 actually authored the proposal and Next-runtime correction. The initial Node-only proposal did not meet the requested Next runtime seam; Codex requested bounded correction, faithfully stored the actual response and applied its two documents. The CLI succeeded; its fenced JSON initially failed the intake parser. Removing only the outer fence recovered the original JSON; no document escape rewriting occurred. Raw outputs remain unchanged.

The supplemental Claude call for bounded wording failed **exit1, is_error=true, Not logged in** despite subtype=success. No review completion is inferred. Read-only host auth status also returned not logged in; no login/settings mutation. The [complete manual Claude prompt](../implementation/handoffs/MC-002-INT-CLAUDE-CLARIFICATION-PROMPT.md) remains PREPARED / NOT_DISPATCHED. PREREQ-01 app-client value-field wording and PREREQ-02 validated-refId fixed-path-param wording remain OPEN before engineering dispatch. The factual 503 literal is pinned separately to accepted source, not invented architecture.

Actual OpenCode/configured provider opencode/glm-5.3-flash-free authored the matrix and reviewed proposal testability, then returned the final bounded correction/recheck. Both verdicts PASS_DOCUMENT_ONLY. Initial matrix defects found by Codex included mutation-based unknown-write reconciliation, contradictory synthetic-body privacy scanning, incorrect client code, unselected temporary identity fixtures, trace links and restart sequencing. OpenCode returned the bounded corrections; Codex applied the exact replacement content. One old-text target omitted a clause; intake normalized only the unique FIX-D-AUTH paragraph target span, preserving replacement wording. The raw return says13 edits; the parsed array actually contains14, all applied. This is a recording qualification, not another provider execution. Initial/final raw returns and exact packets are retained.

Final recheck closes INT-QA-01..03 and QX1..6. Its two architecture-wording prerequisites remain open and are not silently waived. No mutation retry is allowed to determine whether an unknown POST committed; POST stays OUTCOME_UNKNOWN and product receipt reconciliation is deferred. Privacy rules separate body-free application logs from controlled bounded synthetic response artifacts; actual secret values are forbidden everywhere.

## Decision package and scope

The [PO package](../ai-sdlc/step-02-decision-package.md), actual Claude [scope](../architecture/integration-scope-proposal.md) and [nine-decision analysis](../architecture/api-auth-decision-analysis.md) are PROPOSED. Each INT-D01..09 covers all16 requested fields (ID in heading plus15 requested fields; additional decision-class row). Independent review is bound to immutable packet snapshots, not every later metadata overlay. Later auth-route/prerequisite notes and this report are Codex provenance updates, not a new architect/reviewer round.

Recommended INT-A: a temporary isolated actual Next.js development-server harness outside product src/ executes the existing unmodified client over REST to unchanged native Go52b60a4 and real owned disposable PostgreSQL. One temporary harness endpoint needs explicit PO approval. INT-C defers. INT-A0 Node-only is a reduced exception requiring explicit separate choice; INT-B temporary auth is not recommended or implementation-ready. No aliases, shared token, permission bypass or product features.

Authentication identifies a caller; authorization and Workspace/Matter isolation enforce access. INT-A implements none of them; synthetic User rows are data, never identity. Product requirements/roles stay approved; the15 historical candidate architecture/ADRs remain not PO-approved. Native template, candidate product, temporary harness and future P0 contracts are separate. C01-NATIVE accepted, C01-PRODUCT OPEN.

Only INT-D01 scope/evidence boundary needs PO choice now. Identity/hosting/adapter/storage/retention/workload/full-cost/product retry choices remain future gates. H5/W1/Q3/Q5 approvals and closed native evidence remain intact. No Cloudflare production, account eligibility, total-cost or $0 proof is inferred. Price/limit notes are inherited dated evidence, not fresh quotes.

## Owner sequence and tests

PO scope selection → Claude ARCH-FINAL (including manual prerequisites) → Codex exact owner contracts/manual prompts → ZCode unchanged Go operation and Antigravity harness → Codex new isolated fixture → OpenCode independent actual verification → Claude conformance → Codex evidence intake. See [conditional tasks](../implementation/step-02-integration-task-plan.md). No ZCode/Antigravity engineering prompt is dispatched now.

The [actual QA matrix](../testing/integration-acceptance-matrix.md) contains **51 runtime acceptance rows, all NOT_RUN**, including deferred authentication/authorization/isolation gates. No integration/DB/full-suite/baseline test or container/process operation ran in this step. Local document/hash/link/JSON/packet checks are distinct and recorded in [final checks](../testing/step-02-3/final-checks.json).

## Integrity, authorization and stop

59 previously protected files (25 product/requirements,15 normative architecture and19 R01/R02 evidence) retain hashes. The full tracked starting inventory also protects accepted C01/R1 raw evidence and reviews; only explicit status/task/decision overlays may change. Input gzip snapshots are immutable and checked against manifest SHA256/size. Raw provider returns, execution metadata, session exports, source pin, exact permission, corrections and check scripts are under [evidence inventory](../testing/step-02-3/README.md).

The initial egress rejection was resolved by the direct human approval of this packet and bounded Step02.3 Claude/OpenCode loops. No blanket external publication or implementation approval is inferred. Provider tools/MCP were disabled or all denied. No credentials or real legal records were supplied. Claude auth inspection omitted account identity output.

Unrelated Step03A untracked documents appeared at resume and were preserved/excluded. No Step03 action or authorization is asserted by this workstream. MC-002 remains OPEN, Architecture Approval Gate NOT_PASSED; integration runtime, C01-PRODUCT, product recovery, production Cloudflare and full cost remain OPEN. No push/PR/merge/deploy/paid activation. Reviewable PO package exists; architecture wording/final contract and PO selection remain prerequisites.

Skipped: implementation, runtime/database/integration and accepted-baseline replays, provider/account activation and deployment. Risk: transport-only evidence cannot establish product security, full recovery or production/$0 feasibility; Claude manual clarification remains pending.
