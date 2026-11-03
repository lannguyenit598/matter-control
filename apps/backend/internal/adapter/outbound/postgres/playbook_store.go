package postgres

// RLF-05 PostgreSQL adapter for playbooks: immutable published revisions and the provenance of
// their applications. Revisions are append-only; instance rows are written inside the locked
// matter transaction so an application is atomic with the work it creates.

import (
	"context"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.PlaybookSnapshot    = (*pgSnapshot)(nil)
	_ port.MatterPlaybookTx    = (*pgMatterTx)(nil)
	_ port.WorkspacePlaybookTx = (*pgWorkspaceTx)(nil)
)

func playbookFromRow(r mcsqlc.Playbook) matter.Playbook {
	return matter.Playbook{
		ID: matter.PlaybookID(r.ID), WorkspaceID: matter.WorkspaceID(r.WorkspaceID), Name: r.Name,
		CreatedBy: matter.ActorID(r.CreatedBy), CreatedAt: r.CreatedAt.UTC(), Revision: r.Revision,
	}
}

func playbookRevisionFromRow(r mcsqlc.PlaybookRevision) (matter.PlaybookRevision, error) {
	entries, err := matter.ParsePlaybookEntries(r.Entries) // stored only by the publishing service
	if err != nil {
		return matter.PlaybookRevision{}, err
	}
	return matter.PlaybookRevision{
		ID: matter.PlaybookRevisionID(r.ID), PlaybookID: matter.PlaybookID(r.PlaybookID), No: r.No,
		Entries: entries, CreatedBy: matter.ActorID(r.CreatedBy), CreatedAt: r.CreatedAt.UTC(),
	}, nil
}

func (s *pgSnapshot) ListPlaybooks(ctx context.Context, w matter.WorkspaceID) ([]matter.Playbook, error) {
	rows, err := s.q.ListPlaybooksOfWorkspace(ctx, w.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.Playbook, 0, len(rows))
	for _, r := range rows {
		out = append(out, playbookFromRow(r))
	}
	return out, nil
}

func (s *pgSnapshot) LoadPlaybook(ctx context.Context, id matter.PlaybookID) (matter.Playbook, error) {
	r, err := s.q.GetPlaybook(ctx, id.String())
	if err != nil {
		return matter.Playbook{}, mapMatterError(err)
	}
	return playbookFromRow(r), nil
}

func (s *pgSnapshot) ListPlaybookRevisions(ctx context.Context, ids []matter.PlaybookID) ([]matter.PlaybookRevision, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	strs := make([]string, 0, len(ids))
	for _, id := range ids {
		strs = append(strs, id.String())
	}
	rows, err := s.q.ListPlaybookRevisionsOfPlaybookIds(ctx, strs)
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.PlaybookRevision, 0, len(rows))
	for _, r := range rows {
		rev, err := playbookRevisionFromRow(r)
		if err != nil {
			return nil, err
		}
		out = append(out, rev)
	}
	return out, nil
}

func (s *pgSnapshot) LoadPlaybookRevision(ctx context.Context, id matter.PlaybookRevisionID) (matter.PlaybookRevision, error) {
	r, err := s.q.GetPlaybookRevision(ctx, id.String())
	if err != nil {
		return matter.PlaybookRevision{}, mapMatterError(err)
	}
	return playbookRevisionFromRow(r)
}

func instanceFromRow(r mcsqlc.PlaybookInstance) matter.PlaybookInstance {
	return matter.PlaybookInstance{
		MatterID: matter.MatterID(r.MatterID), RevisionID: matter.PlaybookRevisionID(r.RevisionID),
		PlaybookID: matter.PlaybookID(r.PlaybookID), EntryKey: r.EntryKey, ItemID: matter.NodeID(r.ItemID),
		AppliedBy: matter.ActorID(r.AppliedBy), AppliedAt: r.AppliedAt.UTC(),
	}
}

func (s *pgSnapshot) ListPlaybookInstancesOfMatter(ctx context.Context, m matter.MatterID) ([]matter.PlaybookInstance, error) {
	rows, err := s.q.ListPlaybookInstancesOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.PlaybookInstance, 0, len(rows))
	for _, r := range rows {
		out = append(out, instanceFromRow(r))
	}
	return out, nil
}

func (s *pgSnapshot) ListPlaybookInstancesOfItems(ctx context.Context, ids []matter.NodeID) ([]matter.PlaybookInstance, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	strs := make([]string, 0, len(ids))
	for _, id := range ids {
		strs = append(strs, id.String())
	}
	rows, err := s.q.ListPlaybookInstancesOfItems(ctx, strs)
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.PlaybookInstance, 0, len(rows))
	for _, r := range rows {
		out = append(out, instanceFromRow(r))
	}
	return out, nil
}

// matter tx

func (t *pgMatterTx) LoadPlaybookRevision(ctx context.Context, id matter.PlaybookRevisionID) (matter.PlaybookRevision, error) {
	r, err := t.q.GetPlaybookRevision(ctx, id.String())
	if err != nil {
		return matter.PlaybookRevision{}, mapMatterError(err)
	}
	return playbookRevisionFromRow(r)
}

func (t *pgMatterTx) LoadPlaybook(ctx context.Context, id matter.PlaybookID) (matter.Playbook, error) {
	r, err := t.q.GetPlaybook(ctx, id.String())
	if err != nil {
		return matter.Playbook{}, mapMatterError(err)
	}
	return playbookFromRow(r), nil
}

func (t *pgMatterTx) ListPlaybookInstancesOfMatter(ctx context.Context, m matter.MatterID) ([]matter.PlaybookInstance, error) {
	rows, err := t.q.ListPlaybookInstancesOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.PlaybookInstance, 0, len(rows))
	for _, r := range rows {
		out = append(out, instanceFromRow(r))
	}
	return out, nil
}

func (t *pgMatterTx) InsertPlaybookInstance(ctx context.Context, i matter.PlaybookInstance) error {
	return mapMatterError(t.q.InsertPlaybookInstance(ctx, mcsqlc.InsertPlaybookInstanceParams{
		MatterID: i.MatterID.String(), RevisionID: i.RevisionID.String(), PlaybookID: i.PlaybookID.String(),
		EntryKey: i.EntryKey, ItemID: i.ItemID.String(), AppliedBy: i.AppliedBy.String(), AppliedAt: i.AppliedAt,
	}))
}

// workspace tx

func (t *pgWorkspaceTx) ListPlaybooks(ctx context.Context, w matter.WorkspaceID) ([]matter.Playbook, error) {
	rows, err := t.q.ListPlaybooksOfWorkspace(ctx, w.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.Playbook, 0, len(rows))
	for _, r := range rows {
		out = append(out, playbookFromRow(r))
	}
	return out, nil
}

func (t *pgWorkspaceTx) InsertPlaybook(ctx context.Context, p matter.Playbook) error {
	return mapMatterError(t.q.InsertPlaybook(ctx, mcsqlc.InsertPlaybookParams{
		ID: p.ID.String(), WorkspaceID: p.WorkspaceID.String(), Name: p.Name,
		CreatedBy: p.CreatedBy.String(), CreatedAt: p.CreatedAt,
	}))
}

func (t *pgWorkspaceTx) InsertPlaybookRevision(ctx context.Context, r matter.PlaybookRevision, entries []byte) error {
	return mapMatterError(t.q.InsertPlaybookRevision(ctx, mcsqlc.InsertPlaybookRevisionParams{
		ID: r.ID.String(), PlaybookID: r.PlaybookID.String(), No: r.No, Entries: entries,
		CreatedBy: r.CreatedBy.String(), CreatedAt: r.CreatedAt,
	}))
}

func (t *pgWorkspaceTx) MaxPlaybookRevisionNo(ctx context.Context, id matter.PlaybookID) (int64, error) {
	no, err := t.q.MaxPlaybookRevisionNo(ctx, id.String())
	if err != nil {
		return 0, mapMatterError(err)
	}
	return no, nil
}

func (t *pgWorkspaceTx) LoadPlaybook(ctx context.Context, id matter.PlaybookID) (matter.Playbook, error) {
	r, err := t.q.GetPlaybook(ctx, id.String())
	if err != nil {
		return matter.Playbook{}, mapMatterError(err)
	}
	return playbookFromRow(r), nil
}
