# Document Lineage and Content Storage

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`; Cloudflare R2 pricing/get-started snapshots (Oct 2026).
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. Object-store provider WAITING_PO_APPROVAL (TB-05).

## 1. Model

- `Document`: identity in a Matter (title, revision, `current_version_id` nullable). No current version until an OWNER promotes one.
- `DocumentVersion`: immutable; `seq` unique per document; `source ∈ {CONTENT, EXTERNAL_REFERENCE}` (FR-015 allows a reference without bytes); `predecessor_version_id` for lineage; `sha256`, `size_bytes`, `media_type`, `uploaded_by`, `availability ∈ {AVAILABLE, UNAVAILABLE}`.
- `ContentObject`: storage record for bytes (`object_key`, status `PENDING|COMMITTED|ABANDONED|MISSING`), separate from the version so storage reconciliation never rewrites lineage.
- `SignatureObservation`: per exact version and signatory; independent from current-version status and upload (RULE-011).

Invariants: one current pointer per document (column, so uniqueness is structural); the current version must belong to the document (composite FK `(document_id, current_version_id)` → `document_versions(document_id, id)`); versions are never updated except `availability`; no hard delete.

## 2. Upload never promotes; promotion is explicit (AC-115)

```
Promote(doc, versionId, expectedCurrentVersionId, reason) by OWNER, If-Match doc revision:
  lock matter; authorize OWNER; check doc.current_version_id == expectedCurrentVersionId (else 412)
  version belongs to doc and is AVAILABLE or EXTERNAL_REFERENCE
  set current_version_id; revision+1; emit document.version_promoted{from, to, reason}
  impact := subjects with CURRENT_AUTHORITATIVE criteria on doc; recompute verification + readiness
  return impact summary (criteria now unsatisfied, subjects whose aggregate changed)
```

The previous version is "superseded" by derivation (not current and older seq), not by mutation.

## 3. Content upload: staging → commit → reconciliation

```mermaid
sequenceDiagram
  participant UI as Frontend (Server Action)
  participant API as Go API
  participant DB as PostgreSQL
  participant OS as Object store
  UI->>API: POST /documents/{id}/version-uploads {sha256,size,mediaType} Idempotency-Key
  API->>DB: txn: authorize EDITOR/OWNER; insert content_objects PENDING (random key, expires_at)
  API-->>UI: 201 {uploadId, upload target}
  UI->>OS: PUT bytes to staging key (via API stream or short-lived signed PUT)
  UI->>API: POST /version-uploads/{uploadId}:commit {predecessorVersionId?} Idempotency-Key
  API->>OS: HEAD/stream-hash object; verify size and sha256
  API->>DB: txn: lock matter; re-authorize; mark COMMITTED; insert document_version; emit document.version_added
  API-->>UI: 201 {versionId, seq}
```

- Object keys are random (`m/{matterId}/o/{uuidv7}`), never derived from titles or filenames (no metadata leak).
- A signed PUT, if used, grants write to one staging key only and expires quickly; the value is a configuration parameter to be set during PoC, not an SLA. Alternatively the API streams the upload, which avoids signed URLs at the cost of origin bandwidth (hosting-dependent, ADR-001).
- Commit is idempotent: replay returns the same version; commit after membership revocation is denied and the staged object is left for reconciliation.
- Reconciliation job (boundary trigger or scheduled): PENDING past `expires_at` → delete object if present, mark ABANDONED; bucket objects without DB rows older than a grace period → delete; COMMITTED rows whose object HEAD fails → mark `MISSING`, set version `availability = UNAVAILABLE`, emit `document.content_unavailable`, alert operators. The UI shows "content unavailable" and never a false version label (FR-015).
- Committed content is never deleted by the application. Disposition awaits the retention policy (TB-06).

## 4. Revocation-safe content retrieval (AC-147, NFR-001)

`GET /api/v1/document-versions/{id}/content` checks, in one read snapshot, active workspace + matter membership and version-in-matter, then **streams** bytes through an authorized server path with:

- `Cache-Control: private, no-store`, `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox`;
- support for `Range` to keep memory bounded (Workers memory is 128 MB per isolate; Go origin streams with `io.Copy`);
- no redirect to a bearer URL. Presigned GET URLs remain valid after revocation until expiry, which would violate "deny all current access including cached URLs"; they are therefore not used for user downloads. If PoC shows proxying is infeasible under the chosen hosting, this becomes a PO trade-off (residual window) rather than a silent change.

The bucket is private (no public bucket, no `r2.dev` exposure). Inaccessible or nonexistent versions both return the uniform 404 problem.

## 5. Hosting variants

| Variant | Upload path | Download path | Notes |
|---|---|---|---|
| Go origin + R2 via S3 API | API stream or signed staging PUT | Go streams from R2 | R2 egress free per pricing doc; origin bandwidth depends on host |
| Worker gateway with R2 binding | Worker streams to R2 after asking Go API to authorize | Worker asks Go API to authorize each request, then streams | Requires authenticated service-to-service call; 6 simultaneous connection limit irrelevant at this scale |
| Local development | Filesystem adapter behind `ObjectStore` port | same | Not production |

## 6. Tests

| ID | Scenario | AC |
|---|---|---|
| DL-01 | Upload v3 leaves v2 current; promote with expected v2 → v3 current; references to v2 intact | AC-115 |
| DL-02 | Promote with stale expected version → 412; no change | AC-115 |
| DL-03 | Promotion impact: CURRENT vs FIXED criteria | AC-128 |
| DL-04 | Commit with mismatched sha256 → rejected; staged object reconciled | FR-015 |
| DL-05 | Membership revoked after a download started earlier: new request denied; no presigned URL ever issued | AC-147 |
| DL-06 | Missing object → version shows UNAVAILABLE, not deleted, not current-labelled falsely | FR-015 |
| DL-07 | Cross-workspace guessed version ID → uniform 404 + security audit | AC-135 |
