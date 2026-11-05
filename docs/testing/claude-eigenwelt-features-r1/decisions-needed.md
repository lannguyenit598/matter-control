# Decisions needed (bounded; each blocks only its own feature)

| ID | Decision | Alternatives | Recommendation | Blocks |
|---|---|---|---|---|
| D1 | Who writes the new backend paths for B/C/D, and when | (a) Codex after its current session; (b) Claude under a named-paths receipt from the human/Codex; (c) split: Codex owns `server.go`/`product.go`/policy wiring, Claude owns new feature files | (c) with a written receipt listing the shared files (`server.go`, `product.go`, policy, `docs/api.md`) | B, C, D |
| D2 | Intake: who may create and triage a request | (a) Matter-scoped only: OWNER/EDITOR of an existing Matter records a request in it; (b) workspace OWNER triage inbox; (c) any workspace member submits | (a) for the first slice: it uses rights the permission matrix already grants; (b)/(c) need a new workspace-wide right | D (intake) |
| D3 | Scope of reusable knowledge | (a) per Matter; (b) per workspace library with explicit publish; (c) firm-wide | (a) first; (b) only after the sharing policy (what may be copied from a Matter, who sees it, revocation) is written | D (knowledge) |
| D4 | Retention of copied report snapshots after a member loses access | (a) purge for that member; (b) keep for the owner only; (c) keep for all prior readers | Implement validated saved filters first; gate persistent snapshots on this decision | D (snapshots) |
| D5 | Playbooks: who authors/publishes and who instantiates | (a) workspace OWNER publishes, Matter OWNER instantiates; (b) any editor | (a) | C |
| D6 | Review matrix roles | cells answered by EDITOR/OWNER, visible to all Matter members; never changes verification | as stated | B |
| D7 | Storage connector provider and scope | Drive / DMS / other | name one provider with credentials access and ACL mapping | connector |
| D8 | Reminder channel and recipients | email / in-app / none | choose channel, opt-in rule, schedule/timezone, retry/dedupe | reminders |
| D9 | AI provider/model and data destination | per P2-04/05/06 | named approved provider, retention, cost, synthetic eval set | P2 AI |
