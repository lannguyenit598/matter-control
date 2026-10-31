package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"regexp"
	"sort"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// EvidenceService implements the W3 use cases: documents with immutable versions and explicit
// promotion, evidence criteria distinct from proof, claims, independent per-claim assessment,
// dispute/revocation, verifier designation and the proof reads. Every command ends by recomputing
// the matter's derived verification and dependency state in the same transaction.
type EvidenceService struct {
	w       *WorkService
	objects port.ObjectStore
}

var _ port.EvidenceService = (*EvidenceService)(nil)

// NewEvidenceService builds the service on the work service (shared transaction spine) and the
// object store that holds document bytes.
func NewEvidenceService(w *WorkService, objects port.ObjectStore) *EvidenceService {
	return &EvidenceService{w: w, objects: objects}
}

func evTx(env *workEnv) (port.EvidenceTx, error) {
	ev, ok := env.tx.(port.EvidenceTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support evidence")
	}
	return ev, nil
}

func rejected(code, msg string) error { return &matter.RejectedError{Code: code, Message: msg} }

// recompute evaluates the matter after the command's writes (same transaction) and persists every
// item whose verification or dependency changed, with causal events.
func (s *EvidenceService) recompute(ctx context.Context, env *workEnv, stored matter.WorkGraph, cause int64) (matter.WorkGraph, error) {
	after, err := env.g.LoadGraph(ctx)
	if err != nil {
		return after, err
	}
	eff := matter.EffectiveGraph(after, env.tCmd)
	if err := s.w.persist(ctx, env, stored, eff, "", cause); err != nil {
		return eff, err
	}
	return eff, nil
}

// createdReceipt runs a receipted creation: a stored outcome replays (same id, no second
// effect); otherwise build runs and its outcome is stored with the request fingerprint.
func (s *WorkService) createdReceipt(ctx context.Context, env *workEnv, actor matter.ActorID, key matter.IdempotencyKey, hash matter.RequestHash,
	build func() (matter.CreatedResult, error),
) (matter.CreatedResult, error) {
	rcpt, err := env.tx.Receipt(ctx, actor, key)
	if err != nil && !errors.Is(err, port.ErrNotFound) {
		return matter.CreatedResult{}, err
	}
	if err == nil {
		if err := authorizeReceiptScope(ctx, env.tx, actor, rcpt); err != nil {
			env.replayHidden = errors.Is(err, port.ErrNotFound)
			return matter.CreatedResult{}, err
		}
		if rcpt.ScopeKind != matter.ScopeMatter || rcpt.WorkspaceID != env.header.WorkspaceID ||
			rcpt.MatterID == nil || *rcpt.MatterID != env.header.MatterID {
			return matter.CreatedResult{}, port.ErrIdempotencyKeyReuse
		}
		if rcpt.Kind != matter.SnapshotCreated || rcpt.CreatedSnapshot == nil {
			return matter.CreatedResult{}, matter.ErrSnapshotKind
		}
		if rcpt.RequestHash != hash {
			return matter.CreatedResult{}, port.ErrIdempotencyKeyReuse
		}
		stored := *rcpt.CreatedSnapshot
		stored.Replayed = true
		return stored, nil
	}
	if err := s.keyAge.Check(key, env.tCmd); err != nil {
		return matter.CreatedResult{}, err
	}
	res, err := build()
	if err != nil {
		return matter.CreatedResult{}, err
	}
	res.RecordedAt = env.tCmd
	matterID := env.header.MatterID
	if err := env.tx.StoreReceipt(ctx, matter.Receipt{
		ActorID: actor, IdempotencyKey: key, RequestHash: hash, ScopeKind: matter.ScopeMatter, WorkspaceID: env.header.WorkspaceID,
		MatterID: &matterID, StatusCode: 201, CommittedAt: env.tCmd, Matters: []matter.MatterID{matterID},
		Kind: matter.SnapshotCreated, CreatedSnapshot: &res,
	}); err != nil {
		return matter.CreatedResult{}, err
	}
	return res, nil
}

func parseReceiptInputs(actorID, key, hash string) (matter.ActorID, matter.IdempotencyKey, matter.RequestHash, error) {
	actor, err := matter.NewActorID(actorID)
	if err != nil {
		return "", "", "", err
	}
	k, err := matter.NewIdempotencyKey(key)
	if err != nil {
		return "", "", "", err
	}
	h, err := matter.NewRequestHash(hash)
	if err != nil {
		return "", "", "", err
	}
	return actor, k, h, nil
}

// ---------- documents ----------

func (s *EvidenceService) CreateDocument(ctx context.Context, cmd port.CreateDocumentCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	name, err := matter.NewDisplayName(cmd.Name, "name")
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_DOCUMENT", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			d := matter.Document{ID: matter.DocumentID(env.ids.NewRecordID()), MatterID: env.header.MatterID, Name: name, Revision: 1}
			if err := ev.InsertDocument(ctx, d); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "document.created", "DOCUMENT", d.ID.String(), "", nil, map[string]any{"name": name}, nil)
			return matter.CreatedResult{Kind: "DOCUMENT", ID: d.ID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

var filenameBad = regexp.MustCompile(`[\x00-\x1f\x7f/\\]`)

func cleanFilename(raw string) (string, error) {
	name := strings.TrimSpace(raw)
	if name == "" || len(name) > 255 || filenameBad.MatchString(name) || name == "." || name == ".." {
		return "", rejected("invalid-filename", "the file name is empty, too long or contains a path or control characters")
	}
	return name, nil
}

var sha256Re = regexp.MustCompile(`^[0-9a-f]{64}$`)

// AddVersion adds an immutable version that never becomes current by being added (RULE-011).
func (s *EvidenceService) AddVersion(ctx context.Context, cmd port.AddVersionCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	filename, err := cleanFilename(cmd.Filename)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	if !sha256Re.MatchString(cmd.Ref.SHA256) || cmd.Ref.Size < 0 {
		return matter.CreatedResult{}, rejected("invalid-content", "the stored content reference is invalid")
	}
	mediaType := strings.TrimSpace(cmd.MediaType)
	if mediaType == "" {
		mediaType = "application/octet-stream"
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "ADD_DOCUMENT_VERSION", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			g, err := env.g.LoadGraph(ctx)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			doc, ok := findDocument(g.Evidence, cmd.DocumentID)
			if !ok {
				return matter.CreatedResult{}, port.ErrNotFound
			}
			no, pred := 1, (*matter.VersionID)(nil)
			for _, v := range g.Evidence.Versions {
				if v.DocumentID == doc.ID && v.No >= no {
					no = v.No + 1
					id := v.ID
					pred = &id
				}
			}
			v := matter.DocumentVersion{
				ID: matter.VersionID(env.ids.NewRecordID()), MatterID: env.header.MatterID, DocumentID: doc.ID, No: no, Predecessor: pred,
				Filename: filename, MediaType: mediaType, SHA256: cmd.Ref.SHA256, SizeBytes: cmd.Ref.Size, UploadedBy: env.actor, UploadedAt: env.tCmd,
			}
			if err := ev.InsertVersion(ctx, v); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "document.version_added", "DOCUMENT_VERSION", v.ID.String(), "", nil,
				map[string]any{"document": doc.ID.String(), "versionNo": no, "filename": filename, "sha256": v.SHA256, "sizeBytes": v.SizeBytes}, nil)
			return matter.CreatedResult{Kind: "DOCUMENT_VERSION", ID: v.ID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

// UploadVersion stores the content, then records it as the next version. Authorization and the
// document's existence are checked first, so an actor who may not write never makes the server
// store their bytes; a content-addressed orphan after a failed command is harmless.
func (s *EvidenceService) UploadVersion(ctx context.Context, cmd port.UploadVersionCmd) (matter.CreatedResult, error) {
	if _, err := cleanFilename(cmd.Filename); err != nil {
		return matter.CreatedResult{}, err
	}
	mid, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	if err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "UPLOAD_DOCUMENT_VERSION", policy.DecideCreateRequirement, func(env *workEnv) error {
		g, err := env.g.LoadGraph(ctx)
		if err != nil {
			return err
		}
		if _, ok := findDocument(g.Evidence, cmd.DocumentID); !ok {
			return port.ErrNotFound
		}
		return nil
	}); err != nil {
		return matter.CreatedResult{}, err
	}
	ref, err := s.objects.Put(ctx, mid, cmd.Body, cmd.MaxBytes)
	if err != nil {
		return matter.CreatedResult{}, fmt.Errorf("store version content: %w", err)
	}
	bound := sha256.Sum256([]byte(cmd.RequestHash + "|" + ref.SHA256))
	return s.AddVersion(ctx, port.AddVersionCmd{
		ActorID: cmd.ActorID, MatterID: cmd.MatterID, DocumentID: cmd.DocumentID, IdempotencyKey: cmd.IdempotencyKey,
		RequestHash: hex.EncodeToString(bound[:]), Filename: cmd.Filename, MediaType: cmd.MediaType, Ref: ref,
	})
}

func findDocument(set matter.EvidenceSet, raw string) (matter.Document, bool) {
	for _, d := range set.Documents {
		if d.ID.String() == raw {
			return d, true
		}
	}
	return matter.Document{}, false
}

func findVersion(set matter.EvidenceSet, raw string) (matter.DocumentVersion, bool) {
	for _, v := range set.Versions {
		if v.ID.String() == raw {
			return v, true
		}
	}
	return matter.DocumentVersion{}, false
}

// promotionToken binds an acknowledgement to exactly this target, expected current version,
// document revision and the criteria the promotion will invalidate.
func promotionToken(doc matter.Document, target matter.VersionID, impact matter.PromotionImpact) string {
	cur := ""
	if doc.CurrentVersionID != nil {
		cur = doc.CurrentVersionID.String()
	}
	h := sha256.New()
	fmt.Fprintf(h, "promote|%s|%s|%s|%d", doc.ID, cur, target, doc.Revision)
	for _, c := range impact.Invalidated {
		fmt.Fprintf(h, "|i:%s", c)
	}
	for _, c := range impact.Unaffected {
		fmt.Fprintf(h, "|u:%s", c)
	}
	return hex.EncodeToString(h.Sum(nil))
}

// PromoteVersion makes exactly one version current: OWNER only, with the expected current
// version, the document revision, a reason and an acknowledgement of this exact impact. Promoting
// the version that is already current is a no-change.
func (s *EvidenceService) PromoteVersion(ctx context.Context, cmd port.PromoteVersionCmd) (matter.DocumentDetail, error) {
	var out matter.DocumentDetail
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "PROMOTE_DOCUMENT_VERSION", policy.DecideMatterAdmin, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		doc, ok := findDocument(g.Evidence, cmd.DocumentID)
		if !ok {
			return port.ErrNotFound
		}
		if cmd.ExpectedRevision == 0 {
			return port.ErrPreconditionRequired
		}
		target, ok := findVersion(g.Evidence, cmd.TargetVersionID)
		if !ok || target.DocumentID != doc.ID {
			return rejected("version-not-of-document", "the version does not belong to this document")
		}
		cur := ""
		if doc.CurrentVersionID != nil {
			cur = doc.CurrentVersionID.String()
		}
		if doc.Revision != cmd.ExpectedRevision || cur != cmd.ExpectedCurrentVersionID {
			return port.ErrPreconditionFailed
		}
		if cur == target.ID.String() {
			out = documentDetail(g.Evidence, doc, env.tCmd) // current-as-target: no change, no event
			return nil
		}
		if strings.TrimSpace(cmd.Reason) == "" {
			return rejected("reason-required", "a reason is required to promote a version")
		}
		impact := matter.ImpactOfPromotion(doc, g.Evidence)
		if cmd.ImpactToken != promotionToken(doc, target.ID, impact) {
			return rejected("impact-acknowledgement-required", "acknowledge the impact of promoting exactly this version")
		}
		next := doc
		id := target.ID
		next.CurrentVersionID = &id
		if err := ev.SaveDocument(ctx, next, doc.Revision); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "document.promoted", "DOCUMENT", doc.ID.String(), strings.TrimSpace(cmd.Reason),
			map[string]any{"currentVersion": cur}, map[string]any{"currentVersion": target.ID.String(), "versionNo": target.No,
				"invalidatedCriteria": criterionStrings(impact.Invalidated), "unaffectedCriteria": criterionStrings(impact.Unaffected)}, nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		next.Revision = doc.Revision + 1
		out = documentDetail(eff.Evidence, next, env.tCmd)
		return nil
	})
	return out, err
}

func criterionStrings(ids []matter.CriterionID) []string {
	out := make([]string, len(ids))
	for i, id := range ids {
		out[i] = id.String()
	}
	return out
}

func documentDetail(set matter.EvidenceSet, doc matter.Document, asOf time.Time) matter.DocumentDetail {
	d := matter.DocumentDetail{Document: doc, AsOf: asOf}
	for _, v := range set.Versions {
		if v.DocumentID == doc.ID {
			d.Versions = append(d.Versions, v)
		}
	}
	sort.Slice(d.Versions, func(i, j int) bool { return d.Versions[i].No < d.Versions[j].No })
	ids := map[matter.VersionID]bool{}
	for _, v := range d.Versions {
		ids[v.ID] = true
	}
	for _, sg := range set.Signatures {
		if ids[sg.VersionID] {
			d.Signatures = append(d.Signatures, sg)
		}
	}
	return d
}

// RecordSignature records that a named signer's signature was observed on one exact version.
func (s *EvidenceService) RecordSignature(ctx context.Context, cmd port.RecordSignatureCmd) (matter.DocumentDetail, error) {
	var out matter.DocumentDetail
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "RECORD_SIGNATURE", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		g, err := env.g.LoadGraph(ctx)
		if err != nil {
			return err
		}
		ver, ok := findVersion(g.Evidence, cmd.Version)
		if !ok {
			return port.ErrNotFound
		}
		signer, err := matter.NewDisplayName(cmd.Signer, "signer")
		if err != nil {
			return err
		}
		at, err := parseInstant(cmd.SignedAt, "signedAt")
		if err != nil {
			return err
		}
		if at.After(env.tCmd) {
			return rejected("signature-in-future", "a signature cannot be observed after the recorded time")
		}
		sg := matter.SignatureObservation{ID: env.ids.NewRecordID(), MatterID: env.header.MatterID, VersionID: ver.ID, Signer: signer, SignedAt: at, ObservedBy: env.actor, RecordedAt: env.tCmd}
		if err := ev.InsertSignature(ctx, sg); err != nil {
			return err
		}
		if _, err := env.emit(ctx, "signature.observed", "DOCUMENT_VERSION", ver.ID.String(), "", nil,
			map[string]any{"signer": signer, "signedAt": at.Format(time.RFC3339Nano)}, nil); err != nil {
			return err
		}
		set := g.Evidence
		set.Signatures = append(set.Signatures, sg)
		doc, _ := findDocument(set, ver.DocumentID.String())
		out = documentDetail(set, doc, env.tCmd)
		return nil
	})
	return out, err
}

// ---------- criteria ----------

func (s *EvidenceService) subject(g matter.WorkGraph, raw string) (matter.WorkItem, error) {
	it, err := findItem(g, raw)
	if err != nil {
		return it, err
	}
	if !it.ProofRequired {
		// A filing carries package and signature criteria whatever its outcome-verification flag
		// says (F03): the flag decides whether it has a verification state, not whether its
		// package is checked.
		if _, isFiling := g.Filing.Of(it.ID); !isFiling {
			return it, rejected("proof-not-required", "this record does not require proof")
		}
	}
	return it, nil
}

func buildCriterion(in port.CriterionInput, set matter.EvidenceSet) (matter.Criterion, error) {
	title, err := matter.NewDisplayName(in.Title, "title")
	if err != nil {
		return matter.Criterion{}, err
	}
	c := matter.Criterion{Title: title, Description: strings.TrimSpace(in.Description), Mandatory: in.Mandatory, Rule: matter.VersionRule(strings.TrimSpace(in.Rule)), Purpose: matter.CriterionPurpose(strings.TrimSpace(in.Purpose))}
	if c.Purpose == "" {
		c.Purpose = matter.PurposePackage
	}
	if !c.Purpose.Valid() {
		return c, rejected("invalid-purpose", "the purpose must be PACKAGE or OUTCOME")
	}
	if c.Rule == "" {
		c.Rule = matter.VersionNone
	}
	if !c.Rule.Valid() {
		return c, rejected("invalid-version-rule", "the version rule must be NONE, CURRENT_AUTHORITATIVE or FIXED")
	}
	if in.ValidDays < 0 {
		return c, rejected("invalid-validity", "the validity must be positive")
	}
	c.ValidFor = time.Duration(in.ValidDays) * 24 * time.Hour
	switch c.Rule {
	case matter.VersionCurrent:
		doc, ok := findDocument(set, in.DocumentID)
		if !ok {
			return c, rejected("unknown-document", "a current-version criterion needs a document of this matter")
		}
		c.DocumentID = &doc.ID
	case matter.VersionFixed:
		v, ok := findVersion(set, in.FixedID)
		if !ok {
			return c, rejected("unknown-version", "a fixed-version criterion needs an exact version of this matter")
		}
		c.FixedID = &v.ID
	}
	return c, nil
}

func (s *EvidenceService) checklist(g matter.WorkGraph, subject matter.NodeID, asOf time.Time) (matter.ProofChecklist, error) {
	it, ok := g.Item(subject)
	if !ok {
		return matter.ProofChecklist{}, port.ErrNotFound
	}
	out := matter.ProofChecklist{Subject: it, Result: matter.EvaluateVerification(it, g.Evidence, asOf), Verifiers: g.Evidence.Verifiers, AsOf: asOf}
	claimed := map[matter.EvidenceID]bool{}
	for _, c := range out.Result.Criteria {
		for _, cl := range c.Claims {
			claimed[cl.Claim.EvidenceID] = true
		}
	}
	for _, ev := range g.Evidence.Evidence {
		if claimed[ev.ID] {
			out.Evidence = append(out.Evidence, ev)
		}
	}
	subjectOf := map[matter.AssessmentID]matter.NodeID{}
	for _, a := range g.Evidence.Assessments {
		subjectOf[a.ID] = a.SubjectID
	}
	for _, d := range g.Evidence.Disputes {
		if d.ResolvedAt == nil && subjectOf[d.AssessmentID] == subject {
			out.OpenDisputes = append(out.OpenDisputes, d)
		}
	}
	for _, e := range g.Edges {
		if e.Source == subject && e.Gate == matter.GateProof {
			out.Dependencies = append(out.Dependencies, e.Target)
		}
	}
	return out, nil
}

func (s *EvidenceService) CreateCriterion(ctx context.Context, cmd port.CreateCriterionCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_CRITERION", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		it, err := s.subject(g, cmd.SubjectID)
		if err != nil {
			return err
		}
		c, err := buildCriterion(cmd.Criterion, g.Evidence)
		if err != nil {
			return err
		}
		if c.Purpose == matter.PurposeOutcome {
			// An outcome criterion is the authority decision accepted after the fact: it exists only
			// on a filing that has outcome verification, never on other records.
			if _, isFiling := g.Filing.Of(it.ID); !isFiling || !it.ProofRequired {
				return rejected("outcome-criterion-not-applicable", "an outcome criterion applies only to a filing that requires outcome verification")
			}
		}
		c.ID, c.MatterID, c.SubjectID, c.Revision = matter.CriterionID(env.ids.NewRecordID()), env.header.MatterID, it.ID, 1
		if err := ev.InsertCriterion(ctx, c); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "criterion.created", "CRITERION", c.ID.String(), "", nil, criterionSnapshot(c), nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		out, err = s.checklist(eff, it.ID, env.tCmd)
		return err
	})
	return out, err
}

func criterionSnapshot(c matter.Criterion) map[string]any {
	m := map[string]any{"subject": c.SubjectID.String(), "title": c.Title, "mandatory": c.Mandatory, "purpose": string(c.EffectivePurpose()), "rule": string(c.Rule), "validDays": int(c.ValidFor / (24 * time.Hour)), "retired": c.Retired, "revision": c.Revision}
	if c.DocumentID != nil {
		m["document"] = c.DocumentID.String()
	}
	if c.FixedID != nil {
		m["fixedVersion"] = c.FixedID.String()
	}
	return m
}

// ReviseCriterion replaces a criterion's definition (reason required). Claims and assessments pinned
// to the previous revision stop counting; nothing is rewritten.
func (s *EvidenceService) ReviseCriterion(ctx context.Context, cmd port.ReviseCriterionCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "REVISE_CRITERION", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		var cur matter.Criterion
		found := false
		for _, c := range g.Evidence.Criteria {
			if c.ID.String() == cmd.CriterionID {
				cur, found = c, true
			}
		}
		if !found {
			return port.ErrNotFound
		}
		if cmd.ExpectedRevision == 0 {
			return port.ErrPreconditionRequired
		}
		if cur.Revision != cmd.ExpectedRevision {
			return port.ErrPreconditionFailed
		}
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return rejected("reason-required", "a reason is required to revise a criterion")
		}
		next := cur
		if cmd.Retire {
			next.Retired = true
		} else {
			built, err := buildCriterion(cmd.Criterion, g.Evidence)
			if err != nil {
				return err
			}
			if strings.TrimSpace(cmd.Criterion.Purpose) != "" && built.Purpose != cur.EffectivePurpose() {
				return rejected("purpose-immutable", "a criterion keeps its purpose; retire it and declare a new one")
			}
			next.Title, next.Description, next.Mandatory, next.Rule = built.Title, built.Description, built.Mandatory, built.Rule
			next.DocumentID, next.FixedID, next.ValidFor = built.DocumentID, built.FixedID, built.ValidFor
		}
		// Retiring a criterion or changing whether it is mandatory changes what counts as verified:
		// that is an owner decision (RULE-005), like an applicability exception.
		if (next.Retired != cur.Retired || next.Mandatory != cur.Mandatory) && env.role != matter.MatterRoleOwner {
			return port.ErrForbidden
		}
		if err := ev.SaveCriterion(ctx, next, cur.Revision); err != nil {
			return err
		}
		next.Revision = cur.Revision + 1
		seq, err := env.emit(ctx, "criterion.revised", "CRITERION", cur.ID.String(), reason, criterionSnapshot(cur), criterionSnapshot(next), nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		out, err = s.checklist(eff, cur.SubjectID, env.tCmd)
		return err
	})
	return out, err
}

// SetApplicability is the OWNER's explicit applicability decision (RULE-005): NOT_REQUIRED only
// with a reason, from UNVERIFIED, with no applicable mandatory criterion and no open dispute;
// REQUIRED again revokes the exemption to UNVERIFIED.
func (s *EvidenceService) SetApplicability(ctx context.Context, cmd port.SetApplicabilityCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "SET_APPLICABILITY", policy.DecideMatterAdmin, func(env *workEnv) error {
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		it, err := s.subject(g, cmd.SubjectID)
		if err != nil {
			return err
		}
		if err := casCheck(it, cmd.ExpectedRevision); err != nil {
			return err
		}
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return rejected("reason-required", "a reason is required for an applicability decision")
		}
		next := it
		if cmd.NotRequired {
			res := matter.EvaluateVerification(it, g.Evidence, env.tCmd)
			mandatory := 0
			for _, c := range res.Criteria {
				if c.Criterion.Mandatory {
					mandatory++
				}
			}
			switch {
			case it.Applicability == matter.VerificationNotApplicable:
				out, err = s.checklist(g, it.ID, env.tCmd)
				return err // already not required: no change
			case res.State == matter.VerificationDisputed:
				return rejected("open-dispute", "resolve the dispute through a designated verifier first")
			case mandatory > 0:
				return rejected("mandatory-criteria-exist", "revise the criteria to none before declaring proof not required")
			case res.State != matter.VerificationUnverified:
				return rejected("not-unverified", "applicability can only be changed from UNVERIFIED")
			}
			next.Applicability, next.ApplicabilityReason = matter.VerificationNotApplicable, &reason
		} else {
			if it.Applicability != matter.VerificationNotApplicable {
				out, err = s.checklist(g, it.ID, env.tCmd)
				return err
			}
			next.Applicability, next.ApplicabilityReason = matter.VerificationRequired, nil
		}
		seq, err := env.emit(ctx, "work.applicability_changed", string(it.Kind), it.ID.String(), reason,
			map[string]any{"applicability": string(it.Applicability)}, map[string]any{"applicability": string(next.Applicability)}, nil)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		setItem(&updated, next)
		applyDerived(&updated, env.tCmd)
		if err := s.w.persist(ctx, env, stored, updated, it.ID, seq); err != nil {
			return err
		}
		out, err = s.checklist(updated, it.ID, env.tCmd)
		return err
	})
	return out, err
}

// ---------- evidence ----------

func claimCompatible(c matter.Criterion, ev matter.Evidence, set matter.EvidenceSet) error {
	switch c.Rule {
	case matter.VersionNone:
		return nil
	case matter.VersionCurrent:
		if ev.VersionID == nil {
			return rejected("evidence-kind-incompatible", "this criterion needs proof about a document version")
		}
		if v, ok := findVersion(set, ev.VersionID.String()); !ok || c.DocumentID == nil || v.DocumentID != *c.DocumentID {
			return rejected("version-mismatch", "the evidence is not a version of the document this criterion requires")
		}
	case matter.VersionFixed:
		if ev.VersionID == nil || c.FixedID == nil || *ev.VersionID != *c.FixedID {
			return rejected("version-mismatch", "this criterion is fixed to a specific version and the evidence is a different one")
		}
	}
	return nil
}

func currentCriterion(set matter.EvidenceSet, raw string) (matter.Criterion, error) {
	for _, c := range set.Criteria {
		if c.ID.String() == raw {
			if c.Retired {
				return c, rejected("criterion-retired", "this criterion is retired")
			}
			return c, nil
		}
	}
	return matter.Criterion{}, port.ErrNotFound
}

// SubmitEvidence records proof (an exact document version or an external reference) and offers it
// for the named criteria. It never verifies anything: the subject stays as it was until a designated
// independent verifier assesses a claim.
func (s *EvidenceService) SubmitEvidence(ctx context.Context, cmd port.SubmitEvidenceCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "SUBMIT_EVIDENCE", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			stored, g, err := s.w.loadGraphs(ctx, env)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			e := matter.Evidence{ID: matter.EvidenceID(env.ids.NewRecordID()), MatterID: env.header.MatterID, SubmittedBy: env.actor, SubmittedAt: env.tCmd, ValidFrom: env.tCmd, Description: strings.TrimSpace(cmd.Description)}
			switch {
			case cmd.VersionID != "":
				v, ok := findVersion(g.Evidence, cmd.VersionID)
				if !ok {
					return matter.CreatedResult{}, port.ErrNotFound
				}
				e.Kind, e.VersionID = matter.EvidenceDocumentVersion, &v.ID
			case strings.TrimSpace(cmd.Reference) != "":
				e.Kind, e.Reference = matter.EvidenceExternal, strings.TrimSpace(cmd.Reference)
			default:
				return matter.CreatedResult{}, rejected("evidence-target-required", "name a document version or an external reference")
			}
			if cmd.ValidFrom != "" {
				if e.ValidFrom, err = parseInstant(cmd.ValidFrom, "validFrom"); err != nil {
					return matter.CreatedResult{}, err
				}
			}
			if cmd.ValidUntil != "" {
				until, err := parseInstant(cmd.ValidUntil, "validUntil")
				if err != nil {
					return matter.CreatedResult{}, err
				}
				if !until.After(e.ValidFrom) {
					return matter.CreatedResult{}, rejected("invalid-validity", "the validity must end after it starts")
				}
				e.ValidUntil = &until
			}
			var claims []matter.Claim
			seen := map[string]bool{}
			for _, raw := range cmd.Claims {
				if seen[raw] {
					continue
				}
				seen[raw] = true
				c, err := currentCriterion(g.Evidence, raw)
				if err != nil {
					return matter.CreatedResult{}, err
				}
				if err := claimCompatible(c, e, g.Evidence); err != nil {
					return matter.CreatedResult{}, err
				}
				claims = append(claims, matter.Claim{ID: matter.ClaimID(env.ids.NewRecordID()), MatterID: e.MatterID, EvidenceID: e.ID, CriterionID: c.ID, CriterionRev: c.Revision, ClaimedBy: env.actor, ClaimedAt: env.tCmd, EvidenceSubmitter: env.actor})
			}
			if err := ev.InsertEvidence(ctx, e); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "evidence.submitted", "EVIDENCE", e.ID.String(), "", nil, evidenceSnapshot(e), nil)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			for _, k := range claims {
				if err := ev.InsertClaim(ctx, k); err != nil {
					return matter.CreatedResult{}, err
				}
				if _, err := env.emit(ctx, "evidence.claimed", "CLAIM", k.ID.String(), "", nil, map[string]any{"evidence": e.ID.String(), "criterion": k.CriterionID.String(), "criterionRevision": k.CriterionRev}, &seq); err != nil {
					return matter.CreatedResult{}, err
				}
			}
			// Submitting proves nothing: recompute only to keep the cache honest (no change expected).
			if _, err := s.recompute(ctx, env, stored, seq); err != nil {
				return matter.CreatedResult{}, err
			}
			return matter.CreatedResult{Kind: "EVIDENCE", ID: e.ID.String(), Seq: seq}, nil
		})
		return err
	})
	return out, err
}

func evidenceSnapshot(e matter.Evidence) map[string]any {
	m := map[string]any{"kind": string(e.Kind), "validFrom": e.ValidFrom.UTC().Format(time.RFC3339Nano), "description": e.Description}
	if e.VersionID != nil {
		m["version"] = e.VersionID.String()
	}
	if e.Reference != "" {
		m["reference"] = e.Reference
	}
	if e.ValidUntil != nil {
		m["validUntil"] = e.ValidUntil.UTC().Format(time.RFC3339Nano)
	}
	return m
}

func (s *EvidenceService) AddClaim(ctx context.Context, cmd port.AddClaimCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "ADD_CLAIM", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		var e matter.Evidence
		found := false
		for _, x := range g.Evidence.Evidence {
			if x.ID.String() == cmd.EvidenceID {
				e, found = x, true
			}
		}
		if !found {
			return port.ErrNotFound
		}
		if e.WithdrawnAt != nil {
			return rejected("evidence-withdrawn", "withdrawn evidence cannot be offered for a criterion")
		}
		c, err := currentCriterion(g.Evidence, cmd.CriterionID)
		if err != nil {
			return err
		}
		if err := claimCompatible(c, e, g.Evidence); err != nil {
			return err
		}
		for _, k := range g.Evidence.Claims {
			if k.EvidenceID == e.ID && k.CriterionID == c.ID && k.CriterionRev == c.Revision {
				return rejected("duplicate-claim", "this evidence is already offered for this criterion")
			}
		}
		k := matter.Claim{ID: matter.ClaimID(env.ids.NewRecordID()), MatterID: e.MatterID, EvidenceID: e.ID, CriterionID: c.ID, CriterionRev: c.Revision, ClaimedBy: env.actor, ClaimedAt: env.tCmd, EvidenceSubmitter: e.SubmittedBy}
		if err := ev.InsertClaim(ctx, k); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "evidence.claimed", "CLAIM", k.ID.String(), "", nil, map[string]any{"evidence": e.ID.String(), "criterion": c.ID.String(), "criterionRevision": c.Revision}, nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		out, err = s.checklist(eff, c.SubjectID, env.tCmd)
		return err
	})
	return out, err
}

func (s *EvidenceService) WithdrawEvidence(ctx context.Context, cmd port.WithdrawEvidenceCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "WITHDRAW_EVIDENCE", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		var e matter.Evidence
		found := false
		for _, x := range g.Evidence.Evidence {
			if x.ID.String() == cmd.EvidenceID {
				e, found = x, true
			}
		}
		if !found {
			return port.ErrNotFound
		}
		if e.SubmittedBy != env.actor && env.role != matter.MatterRoleOwner {
			return port.ErrForbidden // the submitter or an OWNER may withdraw
		}
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return rejected("reason-required", "a reason is required to withdraw evidence")
		}
		if e.WithdrawnAt != nil {
			return rejected("already-withdrawn", "this evidence was already withdrawn")
		}
		if err := ev.WithdrawEvidence(ctx, e.ID, env.tCmd); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "evidence.withdrawn", "EVIDENCE", e.ID.String(), reason, nil, map[string]any{"withdrawnAt": env.tCmd.Format(time.RFC3339Nano)}, nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		// the checklist of the first subject this evidence supported (if any)
		for _, k := range g.Evidence.Claims {
			if k.EvidenceID == e.ID {
				for _, c := range g.Evidence.Criteria {
					if c.ID == k.CriterionID {
						out, err = s.checklist(eff, c.SubjectID, env.tCmd)
						return err
					}
				}
			}
		}
		return nil
	})
	return out, err
}

// ---------- review ----------

type reviewTarget struct {
	claim matter.Claim
	crit  matter.Criterion
	item  matter.WorkItem
	cur   *matter.Assessment
}

// review resolves the claim, its criterion and subject, and applies the independence rules.
func (s *EvidenceService) review(env *workEnv, g matter.WorkGraph, claimID string) (reviewTarget, error) {
	var rt reviewTarget
	found := false
	for _, k := range g.Evidence.Claims {
		if k.ID.String() == claimID {
			rt.claim, found = k, true
		}
	}
	if !found {
		return rt, port.ErrNotFound
	}
	var err error
	if rt.crit, err = currentCriterion(g.Evidence, rt.claim.CriterionID.String()); err != nil {
		return rt, err
	}
	if rt.item, err = findItem(g, rt.crit.SubjectID.String()); err != nil {
		return rt, err
	}
	for i := range g.Evidence.Assessments {
		a := &g.Evidence.Assessments[i]
		if a.ClaimID == rt.claim.ID && a.SupersededBy == nil && a.SubjectEpoch == rt.item.ProofEpoch {
			rt.cur = a
		}
	}
	return rt, nil
}

func reviewDenied(d matter.ReviewDecision) error {
	switch d.Code {
	case "not-verifier":
		return rejected("not-verifier", "only a designated verifier may review proof")
	case "role":
		return port.ErrForbidden
	default:
		return rejected(d.Code, "nobody reviews proof they supplied or offered")
	}
}

// Assess records ACCEPT or REJECT on one claim: only a designated verifier holding EDITOR/OWNER
// who neither supplied nor offered the proof, about the criterion's current revision, the
// subject's current proof epoch and the exact version assessed.
func (s *EvidenceService) Assess(ctx context.Context, cmd port.AssessCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	verdict := matter.Verdict(strings.TrimSpace(cmd.Verdict))
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "ASSESS_CLAIM", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		rt, err := s.review(env, g, cmd.ClaimID)
		if err != nil {
			return err
		}
		if d := matter.DecideReview(env.actor, env.role, g.Evidence, rt.claim); !d.Allowed {
			return reviewDenied(d)
		}
		if verdict != matter.VerdictAccepted && verdict != matter.VerdictRejected {
			return rejected("invalid-verdict", "the verdict must be ACCEPTED or REJECTED")
		}
		rationale := strings.TrimSpace(cmd.Rationale)
		if rationale == "" {
			return rejected("rationale-required", "a rationale is required")
		}
		if rt.claim.CriterionRev != rt.crit.Revision {
			return rejected("stale-criterion-revision", "the criterion changed after this claim; claim the evidence again")
		}
		if cmd.ExpectedSubjectEpoch != rt.item.ProofEpoch {
			return rejected("stale-review", "the subject was reopened since you read it; review the current proof")
		}
		var e matter.Evidence
		for _, x := range g.Evidence.Evidence {
			if x.ID == rt.claim.EvidenceID {
				e = x
			}
		}
		if e.WithdrawnAt != nil {
			return rejected("evidence-withdrawn", "withdrawn evidence cannot be assessed")
		}
		var assessed *matter.VersionID
		if e.VersionID != nil {
			if cmd.AssessedVersionID != e.VersionID.String() {
				return rejected("assessed-version-mismatch", "state the exact version you assessed; it must be the evidence's version")
			}
			assessed = e.VersionID
		} else if cmd.AssessedVersionID != "" {
			return rejected("assessed-version-mismatch", "external evidence has no document version")
		}
		if verdict == matter.VerdictAccepted && rt.crit.Rule == matter.VersionCurrent {
			if doc, ok := findDocument(g.Evidence, derefDocID(rt.crit.DocumentID)); !ok || doc.CurrentVersionID == nil || assessed == nil || *assessed != *doc.CurrentVersionID {
				return rejected("version-not-current", "this criterion requires the current version, which is not the one assessed")
			}
		}
		if rt.cur != nil {
			for _, d := range g.Evidence.Disputes {
				if d.AssessmentID == rt.cur.ID && d.ResolvedAt == nil {
					return rejected("open-dispute", "resolve the dispute before assessing again")
				}
			}
		}
		// F02: bind the review intent to the assessment the reviewer saw. A mismatch is
		// a stale 412 — an intervening verdict is never silently superseded, and a lost
		// response is recovered by re-reading, never by resending with a new binding.
		saw := ""
		if rt.cur != nil {
			saw = rt.cur.ID.String()
		}
		if cmd.ExpectedAssessmentID == nil {
			return port.ErrPreconditionRequired
		}
		if *cmd.ExpectedAssessmentID != saw {
			return fmt.Errorf("%w: the assessment changed since you read it; re-read the proof checklist", port.ErrPreconditionFailed)
		}
		a := matter.Assessment{
			ID: matter.AssessmentID(env.ids.NewRecordID()), MatterID: env.header.MatterID, ClaimID: rt.claim.ID, SubjectID: rt.item.ID,
			SubjectEpoch: rt.item.ProofEpoch, Verdict: verdict, Reviewer: env.actor, Rationale: rationale, AssessedVersionID: assessed,
			RecordedAt: env.tCmd, EvidenceSubmitter: rt.claim.EvidenceSubmitter, Claimant: rt.claim.ClaimedBy,
		}
		switch {
		case cmd.ValidDays > 0:
			t := env.tCmd.Add(time.Duration(cmd.ValidDays) * 24 * time.Hour)
			a.EffectiveUntil = &t
		case rt.crit.ValidFor > 0:
			t := env.tCmd.Add(rt.crit.ValidFor)
			a.EffectiveUntil = &t
		}
		if err := ev.InsertAssessment(ctx, a); err != nil {
			return err
		}
		if rt.cur != nil {
			if err := ev.SupersedeAssessment(ctx, rt.cur.ID, a.ID); err != nil {
				return err
			}
		}
		seq, err := env.emit(ctx, "assessment.recorded", "ASSESSMENT", a.ID.String(), rationale, nil,
			map[string]any{
				"claim": rt.claim.ID.String(), "subject": a.SubjectID.String(), "verdict": string(verdict), "subjectEpoch": a.SubjectEpoch,
				"criterionRevision": rt.crit.Revision, "effectiveUntil": untilOf(a.EffectiveUntil),
			}, nil)
		if err != nil {
			return err
		}
		if rt.cur != nil {
			if _, err := env.emit(ctx, "assessment.superseded", "ASSESSMENT", rt.cur.ID.String(), "", nil, map[string]any{"supersededBy": a.ID.String()}, &seq); err != nil {
				return err
			}
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		out, err = s.checklist(eff, rt.item.ID, env.tCmd)
		return err
	})
	return out, err
}

func derefDocID(id *matter.DocumentID) string {
	if id == nil {
		return ""
	}
	return id.String()
}

// currentAssessmentOf finds the assessment by id and its claim target.
func (s *EvidenceService) assessmentTarget(env *workEnv, g matter.WorkGraph, id string) (matter.Assessment, reviewTarget, error) {
	for _, a := range g.Evidence.Assessments {
		if a.ID.String() == id {
			rt, err := s.review(env, g, a.ClaimID.String())
			return a, rt, err
		}
	}
	return matter.Assessment{}, reviewTarget{}, port.ErrNotFound
}

// RevokeAssessment ends the satisfaction of an accepted assessment (explicit authorized reversal);
// the decision itself stays in history.
func (s *EvidenceService) RevokeAssessment(ctx context.Context, cmd port.RevokeAssessmentCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "REVOKE_ASSESSMENT", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		a, rt, err := s.assessmentTarget(env, g, cmd.AssessmentID)
		if err != nil {
			return err
		}
		if d := matter.DecideReview(env.actor, env.role, g.Evidence, rt.claim); !d.Allowed {
			return reviewDenied(d)
		}
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return rejected("reason-required", "a reason is required to revoke an acceptance")
		}
		if a.SupersededBy != nil || a.RevokedAt != nil || a.Verdict != matter.VerdictAccepted {
			return rejected("not-revocable", "only a current accepted assessment can be revoked")
		}
		if err := ev.RevokeAssessment(ctx, a.ID, env.tCmd, env.actor, reason); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "assessment.revoked", "ASSESSMENT", a.ID.String(), reason, nil, map[string]any{"claim": a.ClaimID.String()}, nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		out, err = s.checklist(eff, rt.item.ID, env.tCmd)
		return err
	})
	return out, err
}

// RaiseDispute challenges an accepted assessment: the subject is DISPUTED until an independent
// designated verifier resolves it.
func (s *EvidenceService) RaiseDispute(ctx context.Context, cmd port.RaiseDisputeCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "RAISE_DISPUTE", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		a, rt, err := s.assessmentTarget(env, g, cmd.AssessmentID)
		if err != nil {
			return err
		}
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return rejected("reason-required", "a reason is required to challenge proof")
		}
		if a.SupersededBy != nil || a.RevokedAt != nil || a.Verdict != matter.VerdictAccepted || a.SubjectEpoch != rt.item.ProofEpoch {
			return rejected("not-disputable", "only a current accepted assessment can be challenged")
		}
		for _, d := range g.Evidence.Disputes {
			if d.AssessmentID == a.ID && d.ResolvedAt == nil {
				return rejected("already-disputed", "this assessment is already disputed")
			}
		}
		d := matter.Dispute{ID: matter.DisputeID(env.ids.NewRecordID()), MatterID: env.header.MatterID, AssessmentID: a.ID, RaisedBy: env.actor, Reason: reason, RaisedAt: env.tCmd}
		if err := ev.InsertDispute(ctx, d); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "dispute.raised", "DISPUTE", d.ID.String(), reason, nil, map[string]any{"assessment": a.ID.String()}, nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		out, err = s.checklist(eff, rt.item.ID, env.tCmd)
		return err
	})
	return out, err
}

// ResolveDispute closes a dispute after an independent designated verifier has weighed the current
// proof. It restores nothing from a previous label: the aggregate is recomputed from current proof.
func (s *EvidenceService) ResolveDispute(ctx context.Context, cmd port.ResolveDisputeCmd) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "RESOLVE_DISPUTE", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		var d matter.Dispute
		found := false
		for _, x := range g.Evidence.Disputes {
			if x.ID.String() == cmd.DisputeID {
				d, found = x, true
			}
		}
		if !found {
			return port.ErrNotFound
		}
		_, rt, err := s.assessmentTarget(env, g, d.AssessmentID.String())
		if err != nil {
			return err
		}
		if dec := matter.DecideReview(env.actor, env.role, g.Evidence, rt.claim); !dec.Allowed {
			return reviewDenied(dec)
		}
		if env.actor == d.RaisedBy {
			return rejected("self-dispute", "the person who raised a dispute cannot resolve it")
		}
		resolution := strings.TrimSpace(cmd.Resolution)
		if resolution == "" {
			return rejected("rationale-required", "a resolution rationale is required")
		}
		if d.ResolvedAt != nil {
			return rejected("already-resolved", "this dispute is already resolved")
		}
		if err := ev.ResolveDispute(ctx, d.ID, env.tCmd, env.actor, resolution); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "dispute.resolved", "DISPUTE", d.ID.String(), resolution, nil, map[string]any{"assessment": d.AssessmentID.String()}, nil)
		if err != nil {
			return err
		}
		eff, err := s.recompute(ctx, env, stored, seq)
		if err != nil {
			return err
		}
		out, err = s.checklist(eff, rt.item.ID, env.tCmd)
		return err
	})
	return out, err
}

// DesignateVerifier sets or revokes verifier designation (OWNER only). The target must be an
// active EDITOR or OWNER of the matter and an active workspace member; OWNER status alone is
// never verifier authority.
func (s *EvidenceService) DesignateVerifier(ctx context.Context, cmd port.DesignateVerifierCmd) ([]matter.ActorID, error) {
	var out []matter.ActorID
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "DESIGNATE_VERIFIER", policy.DecideMatterAdmin, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		target, err := matter.NewActorID(cmd.UserID)
		if err != nil {
			return err
		}
		g, err := env.g.LoadGraph(ctx)
		if err != nil {
			return err
		}
		active := !cmd.Revoke
		if active {
			if err := ownerMustBeMember(ctx, env, target); err != nil {
				return rejected("verifier-not-member", "a verifier must be an active member of this matter")
			}
			mm, err := env.tx.MatterMembership(ctx, env.header.MatterID, target)
			if err != nil {
				return err
			}
			if mm.Role != matter.MatterRoleEditor && mm.Role != matter.MatterRoleOwner {
				return rejected("verifier-role", "a verifier must hold the EDITOR or OWNER role")
			}
		}
		if g.Evidence.IsVerifier(target) == active {
			out = verifiersWith(g.Evidence.Verifiers, target, active)
			return nil // no change
		}
		if err := ev.SetVerifier(ctx, target, active, env.actor, env.tCmd); err != nil {
			return err
		}
		typ := "verifier.designated"
		if !active {
			typ = "verifier.revoked"
		}
		if _, err := env.emit(ctx, typ, "MATTER_MEMBERSHIP", target.String(), "", nil, map[string]any{"user": target.String()}, nil); err != nil {
			return err
		}
		out = verifiersWith(g.Evidence.Verifiers, target, active)
		return nil
	})
	return out, err
}

func verifiersWith(cur []matter.ActorID, user matter.ActorID, active bool) []matter.ActorID {
	var out []matter.ActorID
	for _, v := range cur {
		if v != user {
			out = append(out, v)
		}
	}
	if active {
		out = append(out, user)
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

// ---------- reads ----------

func (s *EvidenceService) ListDocuments(ctx context.Context, q port.MatterListQuery) ([]matter.Document, error) {
	var out []matter.Document
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		out = append([]matter.Document{}, g.Evidence.Documents...)
		sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
		return nil
	})
	return out, err
}

func (s *EvidenceService) GetDocument(ctx context.Context, q port.DocumentQuery) (matter.DocumentDetail, error) {
	var out matter.DocumentDetail
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, asOf time.Time, _ int64) error {
		doc, ok := findDocument(g.Evidence, q.DocumentID)
		if !ok {
			return port.ErrNotFound
		}
		out = documentDetail(g.Evidence, doc, asOf)
		if q.PromoteTo != "" {
			target, ok := findVersion(g.Evidence, q.PromoteTo)
			if !ok || target.DocumentID != doc.ID {
				return rejected("version-not-of-document", "the version does not belong to this document")
			}
			impact := matter.ImpactOfPromotion(doc, g.Evidence)
			out.Impact, out.ImpactToken = &impact, promotionToken(doc, target.ID, impact)
		}
		return nil
	})
	return out, err
}

// OpenVersion streams the exact bytes of one version after the same read authorization as every
// other read. A version whose content cannot be read is reported as unavailable, never as empty.
func (s *EvidenceService) OpenVersion(ctx context.Context, q port.VersionContentQuery) (matter.DocumentVersion, io.ReadCloser, error) {
	var ver matter.DocumentVersion
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		v, ok := findVersion(g.Evidence, q.VersionID)
		if !ok {
			return port.ErrNotFound
		}
		ver = v
		return nil
	})
	if err != nil {
		return matter.DocumentVersion{}, nil, err
	}
	mid, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return matter.DocumentVersion{}, nil, err
	}
	rc, err := s.objects.Open(ctx, mid, ver.SHA256)
	if err != nil {
		s.reportContentIncident(ctx, mid, ver.SHA256, err)
		return matter.DocumentVersion{}, nil, fmt.Errorf("open version content: %w", err)
	}
	// A damaged object is only found while reading, after the response has started.
	return ver, &incidentReader{ReadCloser: rc, report: func(err error) { s.reportContentIncident(ctx, mid, ver.SHA256, err) }}, nil
}

// reportContentIncident logs, at error level, content the store says is missing or damaged. The
// record exists but its bytes do not: an integrity incident an operator must hear about, unlike a
// store that is merely down (which the caller already retries). Only the matter and the digest are
// logged: no file name, no actor, no content.
func (s *EvidenceService) reportContentIncident(ctx context.Context, m matter.MatterID, sha256 string, err error) {
	var problem string
	switch {
	case errors.Is(err, port.ErrObjectMissing):
		problem = "missing"
	case errors.Is(err, port.ErrObjectCorrupt):
		problem = "corrupt"
	default:
		return
	}
	s.w.logger.ErrorContext(ctx, "document content integrity incident", "matter", m.String(), "sha256", sha256, "problem", problem)
}

// incidentReader reports the first read failure once, however often the caller reads again.
type incidentReader struct {
	io.ReadCloser
	report   func(error)
	reported bool
}

func (r *incidentReader) Read(p []byte) (int, error) {
	n, err := r.ReadCloser.Read(p)
	if err != nil && !errors.Is(err, io.EOF) && !r.reported {
		r.reported = true
		r.report(err)
	}
	return n, err
}

func (s *EvidenceService) ProofChecklist(ctx context.Context, q port.SubjectQuery) (matter.ProofChecklist, error) {
	var out matter.ProofChecklist
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, asOf time.Time, _ int64) error {
		it, err := findItem(g, q.SubjectID)
		if err != nil {
			return err
		}
		out, err = s.checklist(g, it.ID, asOf)
		return err
	})
	return out, err
}

func (s *EvidenceService) Verifiers(ctx context.Context, q port.MatterListQuery) ([]matter.ActorID, error) {
	var out []matter.ActorID
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		out = append([]matter.ActorID{}, g.Evidence.Verifiers...)
		return nil
	})
	return out, err
}

func (s *EvidenceService) ListEvidence(ctx context.Context, q port.MatterListQuery) ([]matter.Evidence, error) {
	var out []matter.Evidence
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		out = append([]matter.Evidence{}, g.Evidence.Evidence...)
		sort.Slice(out, func(i, j int) bool { return out[i].SubmittedAt.After(out[j].SubmittedAt) })
		return nil
	})
	return out, err
}

// untilOf renders an acceptance's expiry for the history payload (nil = no expiry).
func untilOf(t *time.Time) any {
	if t == nil {
		return nil
	}
	return t.UTC().Format(time.RFC3339Nano)
}

// ReviewQueue lists, across the matters the caller can access, the claims they may assess now as a
// designated independent verifier (BF-05). It is a read model separate from My Actions: nothing
// here changes Next Action eligibility, and DecideReview keeps a submitter from seeing their own
// offer. Rows come only from matters returned by MattersOf (ACTIVE matter and workspace
// membership), and the queue is recomputed on every read, so a revoked designation, role or
// membership removes rows and the count immediately.
//
// ponytail: loads each accessible matter's graph (as MyActions does); index by pending claim if
// the number of accessible matters grows large.
func (s *EvidenceService) ReviewQueue(ctx context.Context, q port.ReviewQueueQuery) (matter.ReviewQueue, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.ReviewQueue{}, err
	}
	limit := q.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var out matter.ReviewQueue
	err = s.w.store.View(ctx, func(snap port.MatterSnapshot) error {
		gs, ok := snap.(port.WorkGraphSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support the work graph")
		}
		reads, _ := snap.(port.MatterReadSnapshot)
		asOf := snap.AsOf()
		ids, err := gs.MattersOf(ctx, actor)
		if err != nil {
			return err
		}
		var rows []matter.PendingAssessment
		for _, m := range ids {
			mm, err := snap.MatterMembership(ctx, m, actor)
			if err != nil {
				if errors.Is(err, port.ErrNotFound) {
					continue
				}
				return err
			}
			if mm.Status != matter.StatusActive {
				continue
			}
			g, err := gs.LoadGraph(ctx, m)
			if err != nil {
				return err
			}
			if !g.Evidence.IsVerifier(actor) {
				continue // not designated here: the matter contributes nothing, not even a count
			}
			found := matter.PendingAssessmentsIn(actor, mm.Role, g.Items, g.Evidence, asOf)
			if len(found) == 0 {
				continue
			}
			header, err := snap.MatterHeader(ctx, m)
			if err != nil {
				return err
			}
			names := map[matter.ActorID]string{}
			if reads != nil {
				members, err := reads.MatterMembers(ctx, m)
				if err != nil {
					return err
				}
				for _, mem := range members {
					names[mem.UserID] = mem.DisplayName
				}
			}
			for _, r := range found {
				r.MatterTitle = header.Title
				r.ClaimedByName, r.SubmittedByName = names[r.ClaimedBy], names[r.EvidenceSubmitter]
				rows = append(rows, r)
			}
		}
		out = matter.PageReviewQueue(rows, q.After, limit)
		out.AsOf = asOf
		return nil
	})
	if err != nil {
		return matter.ReviewQueue{}, fmt.Errorf("review queue: %w", err)
	}
	return out, nil
}
