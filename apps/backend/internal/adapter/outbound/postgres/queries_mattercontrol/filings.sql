-- name: InsertFilingAction :exec
INSERT INTO actions (id, kind, matter_id, title, outcome, owner_user_id, execution_state, dependency_state,
                     proof_required, verification_state, verification_applicability, revision)
VALUES ($1, 'ACTION', $2, $3, $4, $5, 'NOT_STARTED', 'READY', $6,
        CASE WHEN $6 THEN 'UNVERIFIED' END, CASE WHEN $6 THEN 'REQUIRED' END, 1);

-- name: InsertFilingDetails :exec
INSERT INTO filing_details (item_id, matter_id, requirement_id, authority_party_id, stage,
                            negative_outcome, negative_outcome_epoch, current_cycle)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: UpdateFilingDetails :execrows
UPDATE filing_details SET stage = $2, negative_outcome = $3, negative_outcome_epoch = $4, current_cycle = $5,
                          signature_not_required = $6, signature_not_required_reason = $7,
                          signature_not_required_by = $8, signature_not_required_at = $9
WHERE item_id = $1;

-- name: ListFilingDetailsOfMatter :many
SELECT item_id, requirement_id, authority_party_id, stage, negative_outcome, negative_outcome_epoch, current_cycle,
       signature_not_required, signature_not_required_reason, signature_not_required_by, signature_not_required_at
FROM filing_details WHERE matter_id = $1 ORDER BY item_id;

-- name: InsertFilingCycle :exec
INSERT INTO filing_cycles (id, matter_id, item_id, cycle_no, opened_in_epoch, request_ref, owner_id, due_at, opened_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: MarkFilingCycleSubmitted :execrows
UPDATE filing_cycles SET submitted_at = $3, submission_id = $4 WHERE item_id = $1 AND cycle_no = $2;

-- name: ListFilingCyclesOfMatter :many
SELECT id, item_id, cycle_no, opened_in_epoch, request_ref, owner_id, due_at, opened_at, submitted_at, submission_id
FROM filing_cycles WHERE matter_id = $1 ORDER BY item_id, cycle_no;

-- name: InsertFilingSubmission :exec
INSERT INTO filing_submissions (id, matter_id, item_id, cycle_no, reference, submitted_at, version_ids, external_refs,
                                recorded_by, recorded_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: ListFilingSubmissionsOfMatter :many
SELECT id, item_id, cycle_no, reference, submitted_at, version_ids, external_refs, recorded_by, recorded_at
FROM filing_submissions WHERE matter_id = $1 ORDER BY item_id, recorded_at, id;

-- name: InsertFilingObservation :exec
INSERT INTO filing_observations (id, matter_id, item_id, seq, kind, from_stage, to_stage, reference, observed_at, evidence_ids,
                                 actor_id, reason, corrects_id, outcome, recorded_at, cycle_no, proof_epoch)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);

-- name: ListFilingObservationsOfMatter :many
SELECT id, item_id, seq, kind, from_stage, to_stage, reference, observed_at, evidence_ids, actor_id, reason,
       corrects_id, outcome, recorded_at, cycle_no, proof_epoch
FROM filing_observations WHERE matter_id = $1 ORDER BY item_id, seq;
