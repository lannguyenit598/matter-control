package service

// RLF-04 Saved Views (REQ-MC-P1-12): private named work-grid filter definitions, scoped to one
// owner and one Matter. A view stores a validated filter shape — never record copies, tokens,
// URLs or executable content. Applying a view re-runs the authorized grid read, so results
// always reflect current access. Sharing does not exist: a list read returns only the caller's
// own rows, and knowing an id never grants another user's filter or data.

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

type SavedViews struct{ w *WorkService }

func NewSavedViewService(w *WorkService) *SavedViews { return &SavedViews{w: w} }

func savedViewSnap(snap port.MatterSnapshot) (port.SavedViewSnapshot, error) {
	s, ok := snap.(port.SavedViewSnapshot)
	if !ok {
		return nil, fmt.Errorf("snapshot does not support saved views")
	}
	return s, nil
}

func savedViewTx(env *workEnv) (port.SavedViewTx, error) {
	t, ok := env.tx.(port.SavedViewTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support saved views")
	}
	return t, nil
}

// savedViewName validates the stored name: trimmed, 1..100 characters. A malformed name is
// input validation (422), never a domain refusal.
func savedViewName(name string) (string, error) {
	n := strings.TrimSpace(name)
	if len(n) < 1 || len(n) > 100 {
		ve := &domain.ValidationError{}
		ve.Add("name", "a saved view name must be 1..100 characters")
		return "", ve
	}
	return n, nil
}

// marshalFilters serializes the typed filter shape. The type itself has no free-form field, so
// stored content is always the validated shape; the HTTP decode rejects unknown members before
// the command ever runs.
func marshalFilters(f matter.SavedViewFilters) ([]byte, error) {
	b, err := json.Marshal(f)
	if err != nil {
		return nil, fmt.Errorf("saved view filters: %w", err)
	}
	return b, nil
}

// ListSavedViews returns the caller's OWN views of one Matter; another member's views are never
// visible and a Matter the caller cannot read is the uniform 404.
func (s *SavedViews) ListSavedViews(ctx context.Context, q port.ListSavedViewsQuery) ([]matter.SavedView, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return nil, err
	}
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return nil, err
	}
	var out []matter.SavedView
	err = s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		vs, err := savedViewSnap(snap)
		if err != nil {
			return err
		}
		out, err = vs.ListSavedViews(ctx, matterID, actor)
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("list saved views: %w", err)
	}
	return out, nil
}

// CreateSavedView creates one view owned by the caller (EDITOR or OWNER: a VIEWER keeps
// read-only surfaces everywhere). Receipted per §2.1: an unknown outcome replays with the SAME
// key; a different fingerprint on the same key is reuse.
func (s *SavedViews) CreateSavedView(ctx context.Context, cmd port.CreateSavedViewCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	name, err := savedViewName(cmd.Name)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	filters, err := marshalFilters(cmd.Filters)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_SAVED_VIEW", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := savedViewTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			if err := refuseDuplicateViewName(ctx, tx, env.header.MatterID, env.actor, name, ""); err != nil {
				return matter.CreatedResult{}, err
			}
			v := matter.SavedView{
				ID: matter.SavedViewID(env.ids.NewRecordID()), MatterID: matterID, OwnerID: env.actor,
				Name: name, Filters: cmd.Filters, CreatedAt: env.tCmd, UpdatedAt: env.tCmd, Revision: 1,
			}
			if err := tx.InsertSavedView(ctx, v, filters); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "saved_view.created", "SAVED_VIEW", v.ID.String(), "", nil, savedViewSnapshot(v), nil)
			return matter.CreatedResult{Kind: "SAVED_VIEW", ID: v.ID.String(), Seq: seq}, err
		})
		return err
	})
	return out, err
}

// UpdateSavedView renames or re-filters one view. Only its owner may change it; anyone else —
// member or not — gets the uniform 404. CAS on the view revision; an unchanged view writes no
// event and keeps its revision.
func (s *SavedViews) UpdateSavedView(ctx context.Context, cmd port.UpdateSavedViewCmd) (matter.SavedView, error) {
	name, err := savedViewName(cmd.Name)
	if err != nil {
		return matter.SavedView{}, err
	}
	filters, err := marshalFilters(cmd.Filters)
	if err != nil {
		return matter.SavedView{}, err
	}
	var out matter.SavedView
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "UPDATE_SAVED_VIEW", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := savedViewTx(env)
		if err != nil {
			return err
		}
		current, err := loadOwnSavedView(ctx, tx, env, cmd.ViewID)
		if err != nil {
			return err
		}
		if cmd.ExpectedRevision == 0 {
			return port.ErrPreconditionRequired
		}
		if current.Revision != cmd.ExpectedRevision {
			return port.ErrPreconditionFailed
		}
		if err := refuseDuplicateViewName(ctx, tx, env.header.MatterID, env.actor, name, current.ID.String()); err != nil {
			return err
		}
		updated := current
		updated.Name, updated.Filters = name, cmd.Filters
		if updated.Name == current.Name && updated.Filters == current.Filters {
			out = current
			return nil
		}
		updated.UpdatedAt = env.tCmd
		if err := tx.SaveSavedView(ctx, updated, cmd.ExpectedRevision, filters); err != nil {
			return err
		}
		if _, err := env.emit(ctx, "saved_view.updated", "SAVED_VIEW", updated.ID.String(), "", savedViewSnapshot(current), savedViewSnapshot(updated), nil); err != nil {
			return err
		}
		updated.Revision = cmd.ExpectedRevision + 1
		out = updated
		return nil
	})
	if err != nil {
		return matter.SavedView{}, err
	}
	return out, nil
}

// DeleteSavedView removes one view. Owner-of-view only, CAS on the view revision.
func (s *SavedViews) DeleteSavedView(ctx context.Context, cmd port.DeleteSavedViewCmd) error {
	return s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "DELETE_SAVED_VIEW", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := savedViewTx(env)
		if err != nil {
			return err
		}
		current, err := loadOwnSavedView(ctx, tx, env, cmd.ViewID)
		if err != nil {
			return err
		}
		if cmd.ExpectedRevision == 0 {
			return port.ErrPreconditionRequired
		}
		if current.Revision != cmd.ExpectedRevision {
			return port.ErrPreconditionFailed
		}
		if err := tx.DeleteSavedView(ctx, current, cmd.ExpectedRevision); err != nil {
			return err
		}
		_, err = env.emit(ctx, "saved_view.deleted", "SAVED_VIEW", current.ID.String(), "", savedViewSnapshot(current), nil, nil)
		return err
	})
}

// loadOwnSavedView reads one view inside the transaction and refuses anything the caller does
// not own: another user's view, another matter's view and a nonexistent view are all the same
// uniform not-found.
func loadOwnSavedView(ctx context.Context, tx port.SavedViewTx, env *workEnv, viewID string) (matter.SavedView, error) {
	id, err := matter.NewSavedViewID(viewID)
	if err != nil {
		return matter.SavedView{}, err
	}
	views, err := tx.ListSavedViews(ctx, env.header.MatterID, env.actor)
	if err != nil {
		return matter.SavedView{}, err
	}
	for _, v := range views {
		if v.ID == id && v.MatterID == env.header.MatterID && v.OwnerID == env.actor {
			return v, nil
		}
	}
	return matter.SavedView{}, port.ErrNotFound
}

func savedViewSnapshot(v matter.SavedView) map[string]any {
	return map[string]any{"name": v.Name, "filters": v.Filters, "revision": v.Revision}
}

// refuseDuplicateViewName keeps (matter, owner, name) unique through a typed refusal instead of
// letting a storage constraint surface as an internal error. The matter-row lock serializes
// writes, so this in-transaction check is race-free on both stores.
func refuseDuplicateViewName(ctx context.Context, tx port.SavedViewTx, m matter.MatterID, owner matter.ActorID, name, exceptID string) error {
	views, err := tx.ListSavedViews(ctx, m, owner)
	if err != nil {
		return err
	}
	for _, v := range views {
		if v.Name == name && v.ID.String() != exceptID {
			return rejected("duplicate-saved-view", "you already have a saved view with this name in this matter")
		}
	}
	return nil
}
