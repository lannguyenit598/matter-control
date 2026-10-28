package port

import (
	"errors"
	"io"
)

// ErrSheetInvalid reports an uploaded spreadsheet that cannot be read safely (malformed, a macro,
// a formula cell, too large). The wrapped message says what and where; nothing is silently coerced.
var ErrSheetInvalid = errors.New("spreadsheet cannot be read")

// Table is a decoded sheet: row 0 is the header row. Rows are never padded or trimmed beyond the
// header width, so a stray cell is visible to validation.
type Table struct {
	Rows [][]string
}

// SheetCodec reads CSV/XLSX uploads and writes CSV/XLSX downloads. Reading never evaluates a
// formula, runs a macro or fetches a URL; writing never lets cell text become a formula.
type SheetCodec interface {
	// Decode reads format "csv" or "xlsx" from r, refusing more than maxBytes.
	Decode(format string, r io.Reader, maxBytes int64) (Table, error)
	// EncodeXLSX writes one worksheet; every cell is a literal string.
	EncodeXLSX(sheet string, rows [][]string) ([]byte, error)
	// EncodeCSV writes rows with formula-leading cells neutralised for spreadsheet applications.
	EncodeCSV(rows [][]string) ([]byte, error)
}
