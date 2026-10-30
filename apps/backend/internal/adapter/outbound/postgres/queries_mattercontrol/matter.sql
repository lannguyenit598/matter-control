-- Named queries for the MatterControl transaction spine (mcsqlc). Explicit columns;
-- parameters cast where sqlc would infer a narrower type.

-- name: LockMatter :one
SELECT id AS matter_id, workspace_id, title, event_seq, revision, last_recorded_at,
       boundaries_applied_until, next_boundary_at,
       GREATEST(clock_timestamp(), last_recorded_at)::timestamptz AS t_cmd
FROM matters WHERE id = $1 FOR UPDATE;

-- name: GetMatterHeader :one
SELECT id AS matter_id, workspace_id, title, event_seq, revision, last_recorded_at,
       boundaries_applied_until, next_boundary_at
FROM matters WHERE id = $1;

-- name: GetSnapshotAsOf :one
SELECT clock_timestamp()::timestamptz AS as_of;

-- name: GetWorkspaceMembershipForShare :one
SELECT workspace_id, user_id, role, status, revision
FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2 FOR SHARE;

-- name: GetWorkspaceMembership :one
SELECT workspace_id, user_id, role, status, revision
FROM workspace_memberships WHERE workspace_id = $1 AND user_id = $2;

-- name: GetMatterMembershipForShare :one
SELECT matter_id, user_id, role, status, revision
FROM matter_memberships WHERE matter_id = $1 AND user_id = $2 FOR SHARE;

-- name: GetMatterMembership :one
SELECT matter_id, user_id, role, status, revision
FROM matter_memberships WHERE matter_id = $1 AND user_id = $2;

-- name: FindReceipt :one
SELECT actor_id, idempotency_key, request_hash, scope_kind, workspace_id, matter_id,
       status_code, response, committed_at, purge_after
FROM command_receipts WHERE actor_id = $1 AND idempotency_key = $2;

-- name: ListReceiptMatters :many
SELECT represented_matter_id FROM command_receipt_matters
WHERE actor_id = $1 AND idempotency_key = $2;

-- name: InsertGraphNode :exec
INSERT INTO graph_nodes (id, matter_id, kind) VALUES ($1, $2, $3);

-- name: InsertRequirement :exec
INSERT INTO requirements (id, kind, matter_id, title, outcome, execution_state,
                          dependency_state, verification_state, verification_applicability,
                          proof_epoch, revision)
VALUES ($1, 'REQUIREMENT', $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: InsertRequirementCreatedEvent :exec
INSERT INTO domain_events (matter_id, seq, id, type, schema_version, actor_kind, actor_id,
                           target_kind, target_id, effective_at, recorded_at, command_key, after)
VALUES ($1, $2, $3, 'requirement.created', 1, 'USER', $4, 'REQUIREMENT', $5, $6, $7, $8, $9);

-- name: InsertCommandReceipt :exec
INSERT INTO command_receipts (actor_id, idempotency_key, request_hash, scope_kind,
                              workspace_id, matter_id, status_code, response, committed_at, purge_after)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: InsertCommandReceiptMatter :exec
INSERT INTO command_receipt_matters (actor_id, idempotency_key, represented_matter_id)
VALUES ($1, $2, $3);

-- name: CompleteMatter :exec
-- The service refuses any boundary due at t_cmd before mutating, so a next_boundary_at
-- that still exists here is strictly in the future and must be preserved, never
-- silently cleared: an unevaluated boundary stays pending.
UPDATE matters SET event_seq = $2, last_recorded_at = $3, boundaries_applied_until = $3,
                   revision = revision + 1
WHERE id = $1;

-- name: InsertSecurityAuditEvent :exec
INSERT INTO security_audit_events (id, occurred_at, actor_id, operation, outcome,
                                   requested_resource_kind, requested_id_hash, client_ip, request_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, sqlc.narg('client_ip')::inet, sqlc.narg('request_id')::text);

-- name: GetRequirementByID :one
SELECT id, matter_id, title, outcome, execution_state, dependency_state,
       verification_state, verification_applicability, applicability_reason,
       proof_epoch, workstream_id, owner_user_id, due_at, revision, imported_verification_claim
FROM requirements WHERE id = $1;

-- name: GetWorkspaceByID :one
SELECT id AS workspace_id, name, revision
FROM workspaces WHERE id = $1;

-- name: LockWorkspace :one
SELECT id AS workspace_id, name, revision,
       GREATEST(clock_timestamp(), statement_timestamp())::timestamptz AS w_cmd
FROM workspaces WHERE id = $1 FOR UPDATE;

-- name: InsertWorkspace :exec
INSERT INTO workspaces (id, name, revision) VALUES ($1, $2, $3);

-- name: InsertWorkspaceMembership :exec
INSERT INTO workspace_memberships (workspace_id, user_id, role, status, revision)
VALUES ($1, $2, $3, $4, $5);

-- name: CountActiveWorkspaceOwners :one
SELECT count(*)::bigint AS n FROM workspace_memberships
WHERE workspace_id = $1 AND role = 'OWNER' AND status = 'ACTIVE';

-- name: UpdateWorkspaceMembershipStatus :one
-- A2: see UpdateMatterMembershipStatus — row-revision predicate added.
UPDATE workspace_memberships SET status = sqlc.arg(status), revision = sqlc.arg(expected_revision) + 1
WHERE workspace_id = $1 AND user_id = $2 AND revision = sqlc.arg(expected_revision)
RETURNING revision;

-- name: BumpWorkspaceRevision :exec
UPDATE workspaces SET revision = $2 WHERE id = $1;

-- name: InsertMatter :exec
INSERT INTO matters (id, workspace_id, title, revision, event_seq, last_recorded_at,
                     boundaries_applied_until)
VALUES ($1, $2, $3, $4, $5, $6, $6);

-- name: InsertMatterMembership :exec
INSERT INTO matter_memberships (matter_id, user_id, role, status, revision)
VALUES ($1, $2, $3, $4, $5);

-- name: CountActiveMatterOwners :one
SELECT count(*)::bigint AS n FROM matter_memberships
WHERE matter_id = $1 AND role = 'OWNER' AND status = 'ACTIVE';

-- name: UpdateMatterMembershipStatus :one
-- A2: the membership-row revision predicate is defense-in-depth over the header FOR UPDATE
-- lock and the Go guard. The row carries its own change counter (it drifts from the header
-- revision as other commands run), so the CAS binds to the row's revision as loaded by the
-- caller in this same transaction.
UPDATE matter_memberships SET status = sqlc.arg(status), revision = sqlc.arg(expected_revision) + 1
WHERE matter_id = $1 AND user_id = $2 AND revision = sqlc.arg(expected_revision)
RETURNING revision;

-- name: InsertDomainEvent :exec
INSERT INTO domain_events (matter_id, seq, id, type, schema_version, actor_kind, actor_id,
                           target_kind, target_id, effective_at, recorded_at, reason, after)
VALUES ($1, $2, $3, $4, 1, 'USER', $5, $6, $7, $8, $9, $10, $11);

-- name: PageMatterEvents :many
SELECT matter_id, seq, id, type, schema_version, actor_kind, actor_id, target_kind,
       target_id, effective_at, recorded_at, cause_seq, correlation_id, command_key,
       reason, before, after
FROM domain_events
WHERE matter_id = sqlc.arg(matter_id)::uuid
  AND (recorded_at > sqlc.arg(after_recorded_at)::timestamptz
       OR (recorded_at = sqlc.arg(after_recorded_at)::timestamptz AND seq > sqlc.arg(after_seq)::bigint))
ORDER BY recorded_at, seq
LIMIT sqlc.arg(page_limit)::int;

-- name: RecentMatterEvents :many
SELECT matter_id, seq, id, type, schema_version, actor_kind, actor_id, target_kind,
       target_id, effective_at, recorded_at, cause_seq, correlation_id, command_key,
       reason, before, after
FROM domain_events
WHERE matter_id = sqlc.arg(matter_id)::uuid
ORDER BY recorded_at DESC, seq DESC
LIMIT sqlc.arg(page_limit)::int;

-- name: CountMatterEvents :one
SELECT count(*)::bigint AS n FROM domain_events WHERE matter_id = $1;

-- name: ListAccessibleMatters :many
SELECT m.id AS matter_id, m.workspace_id, m.title, m.event_seq, m.revision, m.last_recorded_at,
       m.boundaries_applied_until, m.next_boundary_at, mm.role AS caller_role
FROM matters m
JOIN matter_memberships mm ON mm.matter_id = m.id AND mm.user_id = $2
WHERE m.workspace_id = $1 AND mm.status = 'ACTIVE' AND m.id > $3
ORDER BY m.id
LIMIT $4;

-- name: CountAccessibleMatters :one
SELECT count(*)::bigint AS n
FROM matters m
JOIN matter_memberships mm ON mm.matter_id = m.id AND mm.user_id = $2
WHERE m.workspace_id = $1 AND mm.status = 'ACTIVE';

-- name: ResolveUserIdentity :one
SELECT id FROM users WHERE idp_issuer = $1 AND idp_subject = $2;

-- name: SearchLocalWorkspacePeople :many
SELECT u.id, u.display_name
FROM users u
JOIN users actor ON actor.id = sqlc.arg(actor_id)::uuid
JOIN workspace_memberships owner ON owner.user_id = actor.id
  AND owner.workspace_id = sqlc.arg(workspace_id)::uuid
  AND owner.role = 'OWNER' AND owner.status = 'ACTIVE'
WHERE u.idp_issuer = actor.idp_issuer
  AND strpos(lower(u.display_name), lower(sqlc.arg(search_name)::text)) > 0
  AND NOT EXISTS (SELECT 1 FROM workspace_memberships current_member
    WHERE current_member.workspace_id = owner.workspace_id AND current_member.user_id = u.id
      AND current_member.status = 'ACTIVE')
ORDER BY lower(u.display_name), u.id
LIMIT 20;

-- name: ListWorkspaceMembers :many
SELECT wm.user_id, u.display_name, wm.role, wm.status, wm.revision
FROM workspace_memberships wm JOIN users u ON u.id = wm.user_id
WHERE wm.workspace_id = $1 AND wm.status = 'ACTIVE'
ORDER BY wm.user_id;

-- name: ListMatterMembers :many
SELECT mm.user_id, u.display_name, mm.role, mm.status, mm.revision
FROM matter_memberships mm JOIN users u ON u.id = mm.user_id
WHERE mm.matter_id = $1 AND mm.status = 'ACTIVE'
ORDER BY mm.user_id;

-- name: ListMyWorkspaces :many
SELECT w.id AS workspace_id, w.name, w.revision, wm.role AS caller_role
FROM workspace_memberships wm JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = $1 AND wm.status = 'ACTIVE' AND w.id > $2
ORDER BY w.id
LIMIT $3;

-- name: CountMyWorkspaces :one
SELECT count(*)::bigint AS n FROM workspace_memberships
WHERE user_id = $1 AND status = 'ACTIVE';

-- ---------- W2 work graph ----------

-- name: ListRequirementsOfMatter :many
SELECT id, title, outcome, owner_user_id, due_at, workstream_id, execution_state, dependency_state,
       dependency_reasons, verification_state, verification_applicability, applicability_reason,
       proof_epoch, proof_epoch_opened_at, completed_at, cancelled_at, waiting_party_id,
       waiting_condition, critical_escalation_reason, revision, imported_verification_claim
FROM requirements WHERE matter_id = $1 ORDER BY id;

-- name: ListActionsOfMatter :many
SELECT id, title, outcome, owner_user_id, due_at, workstream_id, execution_state, dependency_state,
       dependency_reasons, proof_required, verification_state, verification_applicability,
       applicability_reason, proof_epoch, proof_epoch_opened_at, completed_at, cancelled_at,
       waiting_party_id, waiting_condition, critical_escalation_reason, revision, imported_verification_claim
FROM actions WHERE matter_id = $1 ORDER BY id;

-- name: InsertAction :exec
INSERT INTO actions (id, kind, matter_id, title, outcome, execution_state, dependency_state,
                     proof_required, revision)
VALUES ($1, 'ACTION', $2, $3, $4, 'NOT_STARTED', 'READY', false, 1);

-- name: UpdateRequirementWork :execrows
UPDATE requirements SET
    title = sqlc.arg(title), outcome = sqlc.arg(outcome), owner_user_id = sqlc.arg(owner_user_id),
    imported_verification_claim = sqlc.narg(imported_verification_claim),
    due_at = sqlc.arg(due_at), workstream_id = sqlc.arg(workstream_id),
    execution_state = sqlc.arg(execution_state), dependency_state = sqlc.arg(dependency_state),
    dependency_reasons = sqlc.arg(dependency_reasons), verification_state = sqlc.arg(verification_state),
    verification_applicability = sqlc.arg(verification_applicability),
    applicability_reason = sqlc.arg(applicability_reason), proof_epoch = sqlc.arg(proof_epoch),
    proof_epoch_opened_at = sqlc.arg(proof_epoch_opened_at), completed_at = sqlc.arg(completed_at),
    cancelled_at = sqlc.arg(cancelled_at), waiting_party_id = sqlc.arg(waiting_party_id),
    waiting_condition = sqlc.arg(waiting_condition),
    critical_escalation_reason = sqlc.arg(critical_escalation_reason),
    revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = sqlc.arg(id) AND revision = sqlc.arg(expected_revision)::bigint;

-- name: UpdateActionWork :execrows
UPDATE actions SET
    title = sqlc.arg(title), outcome = sqlc.arg(outcome), owner_user_id = sqlc.arg(owner_user_id),
    imported_verification_claim = sqlc.narg(imported_verification_claim),
    due_at = sqlc.arg(due_at), workstream_id = sqlc.arg(workstream_id),
    execution_state = sqlc.arg(execution_state), dependency_state = sqlc.arg(dependency_state),
    dependency_reasons = sqlc.arg(dependency_reasons), verification_state = sqlc.arg(verification_state),
    verification_applicability = sqlc.arg(verification_applicability),
    applicability_reason = sqlc.arg(applicability_reason), proof_epoch = sqlc.arg(proof_epoch),
    proof_epoch_opened_at = sqlc.arg(proof_epoch_opened_at), completed_at = sqlc.arg(completed_at),
    cancelled_at = sqlc.arg(cancelled_at), waiting_party_id = sqlc.arg(waiting_party_id),
    waiting_condition = sqlc.arg(waiting_condition),
    critical_escalation_reason = sqlc.arg(critical_escalation_reason),
    revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = sqlc.arg(id) AND revision = sqlc.arg(expected_revision)::bigint;

-- name: ListEdgesOfMatter :many
SELECT id, matter_id, source_id, target_id, gate FROM dependency_edges
WHERE matter_id = $1 ORDER BY id;

-- name: InsertEdge :exec
INSERT INTO dependency_edges (id, matter_id, source_id, target_id, gate) VALUES ($1, $2, $3, $4, $5);

-- name: DeleteEdge :execrows
DELETE FROM dependency_edges WHERE id = $1;

-- name: ListWorkstreamsOfMatter :many
SELECT id, matter_id, name, revision FROM workstreams WHERE matter_id = $1 ORDER BY id;

-- name: InsertWorkstream :exec
INSERT INTO workstreams (id, matter_id, name, revision) VALUES ($1, $2, $3, $4);

-- name: ListPartiesOfMatter :many
SELECT id, matter_id, name, kind, contact, notes, revision FROM parties WHERE matter_id = $1 ORDER BY id;

-- name: InsertParty :exec
INSERT INTO parties (id, matter_id, name, kind, contact, notes, revision) VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: UpdateParty :execrows
UPDATE parties SET name = sqlc.arg(name), kind = sqlc.arg(kind), contact = sqlc.arg(contact),
                   notes = sqlc.arg(notes), revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = sqlc.arg(id) AND revision = sqlc.arg(expected_revision)::bigint;

-- name: ListMilestonesOfMatter :many
SELECT id, matter_id, name, due_at, critical, revision FROM milestones WHERE matter_id = $1 ORDER BY id;

-- name: ListMilestonePrerequisitesOfMatter :many
SELECT milestone_id, requirement_id FROM milestone_prerequisites WHERE matter_id = $1
ORDER BY milestone_id, requirement_id;

-- name: InsertMilestone :exec
INSERT INTO milestones (id, matter_id, name, due_at, critical, revision) VALUES ($1, $2, $3, $4, $5, $6);

-- name: UpdateMilestone :execrows
UPDATE milestones SET name = sqlc.arg(name), due_at = sqlc.arg(due_at), critical = sqlc.arg(critical),
                      revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = sqlc.arg(id) AND revision = sqlc.arg(expected_revision)::bigint;

-- name: DeleteMilestonePrerequisites :exec
DELETE FROM milestone_prerequisites WHERE milestone_id = $1;

-- name: InsertMilestonePrerequisite :exec
INSERT INTO milestone_prerequisites (milestone_id, matter_id, requirement_id) VALUES ($1, $2, $3);

-- name: InsertWorkEvent :exec
INSERT INTO domain_events (matter_id, seq, id, type, schema_version, actor_kind, actor_id, target_kind,
                           target_id, effective_at, recorded_at, cause_seq, reason, before, after)
VALUES ($1, $2, $3, $4, 1, 'USER', $5, $6, $7, $8, $9, $10, $11, $12, $13);

-- name: ListMattersOfActor :many
SELECT m.id FROM matters m
JOIN matter_memberships mm ON mm.matter_id = m.id AND mm.user_id = $1 AND mm.status = 'ACTIVE'
JOIN workspace_memberships wm ON wm.workspace_id = m.workspace_id AND wm.user_id = $1 AND wm.status = 'ACTIVE'
ORDER BY m.id;

-- ---------- W3 documents, criteria, evidence, review ----------

-- name: ListDocumentsOfMatter :many
SELECT id, matter_id, name, current_version_id, revision FROM documents WHERE matter_id = $1 ORDER BY id;

-- name: InsertDocument :exec
INSERT INTO documents (id, matter_id, name, current_version_id, revision) VALUES ($1, $2, $3, $4, $5);

-- name: UpdateDocument :execrows
UPDATE documents SET name = sqlc.arg(name), current_version_id = sqlc.arg(current_version_id),
                     revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = sqlc.arg(id) AND revision = sqlc.arg(expected_revision)::bigint;

-- name: ListVersionsOfMatter :many
SELECT id, matter_id, document_id, version_no, predecessor_id, filename, media_type, sha256,
       size_bytes, uploaded_by, uploaded_at
FROM document_versions WHERE matter_id = $1 ORDER BY document_id, version_no;

-- name: InsertVersion :exec
INSERT INTO document_versions (id, matter_id, document_id, version_no, predecessor_id, filename,
                               media_type, sha256, size_bytes, uploaded_by, uploaded_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);

-- name: ListSignaturesOfMatter :many
SELECT id, matter_id, version_id, signer, signed_at, observed_by, recorded_at
FROM signature_observations WHERE matter_id = $1 ORDER BY recorded_at, id;

-- name: InsertSignature :exec
INSERT INTO signature_observations (id, matter_id, version_id, signer, signed_at, observed_by, recorded_at)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: ListCriteriaOfMatter :many
SELECT id, matter_id, subject_id, title, description, mandatory, version_rule, document_id,
       fixed_version_id, valid_for_seconds, retired, revision
FROM criteria WHERE matter_id = $1 ORDER BY id;

-- name: InsertCriterion :exec
INSERT INTO criteria (id, matter_id, subject_id, title, description, mandatory, version_rule,
                      document_id, fixed_version_id, valid_for_seconds, retired, revision)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);

-- name: UpdateCriterion :execrows
UPDATE criteria SET title = sqlc.arg(title), description = sqlc.arg(description), mandatory = sqlc.arg(mandatory),
                    version_rule = sqlc.arg(version_rule), document_id = sqlc.arg(document_id),
                    fixed_version_id = sqlc.arg(fixed_version_id), valid_for_seconds = sqlc.arg(valid_for_seconds),
                    retired = sqlc.arg(retired), revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = sqlc.arg(id) AND revision = sqlc.arg(expected_revision)::bigint;

-- name: ListEvidenceOfMatter :many
SELECT id, matter_id, kind, version_id, reference, description, submitted_by, submitted_at,
       valid_from, valid_until, withdrawn_at
FROM evidence WHERE matter_id = $1 ORDER BY id;

-- name: InsertEvidence :exec
INSERT INTO evidence (id, matter_id, kind, version_id, reference, description, submitted_by,
                      submitted_at, valid_from, valid_until)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: WithdrawEvidence :execrows
UPDATE evidence SET withdrawn_at = $2 WHERE id = $1 AND withdrawn_at IS NULL;

-- name: ListClaimsOfMatter :many
SELECT id, matter_id, evidence_id, evidence_submitter, criterion_id, criterion_revision,
       claimed_by, claimed_at
FROM evidence_claims WHERE matter_id = $1 ORDER BY id;

-- name: InsertClaim :exec
INSERT INTO evidence_claims (id, matter_id, evidence_id, evidence_submitter, criterion_id,
                             criterion_revision, claimed_by, claimed_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: ListAssessmentsOfMatter :many
SELECT id, matter_id, claim_id, subject_id, subject_epoch, verdict, reviewer_id, rationale,
       assessed_version_id, effective_until, recorded_at, superseded_by, revoked_at, revoked_by,
       revoked_reason, evidence_submitter, claimant
FROM assessments WHERE matter_id = $1 ORDER BY recorded_at, id;

-- name: InsertAssessment :exec
INSERT INTO assessments (id, matter_id, claim_id, subject_id, subject_epoch, verdict, reviewer_id,
                         rationale, assessed_version_id, effective_until, recorded_at,
                         evidence_submitter, claimant)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);

-- name: SupersedeAssessment :execrows
UPDATE assessments SET superseded_by = $2 WHERE id = $1 AND superseded_by IS NULL;

-- name: RevokeAssessment :execrows
UPDATE assessments SET revoked_at = $2, revoked_by = $3, revoked_reason = $4
WHERE id = $1 AND revoked_at IS NULL;

-- name: ListDisputesOfMatter :many
SELECT id, matter_id, assessment_id, raised_by, reason, raised_at, resolved_at, resolved_by, resolution
FROM disputes WHERE matter_id = $1 ORDER BY raised_at, id;

-- name: InsertDispute :exec
INSERT INTO disputes (id, matter_id, assessment_id, raised_by, reason, raised_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: ResolveDispute :execrows
UPDATE disputes SET resolved_at = $2, resolved_by = $3, resolution = $4
WHERE id = $1 AND resolved_at IS NULL;

-- name: ListActiveVerifiers :many
SELECT user_id FROM verifier_designations WHERE matter_id = $1 AND active ORDER BY user_id;

-- name: UpsertVerifier :exec
INSERT INTO verifier_designations (matter_id, user_id, active, designated_by, designated_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (matter_id, user_id) DO UPDATE SET active = EXCLUDED.active,
    designated_by = EXCLUDED.designated_by, designated_at = EXCLUDED.designated_at;
