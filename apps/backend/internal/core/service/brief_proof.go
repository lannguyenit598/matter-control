package service

import (
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// replayBriefProof rebuilds decision inputs, never promotes a cached verification label.
// Historical criterion events omitted subject; a claim's recorded assessment supplies that link.
func replayBriefProof(events []matter.EventRecord, items map[string]*replayedItem, at time.Time) (map[matter.NodeID]matter.WorkItem, map[string]bool, error) {
	records := map[string]map[string]map[string]any{}
	kinds := map[string]string{
		"criterion.created": "criterion", "criterion.revised": "criterion",
		"evidence.submitted": "evidence", "evidence.claimed": "claim",
		"assessment.recorded": "assessment", "document.created": "document", "document.promoted": "document",
		"dependency.added": "edge", "dispute.raised": "dispute",
	}
	for _, kind := range []string{"criterion", "evidence", "claim", "assessment", "document", "edge", "dispute"} {
		records[kind] = map[string]map[string]any{}
	}
	for _, r := range events {
		if r.RecordedAt.After(at) {
			continue
		}
		kind, ok := kinds[r.Type]
		if ok {
			m, err := decodeObject(r)
			if err != nil {
				return nil, nil, err
			}
			records[kind][r.TargetID] = m
			continue
		}
		switch r.Type {
		case "dependency.removed":
			delete(records["edge"], r.TargetID)
		case "evidence.withdrawn", "assessment.revoked", "assessment.superseded", "dispute.resolved":
			kind = "assessment"
			key := "revokedAt"
			value := any(r.RecordedAt.Format(time.RFC3339Nano))
			switch r.Type {
			case "evidence.withdrawn":
				kind, key = "evidence", "withdrawnAt"
			case "assessment.superseded":
				key = "supersededBy"
				m, err := decodeObject(r)
				if err != nil {
					return nil, nil, err
				}
				value = m[key]
			case "dispute.resolved":
				kind, key = "dispute", "resolvedAt"
			}
			m, exists := records[kind][r.TargetID]
			if !exists {
				return nil, nil, unreconstructable("%s has no originating %s", r.ID, kind)
			}
			m[key] = value
		}
	}
	text := func(m map[string]any, k string) string { v, _ := m[k].(string); return v }
	number := func(m map[string]any, k string) int64 { v, _ := m[k].(float64); return int64(v) }
	flag := func(m map[string]any, k string) bool { v, _ := m[k].(bool); return v }
	// Infer only an explicit subject link from an assessment of a claim of this criterion.
	for _, a := range records["assessment"] {
		c := records["criterion"][text(records["claim"][text(a, "claim")], "criterion")]
		subject := text(a, "subject")
		if c != nil && subject != "" {
			if prior := text(c, "subject"); prior != "" && prior != subject {
				return nil, nil, unreconstructable("criterion has conflicting subjects")
			}
			c["subject"] = subject
		}
	}
	g := matter.WorkGraph{}
	for id, r := range items {
		m := r.m
		proof := r.kind == string(matter.NodeRequirement) || flag(m, "proofRequired") || text(m, "verification") != ""
		applicability := matter.VerificationApplicability(text(m, "applicability"))
		if proof && applicability == "" {
			applicability = matter.VerificationRequired
		}
		g.Items = append(g.Items, matter.WorkItem{ID: matter.NodeID(id), Kind: matter.NodeKind(r.kind), ProofRequired: proof,
			Execution: matter.ExecutionState(text(m, "execution")), Verification: matter.VerificationState(text(m, "verification")),
			Applicability: applicability, ProofEpoch: number(m, "proofEpoch")})
	}
	for id, m := range records["criterion"] {
		subject := text(m, "subject")
		if flag(m, "retired") && subject == "" {
			continue
		}
		if items[subject] == nil {
			return nil, nil, unreconstructable("criterion %s has no reconstructable subject", id)
		}
		_, mandatory := m["mandatory"].(bool)
		rule := matter.VersionRule(text(m, "rule"))
		if !mandatory || !rule.Valid() || number(m, "revision") < 1 {
			return nil, nil, unreconstructable("criterion %s lacks its decision fields", id)
		}
		c := matter.Criterion{ID: matter.CriterionID(id), SubjectID: matter.NodeID(subject), Mandatory: flag(m, "mandatory"), Rule: rule, Revision: number(m, "revision"), Retired: flag(m, "retired")}
		if d := text(m, "document"); d != "" {
			v := matter.DocumentID(d)
			c.DocumentID = &v
		}
		if d := text(m, "fixedVersion"); d != "" {
			v := matter.VersionID(d)
			c.FixedID = &v
		}
		if (rule == matter.VersionCurrent && c.DocumentID == nil) || (rule == matter.VersionFixed && c.FixedID == nil) {
			return nil, nil, unreconstructable("criterion %s lacks its version binding", id)
		}
		g.Evidence.Criteria = append(g.Evidence.Criteria, c)
	}
	for id, m := range records["evidence"] {
		from := instantOf(m["validFrom"])
		if from == nil {
			return nil, nil, unreconstructable("evidence %s lacks validFrom", id)
		}
		e := matter.Evidence{ID: matter.EvidenceID(id), ValidFrom: *from, ValidUntil: instantOf(m["validUntil"]), WithdrawnAt: instantOf(m["withdrawnAt"])}
		if v := text(m, "version"); v != "" {
			version := matter.VersionID(v)
			e.VersionID = &version
		}
		g.Evidence.Evidence = append(g.Evidence.Evidence, e)
	}
	for id, m := range records["claim"] {
		if records["evidence"][text(m, "evidence")] == nil || records["criterion"][text(m, "criterion")] == nil || number(m, "criterionRevision") < 1 {
			return nil, nil, unreconstructable("claim %s lacks its proof links", id)
		}
		g.Evidence.Claims = append(g.Evidence.Claims, matter.Claim{ID: matter.ClaimID(id), EvidenceID: matter.EvidenceID(text(m, "evidence")), CriterionID: matter.CriterionID(text(m, "criterion")), CriterionRev: number(m, "criterionRevision")})
	}
	for id, m := range records["assessment"] {
		claim := records["claim"][text(m, "claim")]
		c := records["criterion"][text(claim, "criterion")]
		subject := text(m, "subject")
		if subject == "" {
			subject = text(c, "subject")
		}
		_, epoch := m["subjectEpoch"].(float64)
		_, until := m["effectiveUntil"]
		verdict := matter.Verdict(text(m, "verdict"))
		if claim == nil || items[subject] == nil || !epoch || !until || (verdict != matter.VerdictAccepted && verdict != matter.VerdictRejected) {
			return nil, nil, unreconstructable("assessment %s lacks reconstructable decision inputs", id)
		}
		a := matter.Assessment{ID: matter.AssessmentID(id), ClaimID: matter.ClaimID(text(m, "claim")), SubjectID: matter.NodeID(subject), SubjectEpoch: number(m, "subjectEpoch"), Verdict: verdict, EffectiveUntil: instantOf(m["effectiveUntil"]), RevokedAt: instantOf(m["revokedAt"])}
		// Assessment commands require the exact evidence version; this binding is immutable.
		if v := text(records["evidence"][text(claim, "evidence")], "version"); v != "" {
			version := matter.VersionID(v)
			a.AssessedVersionID = &version
		}
		if v := text(m, "supersededBy"); v != "" {
			next := matter.AssessmentID(v)
			a.SupersededBy = &next
		}
		g.Evidence.Assessments = append(g.Evidence.Assessments, a)
	}
	for id, m := range records["document"] {
		d := matter.Document{ID: matter.DocumentID(id)}
		if v := text(m, "currentVersion"); v != "" {
			version := matter.VersionID(v)
			d.CurrentVersionID = &version
		}
		g.Evidence.Documents = append(g.Evidence.Documents, d)
	}
	for id, m := range records["dispute"] {
		if records["assessment"][text(m, "assessment")] == nil {
			return nil, nil, unreconstructable("dispute %s has no assessment", id)
		}
		g.Evidence.Disputes = append(g.Evidence.Disputes, matter.Dispute{ID: matter.DisputeID(id), AssessmentID: matter.AssessmentID(text(m, "assessment")), ResolvedAt: instantOf(m["resolvedAt"])})
	}
	for id, m := range records["edge"] {
		source, target := matter.NodeID(text(m, "source")), matter.NodeID(text(m, "target"))
		gate := matter.GateKind(text(m, "gate"))
		if err := matter.ValidateNewEdge(g.Items, g.Edges, source, target, gate); err != nil {
			return nil, nil, unreconstructable("dependency %s is invalid", id)
		}
		g.Edges = append(g.Edges, matter.Edge{ID: id, Source: source, Target: target, Gate: gate})
	}
	for id, item := range items {
		if text(item.m, "dependency") != string(matter.DependencyBlocked) {
			continue
		}
		found := false
		for _, edge := range g.Edges {
			if edge.Target.String() == id {
				found = true
				break
			}
		}
		if !found {
			return nil, nil, unreconstructable("blocked item %s lacks historical dependency edges", id)
		}
	}
	effective := matter.EffectiveGraph(g, at)
	out := map[matter.NodeID]matter.WorkItem{}
	expired := map[string]bool{}
	for _, it := range effective.Items {
		out[it.ID] = it
		for _, c := range matter.EvaluateVerification(it, g.Evidence, at).Criteria {
			if !c.Criterion.Mandatory || c.Satisfied {
				continue
			}
			for _, cl := range c.Claims {
				// Dispute has higher aggregate precedence, but expiry remains a separate fact.
				if cl.Reason == matter.CriterionExpired {
					expired[it.ID.String()] = true
				}
			}
		}
	}
	return out, expired, nil
}
