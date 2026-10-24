# MC-00A — Proposed repository, tooling and hosting feasibility audit

- Task ID: MC-00A
- Status: WAITING_APPROVAL
- Requirement references: REQ-S00-002, REQ-S00-009; approved template/deployment constraints in DEC-003
- Agent owner: Codex
- Priority: P1
- Scope: read-only audit of exact backend/frontend source revisions, agent-route readiness and Cloudflare Free Tier feasibility; document options and open questions
- Out of scope: features, deployment, runtime/account mutations, auth/integration setup, selecting a replacement stack without Human approval
- Dependencies: Human approval to leave Step 00, review disposition of MC-000; verified source access for repository claims
- Repository / worktree: governance repo for reports; source checkouts/SHAs to be recorded before audit
- Base commit / branch: TO_BE_RECORDED at kickoff; proposed task/MC-00A-feasibility
- Input artifacts: charter, capability matrix, R-001/R-002/R-005, supplied template URLs, current official platform docs
- Output artifacts: repository baseline report under docs/tooling/; hosting feasibility/constraints under docs/deployment/; questions, updated risks and decision packet
- Acceptance criteria: AC-1 pin source branches/SHAs and inspect actual instructions; AC-2 inventory frameworks/runtimes/builds/persistence/auth/CI/license; AC-3 classify reuse/gaps without edits; AC-4 identify Go and Next.js runtime compatibility evidence; AC-5 enumerate all services, quotas, workload assumptions and unverified costs; AC-6 record feasible options and Human decisions still needed
- Test requirements: reproducible read-only inspection with command/exit/evidence; do not execute repository scripts or install dependencies without inspecting them and confirming scope; no workload benchmark during this proposed read-only audit
- Reviewer: Human; Claude architecture review and OpenCode evidence review via verified or manual route when available
- Required human approvals: DEC-006 transition and this proposed Step 00A scope
- Completion evidence: NOT_RUN — no Step 00A source audit or feasibility test executed
- Blocker / next action / owner: Human authorizes transition; Codex then confirms source access and input SHAs
- Created / last updated: 2026-10-24, Asia/Ho_Chi_Minh
- Sender / receiver acknowledgement: packet prepared, not dispatched
- Status history: 2026-10-24 created as WAITING_APPROVAL due explicit Step 00 stop condition

No dates, detailed workload or $0/month verdict are invented. If Cloudflare-only Go reuse is infeasible, return trade-offs to Human; do not silently rewrite backend technology or add a paid host.
