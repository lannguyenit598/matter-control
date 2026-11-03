package mattercontrol

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"

	"golang.org/x/text/unicode/norm"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

func searchKey(text string) string {
	return strings.Map(func(r rune) rune {
		if r >= 0x0300 && r <= 0x036f {
			return -1
		}
		if r == 'Đ' || r == 'đ' {
			return 'd'
		}
		return unicode.ToLower(r)
	}, norm.NFD.String(text))
}

func (s *Store) SearchPage(ctx context.Context, r port.SearchRead) (matter.SearchPage, error) {
	var out matter.SearchPage
	err := s.View(ctx, func(snapshot port.MatterSnapshot) error {
		snap := snapshot.(*memSnapshot)
		state := snap.state
		b := r.Binding
		needle := searchKey(b.Query)
		if needle == "" {
			return port.ErrSearchInvalid
		}
		rows := []matter.SearchItem{}
		for id, ws := range state.wsHeaders {
			wm, ok := state.wsMemberships[wsKey{id, matter.ActorID(b.ActorID)}]
			if !ok || wm.Status != matter.StatusActive {
				continue
			}
			if b.Group == "workspaces" {
				rows = append(rows, matter.SearchItem{ID: id.String(), Kind: "WORKSPACE", Label: ws.Name, WorkspaceID: id.String(), WorkspaceName: ws.Name, Role: string(wm.Role)})
				continue
			}
			for mid, m := range state.matters {
				if m.WorkspaceID != id {
					continue
				}
				mm, ok := state.mMemberships[mmKey{mid, matter.ActorID(b.ActorID)}]
				if !ok || mm.Status != matter.StatusActive {
					continue
				}
				base := matter.SearchItem{WorkspaceID: id.String(), WorkspaceName: ws.Name, MatterID: mid.String(), MatterTitle: m.Title, Role: string(mm.Role)}
				if b.Group == "matters" {
					item := base
					item.ID = mid.String()
					item.Kind = "MATTER"
					item.Label = m.Title
					rows = append(rows, item)
				}
				if b.Group == "workItems" {
					appendWork := func(w matter.WorkItem) {
						if w.MatterID != mid {
							return
						}
						item := base
						item.ID = w.ID.String()
						item.Kind = string(w.Kind)
						if _, ok := state.filings[w.ID]; ok {
							item.Kind = "FILING"
						}
						item.Label = w.Title
						outcome := []rune(w.Outcome)
						if len(outcome) > 160 {
							outcome = outcome[:160]
						}
						item.Outcome = string(outcome)
						item.Execution = string(w.Execution)
						item.DueAt = w.DueAt
						rows = append(rows, item)
					}
					for _, w := range state.actions {
						appendWork(w)
					}
					for _, w := range state.requirements {
						appendWork(w)
					}
				}
				if b.Group == "documents" {
					for _, doc := range state.documents {
						if doc.MatterID != mid {
							continue
						}
						item := base
						item.ID = doc.ID.String()
						item.Kind = "DOCUMENT"
						item.Label = doc.Name
						if doc.CurrentVersionID != nil {
							v, ok := state.versions[*doc.CurrentVersionID]
							if ok {
								item.Version = v.No
								t := v.UploadedAt
								item.UploadedAt = &t
							}
						}
						rows = append(rows, item)
					}
				}
			}
		}
		matching := rows[:0]
		for _, row := range rows {
			if strings.Contains(searchKey(row.Label), needle) {
				matching = append(matching, row)
			}
		}
		sort.Slice(matching, func(i, j int) bool {
			a, b := matching[i], matching[j]
			if a.Kind != b.Kind {
				return a.Kind < b.Kind
			}
			return a.ID < b.ID
		})
		duplicates := make(map[string]int)
		for _, row := range matching {
			duplicates[row.Kind+"\x00"+row.MatterID+"\x00"+row.Label]++
		}
		for i := range matching {
			row := &matching[i]
			row.SameName = duplicates[row.Kind+"\x00"+row.MatterID+"\x00"+row.Label] > 1
		}
		rank := func(x matter.SearchItem) int {
			key := searchKey(x.Label)
			if key == needle {
				return 0
			}
			if strings.HasPrefix(key, needle) {
				return 1
			}
			return 2
		}
		h := sha256.New()
		stamp := func(t *time.Time) string {
			if t == nil {
				return ""
			}
			return t.UTC().Format("2006-01-02T15:04:05.000000Z")
		}
		for _, x := range matching {
			for _, cell := range []string{x.Kind, x.ID, x.Label, x.WorkspaceID, x.WorkspaceName, x.MatterID, x.MatterTitle, x.Role, x.Outcome, x.Execution, stamp(x.DueAt), strconv.Itoa(x.Version), stamp(x.UploadedAt), searchKey(x.Label), strconv.Itoa(rank(x)), strconv.Itoa(func() int {
				if x.MatterID == b.MatterID {
					return 0
				}
				return 1
			}())} {
				_, _ = fmt.Fprintf(h, "%d:%s", len(cell), cell)
			}
		}
		fingerprint := hex.EncodeToString(h.Sum(nil))
		if r.Anchor.Fingerprint != "" && r.Anchor.Fingerprint != fingerprint {
			return port.ErrSearchStale
		}

		sort.Slice(matching, func(i, j int) bool {
			a, c := matching[i], matching[j]
			ra, rc := rank(a), rank(c)
			if ra != rc {
				return ra < rc
			}
			if (a.MatterID == b.MatterID) != (c.MatterID == b.MatterID) {
				return a.MatterID == b.MatterID
			}
			ka, kc := searchKey(a.Label), searchKey(c.Label)
			if ka != kc {
				return ka < kc
			}
			if a.Kind != c.Kind {
				return a.Kind < c.Kind
			}
			return a.ID < c.ID
		})
		start := 0
		if r.Anchor.ID != "" {
			found := false
			for i, x := range matching {
				if x.ID == r.Anchor.ID && x.Kind == r.Anchor.Kind {
					start = i + 1
					found = true
					break
				}
			}
			if !found {
				return port.ErrSearchStale
			}
		}
		end := min(start+b.Limit, len(matching))
		out = matter.SearchPage{Items: append([]matter.SearchItem{}, matching[start:end]...), HasMore: end < len(matching), Fingerprint: fingerprint, AsOf: snap.AsOf()}
		return nil
	})
	return out, err
}
