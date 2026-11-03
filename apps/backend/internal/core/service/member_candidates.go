package service

import (
	"context"
	"fmt"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// ListMatterMemberCandidates authorizes the owner and reads workspace names in one snapshot.
func (s *WorkspaceService) ListMatterMemberCandidates(ctx context.Context, q port.ListMembersQuery) ([]matter.Member, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return nil, err
	}
	id, err := matter.NewMatterID(q.ScopeID)
	if err != nil {
		return nil, err
	}
	var members []matter.Member
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, err := snap.MatterHeader(ctx, id)
		if err != nil {
			return err
		}
		ws, we := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, me := snap.MatterMembership(ctx, id, actor)
		access, err := accessFrom(ws, we, mm, me)
		if err != nil {
			return err
		}
		if d := policy.DecideMatterAdmin(access); !d.Allowed {
			if d.Hidden {
				return port.ErrNotFound
			}
			return port.ErrForbidden
		}
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support member candidates")
		}
		members, err = read.WorkspaceMembers(ctx, header.WorkspaceID)
		return err
	})
	return members, err
}
