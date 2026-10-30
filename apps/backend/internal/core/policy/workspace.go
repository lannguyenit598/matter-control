package policy

import "leonx.me/matter-control/internal/core/domain/matter"

// WorkspaceAccess summarizes workspace-membership lookups for workspace-scoped
// decisions. Only ErrNotFound means absence; lookup failures never become facts.
type WorkspaceAccess struct {
	WorkspaceFound bool // an ACTIVE membership row exists
	WorkspaceRole  matter.WorkspaceRole
}

// DecideWorkspaceRead applies the workspace read matrix: any ACTIVE workspace member
// may read the workspace; non-members get the uniform hidden denial.
func DecideWorkspaceRead(wa WorkspaceAccess) Decision {
	if !wa.WorkspaceFound {
		return Decision{Allowed: false, Hidden: true}
	}
	return Decision{Allowed: true}
}

// DecideWorkspaceAdmin applies the workspace administration matrix (grant/revoke
// membership): OWNER only; other members get a role denial, non-members the hidden
// denial.
func DecideWorkspaceAdmin(wa WorkspaceAccess) Decision {
	if !wa.WorkspaceFound {
		return Decision{Allowed: false, Hidden: true}
	}
	if wa.WorkspaceRole == matter.WorkspaceRoleOwner {
		return Decision{Allowed: true}
	}
	return Decision{Allowed: false, Hidden: false}
}

// DecideCreateMatter applies the create-matter matrix: Workspace OWNER only
// (approved permission matrix row "Create Matter / grant initial owner").
func DecideCreateMatter(wa WorkspaceAccess) Decision {
	return DecideWorkspaceAdmin(wa)
}

// DecideMatterAdmin applies the matter membership administration matrix: the caller
// must be an ACTIVE matter member with role OWNER (workspace activity is already
// part of Access).
func DecideMatterAdmin(a Access) Decision {
	if !a.MatterFound || !a.MatterActive || !a.WorkspaceActive {
		return Decision{Allowed: false, Hidden: true}
	}
	if a.MatterRole == matter.MatterRoleOwner {
		return Decision{Allowed: true}
	}
	return Decision{Allowed: false, Hidden: false}
}
