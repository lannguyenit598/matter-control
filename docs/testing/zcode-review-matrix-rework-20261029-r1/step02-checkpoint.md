# Step02 checkpoint — RMV-F01 explicit answer expectation (backend)

Date: 2026-10-29. Actual ZCode session; same repo/branch/HEAD as step01 (no commit). Tools: Go (go test/go build/gofmt), installed executables via `rtk go` on this workstation.

## Fix

- `port.RecordReviewAnswerCmd.ExpectedAnswerID` is now `*string` (mirrors the existing `ExpectedAssessmentID` presence precedent in evidence): nil = the field was absent or null on the wire; `""` = an explicitly observed empty cell.
- `review_service.go RecordAnswer`: inside the created receipt closure (after the central gate, question lookup, in-grid check and the revision 428/412 checks — so 401/403/404/409 precedence is untouched), a nil expectation returns `port.ErrPreconditionRequired` (428); a stated expectation is compared against the cell's current answer as before (412).
- `review_handlers.go`: `reviewAnswerRequest.ExpectedAnswerID *string`; a wrong JSON type still fails `decodeStrict` → 400 malformed-body. No receipt is stored for a refused command (`createdReceipt` stores only on successful build), so the same key with a stated expectation afterwards succeeds (test asserts this — no receipt effect).
- `docs/api.md`: the answers line now states absent/null → 428.
- Callers updated: `contract_review.go` (`f.answer` passes `&expected`), `review_service_test.go` (`answerCmd`). The contract call that omits the expectation entirely (nil) keeps expecting 428 via the revision check.

## Tests (red→green)

- Red `step02-red.log`: `TestReviewGrid_HTTPAnswerExpectationPresence` failed `status = 201, want 428` — the verifier's finding reproduced on the pinned bytes.
- Green `step02-green.log`: the new HTTP test covers missing→428, null→428, wrong-type→400, no-write (cell still PENDING), refused-key-not-consumed (same key then records 201), and precedence (anonymous 401, VIEWER 403, known nonmember 403, with and without expectation — never 428 pre-authorization).
- Affected packages: productapi + core/service + repotest memory → 310 tests passed, 0 failed (memory/PG shared contract re-run on a fresh PG fixture happens at the step04 final gates). `go build ./...` OK, `gofmt -l` clean.

## Pins (after)

`step02-after-hashes.txt` (7 files). History pagination (F03) deliberately not touched in this step.
