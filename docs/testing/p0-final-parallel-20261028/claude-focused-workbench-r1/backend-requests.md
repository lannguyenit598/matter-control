# Backend request for Codex — Matter title on `/me/actions` (additive, optional)

Requested by the focused-workbench UI. Distinct from the infrastructure backlog in ADR-004/005. The UI already works without it.

- **Field:** `matterTitle` (string) on each `assigned` entry of `GET /me/actions` (`myActionsBody` → `assignedBody`, `apps/backend/internal/adapter/inbound/productapi/work_dto.go`).
- **Permission predicate:** none new. `MyActions` only returns entries from Matters the caller is an active member of, so the title is already authorized by the same membership that authorizes the entry.
- **Store/API impact:** the `MyActions` snapshot already reads each Matter (revision is returned as `matterRevision`); the title needs the same row. No migration, no new endpoint.
- **Tests:** response contains the title for an accessible Matter; a Matter the caller lost access to appears in no entry (existing hidden-resource behaviour); contract file `local-contract.md` updated.
- **UX affected:** My Work (Matter name on the current item and Up next) and the Matter overview. Today the page makes at most four server-side `GET /matters/{id}` reads (selected item plus Up next, de-duplicated, failures omit the name). When the field exists those reads can be deleted in `app/(app)/my-actions/page.tsx`.
- **Status:** not blocking; no Go file was edited by this task.
