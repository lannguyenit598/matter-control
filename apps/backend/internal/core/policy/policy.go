// Package policy decides MatterControl operations from access facts: the approved
// operation matrix with default deny. It is pure: callers resolve memberships, pass
// the summarized access, and map the decision to outcomes.
package policy

import "leonx.me/matter-control/internal/core/domain/matter"

// Access summarizes the memberships a caller holds for one matter scope. Missing
// facts are false; anything not explicitly granted is denied.
type Access struct {
	// WorkspaceActive reports an ACTIVE workspace membership for the caller in the
	// matter's workspace. The workspace role itself carries no matter operation.
	WorkspaceActive bool
	// MatterFound reports that a matter membership row exists for the caller.
	MatterFound bool
	// MatterActive reports that the matter membership is ACTIVE (not revoked).
	MatterActive bool
	// MatterRole is the caller's matter role; valid only when MatterActive is true.
	MatterRole matter.MatterRole
}

// Decision is the outcome of an operation check. Hidden distinguishes the uniform
// not-visible denial (missing or revoked membership: the boundary must not reveal
// whether the matter exists) from a role denial (the caller is a member but the role
// lacks the operation).
type Decision struct {
	Allowed bool
	Hidden  bool
}

// DecideCreateRequirement applies the create matrix: default deny; an ACTIVE workspace
// membership AND an ACTIVE matter membership with role OWNER or EDITOR are required.
// A workspace role alone — including Workspace OWNER — grants no matter operation.
func DecideCreateRequirement(a Access) Decision {
	if !a.MatterFound || !a.MatterActive || !a.WorkspaceActive {
		return Decision{Allowed: false, Hidden: true}
	}
	if a.MatterRole == matter.MatterRoleOwner || a.MatterRole == matter.MatterRoleEditor {
		return Decision{Allowed: true}
	}
	return Decision{Allowed: false, Hidden: false} // member (VIEWER): role denial
}

// DecideReadRequirement applies the read matrix: default deny; an ACTIVE workspace
// membership and an ACTIVE matter membership with any matter role are required.
func DecideReadRequirement(a Access) Decision {
	if !a.MatterFound || !a.MatterActive || !a.WorkspaceActive {
		return Decision{Allowed: false, Hidden: true}
	}
	return Decision{Allowed: true}
}
