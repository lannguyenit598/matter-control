package policy_test

import (
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
)

// BE01-T02: the approved operation matrix with default deny. Create needs an ACTIVE
// workspace membership AND an ACTIVE matter membership with role OWNER or EDITOR;
// a workspace role alone grants nothing.
func TestDecideCreateRequirement(t *testing.T) {
	cases := []struct {
		name string
		in   policy.Access
		want policy.Decision
	}{
		{
			name: "matter OWNER with active workspace membership",
			in:   policy.Access{WorkspaceActive: true, MatterFound: true, MatterActive: true, MatterRole: matter.MatterRoleOwner},
			want: policy.Decision{Allowed: true},
		},
		{
			name: "matter EDITOR with active workspace membership",
			in:   policy.Access{WorkspaceActive: true, MatterFound: true, MatterActive: true, MatterRole: matter.MatterRoleEditor},
			want: policy.Decision{Allowed: true},
		},
		{
			name: "matter VIEWER is denied without hiding the matter",
			in:   policy.Access{WorkspaceActive: true, MatterFound: true, MatterActive: true, MatterRole: matter.MatterRoleViewer},
			want: policy.Decision{Allowed: false, Hidden: false},
		},
		{
			name: "workspace OWNER without matter membership is hidden-denied",
			in:   policy.Access{WorkspaceActive: true, MatterFound: false},
			want: policy.Decision{Allowed: false, Hidden: true},
		},
		{
			name: "revoked matter membership is hidden-denied",
			in:   policy.Access{WorkspaceActive: true, MatterFound: true, MatterActive: false, MatterRole: matter.MatterRoleOwner},
			want: policy.Decision{Allowed: false, Hidden: true},
		},
		{
			name: "active matter membership with revoked workspace membership is hidden-denied",
			in:   policy.Access{WorkspaceActive: false, MatterFound: true, MatterActive: true, MatterRole: matter.MatterRoleEditor},
			want: policy.Decision{Allowed: false, Hidden: true},
		},
		{
			name: "no membership at all is hidden-denied (default deny)",
			in:   policy.Access{},
			want: policy.Decision{Allowed: false, Hidden: true},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := policy.DecideCreateRequirement(tc.in)
			if got != tc.want {
				t.Fatalf("got %+v, want %+v", got, tc.want)
			}
		})
	}
}

// BE01-T02: read access needs active memberships; every matter role may read.
func TestDecideReadRequirement(t *testing.T) {
	for _, role := range []matter.MatterRole{matter.MatterRoleOwner, matter.MatterRoleEditor, matter.MatterRoleViewer} {
		d := policy.DecideReadRequirement(policy.Access{
			WorkspaceActive: true, MatterFound: true, MatterActive: true, MatterRole: role,
		})
		if !d.Allowed {
			t.Fatalf("role %s must read", role)
		}
	}
	for _, in := range []policy.Access{
		{WorkspaceActive: true, MatterFound: false},
		{WorkspaceActive: true, MatterFound: true, MatterActive: false, MatterRole: matter.MatterRoleViewer},
		{WorkspaceActive: false, MatterFound: true, MatterActive: true, MatterRole: matter.MatterRoleOwner},
		{},
	} {
		if d := policy.DecideReadRequirement(in); d.Allowed || !d.Hidden {
			t.Fatalf("read decision for %+v must be hidden denial, got %+v", in, d)
		}
	}
}
