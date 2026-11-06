package productapi

// MC-ZCODE-TERMSHEET-01 handlers: term lines are typed facts about one contract document
// version. Import uses the shared multipart reader and its own fact parser. Promotion is a
// receipted mutation.

import (
	"bytes"
	"crypto/sha256"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// termLineBody is one term line as the API serves it: the typed fact, its source pin and its
// promotion link. Nullable carriers stay explicitly null on the wire.
type termLineBody struct {
	ID                string  `json:"id"`
	MatterID          string  `json:"matterId"`
	DocumentVersionID string  `json:"documentVersionId"`
	Field             string  `json:"field"`
	ValueText         *string `json:"valueText"`
	ValueDate         *string `json:"valueDate"`
	RowKey            string  `json:"rowKey"`
	SourceHash        string  `json:"sourceHash"`
	PromotedRef       string  `json:"promotedRef,omitempty"`
	PromotedKind      string  `json:"promotedKind,omitempty"`
	UpdatedAt         string  `json:"updatedAt"`
	Revision          int64   `json:"revision"`
}

func termLineBodyOf(l matter.TermLine) termLineBody {
	body := termLineBody{
		ID: l.ID.String(), MatterID: l.MatterID.String(), DocumentVersionID: l.DocumentVersionID.String(),
		Field: l.Field.String(), RowKey: l.RowKey, SourceHash: l.SourceHash,
		PromotedRef: l.PromotedRef, PromotedKind: l.PromotedKind.String(),
		UpdatedAt: l.UpdatedAt.UTC().Format(time.RFC3339), Revision: l.Revision,
	}
	if l.ValueText != "" {
		s := l.ValueText
		body.ValueText = &s
	}
	if l.ValueDate != nil {
		d := l.ValueDate.UTC().Format(time.RFC3339)
		body.ValueDate = &d
	}
	return body
}

func (s *server) listTermLines(c *echo.Context) error {
	view, err := s.TermSheets.ListTermLines(c.Request().Context(), port.ListTermLinesQuery{
		ActorID: actorOf(c), MatterID: c.Param("id"),
	})
	if err != nil {
		return err
	}
	items := make([]termLineBody, 0, len(view.Lines))
	for _, l := range view.Lines {
		items = append(items, termLineBodyOf(l))
	}
	n := len(items)
	_, err = respond(c, http.StatusOK, map[string]any{
		"items": items, "page": pageMeta{Limit: n, MaxLimit: maxPageLimit, Total: &n}, "matterRevision": view.MatterRevision,
	}, false)
	return err
}

func (s *server) importTermSheet(c *echo.Context) error {
	limit := min(s.MaxUploadBytes, port.MaxTermSheetBytes)
	c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, limit+(64<<10))
	_, format, content, err := s.readSheetUpload(c)
	if err != nil {
		return err
	}
	if int64(len(content)) > limit {
		return port.ErrObjectTooLarge
	}
	versionID := strings.TrimSpace(c.FormValue("documentVersionId"))
	var revision int64
	if raw := c.FormValue("expectedRevision"); raw != "" {
		revision, err = strconv.ParseInt(raw, 10, 64)
		if err != nil || revision < 1 {
			return errBadRequest
		}
	}
	// Hash the exact sheet bytes and normalized command, independent of the multipart boundary.
	hash := fingerprint(c.Request().Method, c.Path(), c.Request().URL.Path,
		[]byte(fmt.Sprintf("%d:%s:%s:%x", revision, versionID, format, sha256.Sum256(content))), "")
	res, err := s.TermSheets.ImportTermSheet(c.Request().Context(), port.ImportTermSheetCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), DocumentVersionID: versionID,
		ExpectedRevision: revision, IdempotencyKey: c.Request().Header.Get("Idempotency-Key"), RequestHash: hash,
		Format: format, Sheet: bytes.NewReader(content), MaxBytes: limit,
	})
	if err != nil {
		return err
	}
	rejected := make([]map[string]string, 0, len(res.Rejected))
	for _, row := range res.Rejected {
		rejected = append(rejected, map[string]string{"rowKey": row.RowKey, "code": row.Code, "detail": row.Detail})
	}
	if res.Replayed {
		c.Response().Header().Set("Idempotent-Replayed", "true")
	}
	_, err = respond(c, http.StatusOK, map[string]any{
		"documentVersionId": res.DocumentVersionID, "created": res.Created,
		"replaced": res.Replaced, "unchanged": res.Unchanged, "rejected": rejected, "replayed": res.Replayed,
	}, false)
	return err
}

func (s *server) promoteTermLine(c *echo.Context) error {
	var req struct {
		ExpectedRevision int64 `json:"expectedRevision"`
	}
	// The request fingerprint is the server's own (s.fp), never a client claim.
	raw, err := readJSON(c, &req)
	if err != nil {
		return err
	}
	res, err := s.TermSheets.PromoteTermLine(c.Request().Context(), port.PromoteTermLineCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), TermLineID: c.Param("termLineId"),
		IdempotencyKey: c.Request().Header.Get("Idempotency-Key"), RequestHash: s.fp(c, raw), ExpectedRevision: req.ExpectedRevision,
	})
	if err != nil {
		return err
	}
	if res.Replayed {
		c.Response().Header().Set("Idempotent-Replayed", "true")
	}
	_, err = respond(c, http.StatusOK, map[string]any{
		"termLineId": res.LineID.String(), "targetId": res.TargetID, "targetKind": res.TargetKind, "targetMissing": res.TargetMissing, "replayed": res.Replayed,
	}, false)
	return err
}
