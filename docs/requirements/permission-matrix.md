# Proposed MVP Permission Matrix

Owner: Codex. **PROPOSED / OBD-08 + OBD-02, WAITING_PO_APPROVAL.** OWNER/EDITOR/VIEWER are proposed roles from Step 01, not approved production authorization. Personas do not grant roles. This matrix defines behavior, not auth provider/schema.

Scope rule: active Workspace membership AND explicit Matter membership AND role permission. Workspace-level membership administration uses Workspace OWNER; matter-level operations use role on that Matter. Workspace OWNER does not automatically read confidential matters. No document-specific ACL engine proposed in P0: documents/evidence/history inherit their Matter boundary, including sensitive metadata. If narrower document access is required, PO must resolve OBD-08 before freezing this matrix; do not claim protection that is not specified.

Legend: Yes = scoped authorized operation; No = denied; Conditional = stated guard in row. All writes require current revision and attributable history. VIEWER can only access information already visible in their matter scope.

| Operation | Matter OWNER | Matter EDITOR | Matter VIEWER | Additional condition |
|---|---|---|---|---|
| Matter access / read state and related records | Yes | Yes | Yes | Active explicit membership; no cross-workspace references |
| Create Matter / grant initial owner | Conditional | No | No | Workspace OWNER; creation and membership grant audited |
| Matter settings / critical milestone designation / milestone required prerequisites | Yes | No | No | Explicit reason for changes affecting readiness |
| Ordinary dependency edges between Requirements/Actions | Yes | Yes | No | Same matter, graph/gate validation, reason for add/change/removal and audit; distinct from milestone required prerequisites |
| Requirements create/edit | Yes | Yes | No | No applicability/waiver bypass; cancellation/reopen OWNER only |
| Actions create/edit / assign | Yes | Yes | No | Assignee active matter member; assignment never grants access |
| Execution start/wait/complete | Yes | Yes | No | State guards; blocked completion denied |
| Cancellation/reopen / proof applicability | Yes | No | No | RULE-004/005; reason mandatory; cancellation is not legal waiver |
| Evidence submission / replace with new record | Yes | Yes | No | Same matter; typed criterion/version reference; never overwrite accepted proof |
| Evidence review / verify / reject / resolve dispute | Conditional | Conditional | No | Explicit designated verifier AND not submitter; scope and valid version |
| Challenge proof | Yes | Yes | No | Reason; no arbitrary resolution by challenger |
| Document content and metadata read | Yes | Yes | Yes | Matter access at every retrieval; do not expose versions through unprotected links |
| Add document version | Yes | Yes | No | Valid content/reference; new version does not auto-promote |
| Promote authoritative version | Yes | No | No | Expected prior version, reason, impact summary |
| Filing update / submission observation | Yes | Yes | No | Stage and package guards; no actual external filing implied |
| Filing rejection/withdrawal correction | Yes | No | No | Proof/reason; no hidden approval |
| Bulk editing | Yes | Yes | No | Per-row permission/revision; allowed metadata fields only |
| Import | Yes | Yes | No | Preview/confirm scoped groups; no imported grants/VERIFIED state |
| Excel export / delta draft export | Yes | Yes | Yes | Recheck permission at retrieval; no hidden fields/records/counts |
| Event History read | Yes | Yes | Yes | Same matter; protect security-log details |
| Edit/delete prior Event History | No | No | No | Corrections append; approved retention handled separately |
| Matter membership / verifier designation | Yes | No | No | Active workspace members only; verifier must be matter EDITOR/OWNER and cannot verify own submitted proof; do not remove/demote last active OWNER |
| Workspace membership | Conditional | No | No | Workspace OWNER only; revocation immediately removes derived matter access |
| Hard delete matter/evidence/history | No | No | No | Retention/erasure policy OBD-11; not generic CRUD deletion |

Revocation: pending view/export/download/bulk commands must recheck current rights; stale grants do not survive cached UI. Reassign open owned work before removing its only active owner, or leave visible unassigned exception for remaining OWNER to remediate; never reassign silently. Last OWNER removal requires transfer to another active OWNER first. Two-person verification is not waived for a one-member workspace.

Sensitive denial: externally indistinguishable inaccessible/nonexistent record response; no title, file name, external-party label, document count or legal details in failure. Operational reason visible only to authorized actors; denied access recorded in restricted security audit. Prevent self-grant by request fields/import; workspace identifiers and nested relation IDs are validated, not trusted.

Acceptance: AC-118, AC-134/135/140/147/149/158. No demo login, static matrix or hidden button proves enforcement; backend and all retrieval paths require later negative tests.
