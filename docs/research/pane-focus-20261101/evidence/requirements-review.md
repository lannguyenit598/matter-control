# Internal PM/BA contribution and clarification review

Actual Local Codex coordinated two explicitly requested role subagents, `focus_product_manager` (Product Manager) and `focus_business_analyst` (Business Analyst), during this task. They inspected existing requirements/source and received Local Codex's actual browser observations. No external ZCode/Claude/OpenCode invocation or independent product acceptance is claimed.

The PM reviewed assessment.md, focus-mode-brd.md and the implementation prompt and reported no product blocker, retaining the visible-freshness/load caveat and browser-profile privacy limit. The BA reviewed those documents and identified nine implementation-significant ambiguities. Local Codex applied the following document corrections before handoff:

1. Expired persisted reference removed immediately, including offline restoration; only generic transient expiry until scope revalidation.
2. SUSPENDED persists minimal frozen state within the authenticated lifetime; reload cannot auto-resume.
3. Proposed 30s freshness measured from completed successful read, not request initiation; distinct from IdP cache TTL.
4. Atomic cross-tab coordination required to Start; failure detection suspends/disables controls; private revision is not WorkItem revision.
5. Time-boxed duration explicitly extendible, no implied cumulative cap; no invented maximum or numeric product approval.
6. Observation-based foreground/sibling/refocus/reopen cleanup stated precisely; no instantaneous push guarantee.
7. Default selected Action +25 requires one Start activation; removed unsupported three-interaction picker promise.
8. Escape dismisses expanded controls only and returns focus; End remains explicit.
9. Backward-clock and forward-past-deadline test fixtures specified separately from ordinary hidden-tab elapsed time.

Both roles contributed to the requirements; their feedback is collaborative review, not a nonauthor acceptance certificate. Product scope remains PROPOSED_IN_REVIEW; all MatterControl Focus execution criteria remain NOT_RUN. `document-checks.json` pins the earlier draft before these clarifications; `document-checks-r2.json` supersedes those document pins without rewriting the earlier check.
