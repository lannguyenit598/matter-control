package productapi

// W6 data-operations handlers (contract §2.7): scoped bulk edit, CSV/XLSX import,
// export and the delta brief.

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"github.com/example/userapi/internal/core/port"
)

type bulkRowRequest struct {
	RowKey           string  `json:"rowKey"`
	IdempotencyKey   string  `json:"idempotencyKey"`
	ItemID           string  `json:"itemId"`
	ExpectedRevision int64   `json:"expectedRevision"`
	Title            *string `json:"title"`
	Description      *string `json:"description"`
	InternalOwner    *string `json:"internalOwner"`
	Due              *string `json:"due"`
}

type bulkPreviewRequest struct {
	Rows []bulkRowRequest `json:"rows"`
}

type bulkCommitRequest struct {
	AttemptKey string           `json:"attemptKey"`
	Rows       []bulkRowRequest `json:"rows"`
}

func bulkChangeOf(b bulkRowRequest) port.BulkRowChange {
	return port.BulkRowChange{
		RowKey: b.RowKey, IdempotencyKey: b.IdempotencyKey, ItemID: b.ItemID,
		ExpectedRevision: b.ExpectedRevision, Title: b.Title,
		Description: b.Description, InternalOwner: b.InternalOwner, Due: b.Due,
	}
}

func (s *server) bulkPreview(c *echo.Context) error {
	var req bulkPreviewRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if len(req.Rows) == 0 {
		return errBadRequest
	}
	rows := make([]port.BulkRowChange, 0, len(req.Rows))
	for _, b := range req.Rows {
		rows = append(rows, bulkChangeOf(b))
	}
	res, err := s.DataOps.BulkPreview(c.Request().Context(), port.BulkPreviewCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), Rows: rows,
	})
	if err != nil {
		return err
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, bulkPreviewDTO(res), false)
	return err
}

func (s *server) bulkCommit(c *echo.Context) error {
	var req bulkCommitRequest
	if _, err := readJSON(c, &req); err != nil {
		return err
	}
	if req.AttemptKey == "" || len(req.Rows) == 0 {
		return errBadRequest
	}
	rows := make([]port.BulkRowChange, 0, len(req.Rows))
	for _, b := range req.Rows {
		rows = append(rows, bulkChangeOf(b))
	}
	res, err := s.DataOps.BulkCommit(c.Request().Context(), port.BulkCommitCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), AttemptKey: req.AttemptKey, Rows: rows,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, bulkResultsDTO(res), false)
	return err
}

func (s *server) importPreview(c *echo.Context) error {
	sourceName, format, content, err := s.readSheetUpload(c)
	if err != nil {
		return err
	}
	res, err := s.DataOps.ImportPreview(c.Request().Context(), port.ImportPreviewCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), SourceName: sourceName, Format: format, Content: content,
	})
	if err != nil {
		return err
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, importPreviewDTO(res), false)
	return err
}

func (s *server) importCommit(c *echo.Context) error {
	sourceName, format, content, err := s.readSheetUpload(c)
	if err != nil {
		return err
	}
	var req struct {
		RunKey  string            `json:"runKey"`
		RowKeys map[string]string `json:"rowKeys"`
	}
	if _, err := readJSONField(c, "plan", &req); err != nil {
		return err
	}
	res, err := s.DataOps.ImportCommit(c.Request().Context(), port.ImportCommitCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), RunKey: req.RunKey,
		SourceName: sourceName, Format: format, Content: content, RowKeys: req.RowKeys,
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, importResultsDTO(res), false)
	return err
}

// readSheetUpload reads the multipart upload shared by import preview/commit.
// Fields: file (required), sourceName (optional; defaults to the uploaded filename).
// The plan fields travel in a separate JSON part named "plan".
func (s *server) readSheetUpload(c *echo.Context) (string, string, []byte, error) {
	if c.Request().MultipartForm == nil {
		// Bound what the multipart parser may read: the JSON body limit does not apply here.
		c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, s.MaxUploadBytes+(64<<10))
		if err := c.Request().ParseMultipartForm(s.MaxUploadBytes); err != nil {
			var tooBig *http.MaxBytesError
			if errors.As(err, &tooBig) {
				return "", "", nil, port.ErrObjectTooLarge
			}
			return "", "", nil, errBadRequest
		}
	}
	mr := c.Request().MultipartForm
	fh, ok := mr.File["file"]
	if !ok || len(fh) != 1 {
		return "", "", nil, errBadRequest
	}
	f, err := fh[0].Open()
	if err != nil {
		return "", "", nil, errBadRequest
	}
	defer f.Close()
	content := make([]byte, 0, fh[0].Size)
	buf := make([]byte, 64*1024)
	for {
		n, rerr := f.Read(buf)
		content = append(content, buf[:n]...)
		if rerr != nil {
			break
		}
	}
	if int64(len(content)) > s.MaxUploadBytes {
		return "", "", nil, port.ErrObjectTooLarge
	}
	sourceName := strings.TrimSpace(c.FormValue("sourceName"))
	if sourceName == "" {
		sourceName = fh[0].Filename
	}
	format := strings.ToLower(strings.TrimSpace(c.FormValue("format")))
	if format == "" {
		switch {
		case strings.HasSuffix(strings.ToLower(fh[0].Filename), ".xlsx"):
			format = "xlsx"
		case strings.HasSuffix(strings.ToLower(fh[0].Filename), ".csv"):
			format = "csv"
		}
	}
	return sourceName, format, content, nil
}

// readJSONField reads one JSON part from the current multipart form into dst.
func readJSONField(c *echo.Context, field string, dst any) ([]byte, error) {
	if c.Request().MultipartForm == nil {
		return nil, errBadRequest
	}
	vals, ok := c.Request().MultipartForm.Value[field]
	if !ok || len(vals) != 1 {
		return nil, errBadRequest
	}
	raw := []byte(vals[0])
	if err := decodeStrict(raw, dst); err != nil {
		return nil, err
	}
	return raw, nil
}

func (s *server) exportMatter(c *echo.Context) error {
	format := strings.ToLower(c.QueryParam("format"))
	if format == "" {
		format = "xlsx"
	}
	res, err := s.DataOps.Export(c.Request().Context(), port.ExportQuery{
		ActorID: actorOf(c), MatterID: c.Param("id"), Format: format,
	})
	if err != nil {
		return err
	}
	provenance(c, res.AsOf, res.Revision)
	var body []byte
	var mt string
	var ext string
	if format == "csv" {
		body, err = s.sheetCodec().EncodeCSV(res.Rows)
		mt, ext = "text/csv; charset=utf-8", "csv"
	} else {
		body, err = s.sheetCodec().EncodeXLSX("matter", res.Rows)
		mt, ext = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"
	}
	if err != nil {
		return err
	}
	c.Response().Header().Set("Content-Disposition", `attachment; filename="matter-export.`+ext+`"`)
	return c.Blob(http.StatusOK, mt, body)
}

func (s *server) deltaBrief(c *echo.Context) error {
	t1, err1 := time.Parse(time.RFC3339, c.QueryParam("t1"))
	t2, err2 := time.Parse(time.RFC3339, c.QueryParam("t2"))
	if err1 != nil || err2 != nil {
		return errBadRequest
	}
	res, err := s.DataOps.Brief(c.Request().Context(), port.BriefQuery{
		ActorID: actorOf(c), MatterID: c.Param("id"), T1: t1, T2: t2,
	})
	if err != nil {
		return err
	}
	provenance(c, res.AsOf, 0)
	_, err = respond(c, http.StatusOK, briefDTO(res), false)
	return err
}

// sheetCodec resolves the injected codec at request time (Deps is a value copy).
func (s *server) sheetCodec() port.SheetCodec { return s.DataOpsCodec }
