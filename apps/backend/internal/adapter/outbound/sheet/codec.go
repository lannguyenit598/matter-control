// Package sheet reads and writes CSV and XLSX using only the standard library. It is deliberately
// small: one worksheet of text cells. Reading never evaluates formulas, runs macros or fetches
// URLs; writing stores every value as a literal string, so cell text can never become a formula.
package sheet

import (
	"archive/zip"
	"bytes"
	"encoding/csv"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"path"
	"strconv"
	"strings"
	"unicode"

	"github.com/example/userapi/internal/core/port"
)

const (
	maxRows        = 5000
	maxCols        = 50
	maxZipEntries  = 200
	maxUnzipped    = 50 << 20 // per part, declared size
	maxUnzippedAll = 100 << 20
	maxCellRunes   = 4000
)

// Codec implements port.SheetCodec.
type Codec struct{}

var _ port.SheetCodec = Codec{}

func invalid(format string, args ...any) error {
	return fmt.Errorf("%w: %s", port.ErrSheetInvalid, fmt.Sprintf(format, args...))
}

func (Codec) Decode(format string, r io.Reader, maxBytes int64) (port.Table, error) {
	raw, err := io.ReadAll(io.LimitReader(r, maxBytes+1))
	if err != nil {
		return port.Table{}, fmt.Errorf("read upload: %w", err)
	}
	if int64(len(raw)) > maxBytes {
		return port.Table{}, port.ErrObjectTooLarge
	}
	switch format {
	case "csv":
		return decodeCSV(raw)
	case "xlsx":
		return decodeXLSX(raw)
	}
	return port.Table{}, invalid("unsupported format %q (use csv or xlsx)", format)
}

func checkTable(rows [][]string) error {
	if len(rows) == 0 {
		return invalid("the file is empty")
	}
	if len(rows) > maxRows+1 {
		return invalid("more than %d data rows", maxRows)
	}
	for i, row := range rows {
		if len(row) > maxCols {
			return invalid("row %d has more than %d columns", i+1, maxCols)
		}
		for j, c := range row {
			if len([]rune(c)) > maxCellRunes {
				return invalid("row %d column %d is longer than %d characters", i+1, j+1, maxCellRunes)
			}
			for _, r := range c {
				if r == 0 || (unicode.IsControl(r) && r != '\n' && r != '\r' && r != '\t') {
					return invalid("row %d column %d contains a control character", i+1, j+1)
				}
			}
		}
	}
	return nil
}

func decodeCSV(raw []byte) (port.Table, error) {
	raw = bytes.TrimPrefix(raw, []byte("\xef\xbb\xbf"))
	r := csv.NewReader(bytes.NewReader(raw))
	r.FieldsPerRecord = 0 // every row must have the header's width: no silent padding
	rows, err := r.ReadAll()
	if err != nil {
		return port.Table{}, invalid("%v", err)
	}
	if err := checkTable(rows); err != nil {
		return port.Table{}, err
	}
	return port.Table{Rows: rows}, nil
}

// ---------- XLSX read ----------

type xmlSST struct {
	Items []struct {
		T string `xml:"t"`
		R []struct {
			T string `xml:"t"`
		} `xml:"r"`
	} `xml:"si"`
}

type xmlSheet struct {
	Rows []struct {
		Cells []struct {
			Ref string  `xml:"r,attr"`
			T   string  `xml:"t,attr"`
			F   *string `xml:"f"`
			V   string  `xml:"v"`
			IS  struct {
				T string `xml:"t"`
				R []struct {
					T string `xml:"t"`
				} `xml:"r"`
			} `xml:"is"`
		} `xml:"c"`
	} `xml:"sheetData>row"`
}

type xmlWorkbook struct {
	Sheets []struct {
		Name string `xml:"name,attr"`
		RID  string `xml:"id,attr"`
	} `xml:"sheets>sheet"`
}

type xmlRels struct {
	Rels []struct {
		ID     string `xml:"Id,attr"`
		Target string `xml:"Target,attr"`
	} `xml:"Relationship"`
}

func readPart(files map[string]*zip.File, name string) ([]byte, error) {
	f, ok := files[name]
	if !ok {
		return nil, nil
	}
	rc, err := f.Open()
	if err != nil {
		return nil, invalid("cannot open %s: %v", name, err)
	}
	defer rc.Close()
	b, err := io.ReadAll(io.LimitReader(rc, maxUnzipped+1))
	if err != nil {
		return nil, invalid("cannot read %s: %v", name, err)
	}
	if len(b) > maxUnzipped {
		return nil, invalid("%s is too large", name)
	}
	return b, nil
}

func colIndex(ref string) (int, int, error) {
	i := 0
	col := 0
	for i < len(ref) && ref[i] >= 'A' && ref[i] <= 'Z' {
		col = col*26 + int(ref[i]-'A'+1)
		i++
	}
	row, err := strconv.Atoi(ref[i:])
	if i == 0 || err != nil || row < 1 {
		return 0, 0, invalid("bad cell reference %q", ref)
	}
	return col - 1, row - 1, nil
}

func decodeXLSX(raw []byte) (port.Table, error) {
	zr, err := zip.NewReader(bytes.NewReader(raw), int64(len(raw)))
	if err != nil {
		return port.Table{}, invalid("not a valid .xlsx file")
	}
	if len(zr.File) > maxZipEntries {
		return port.Table{}, invalid("too many parts in the file")
	}
	files := map[string]*zip.File{}
	var total uint64
	for _, f := range zr.File {
		total += f.UncompressedSize64
		if f.UncompressedSize64 > maxUnzipped || total > maxUnzippedAll {
			return port.Table{}, invalid("the file expands to more than the allowed size")
		}
		if strings.Contains(strings.ToLower(f.Name), "vbaproject") {
			return port.Table{}, invalid("macros are not supported; save the file as a macro-free .xlsx")
		}
		files[f.Name] = f
	}
	if ct, _ := readPart(files, "[Content_Types].xml"); bytes.Contains(bytes.ToLower(ct), []byte("macroenabled")) {
		return port.Table{}, invalid("macro-enabled workbooks are not supported")
	}

	var sst []string
	if b, err := readPart(files, "xl/sharedStrings.xml"); err != nil {
		return port.Table{}, err
	} else if b != nil {
		var s xmlSST
		if err := xml.Unmarshal(b, &s); err != nil {
			return port.Table{}, invalid("malformed shared strings")
		}
		for _, it := range s.Items {
			t := it.T
			for _, r := range it.R {
				t += r.T
			}
			sst = append(sst, t)
		}
	}

	sheetPath := "xl/worksheets/sheet1.xml"
	if wb, _ := readPart(files, "xl/workbook.xml"); wb != nil {
		var w xmlWorkbook
		if err := xml.Unmarshal(wb, &w); err != nil || len(w.Sheets) == 0 {
			return port.Table{}, invalid("the workbook has no worksheet")
		}
		if rels, _ := readPart(files, "xl/_rels/workbook.xml.rels"); rels != nil {
			var rs xmlRels
			if err := xml.Unmarshal(rels, &rs); err == nil {
				for _, r := range rs.Rels {
					if r.ID == w.Sheets[0].RID {
						sheetPath = path.Clean("xl/" + strings.TrimPrefix(r.Target, "/xl/"))
					}
				}
			}
		}
	}
	sb, err := readPart(files, sheetPath)
	if err != nil {
		return port.Table{}, err
	}
	if sb == nil {
		return port.Table{}, invalid("the worksheet is missing")
	}
	var sh xmlSheet
	if err := xml.Unmarshal(sb, &sh); err != nil {
		return port.Table{}, invalid("malformed worksheet")
	}

	grid := map[int]map[int]string{}
	maxRow, maxCol := -1, -1
	for _, row := range sh.Rows {
		for _, c := range row.Cells {
			col, r, err := colIndex(c.Ref)
			if err != nil {
				return port.Table{}, err
			}
			if r >= maxRows+1 || col >= maxCols {
				return port.Table{}, invalid("cell %s is outside the supported range", c.Ref)
			}
			if c.F != nil {
				// A formula is never evaluated and its cached result is never trusted.
				return port.Table{}, invalid("cell %s contains a formula; formulas are not imported (paste the values instead)", c.Ref)
			}
			var val string
			switch c.T {
			case "s":
				idx, err := strconv.Atoi(strings.TrimSpace(c.V))
				if err != nil || idx < 0 || idx >= len(sst) {
					return port.Table{}, invalid("cell %s refers to a missing shared string", c.Ref)
				}
				val = sst[idx]
			case "inlineStr":
				val = c.IS.T
				for _, r := range c.IS.R {
					val += r.T
				}
			case "e":
				return port.Table{}, invalid("cell %s contains a spreadsheet error value", c.Ref)
			default: // str, n, b, d: the stored text; never reinterpreted
				val = c.V
			}
			if grid[r] == nil {
				grid[r] = map[int]string{}
			}
			grid[r][col] = val
			if r > maxRow {
				maxRow = r
			}
			if col > maxCol {
				maxCol = col
			}
		}
	}
	if maxRow < 0 {
		return port.Table{}, invalid("the file is empty")
	}
	rows := make([][]string, maxRow+1)
	for r := range rows {
		rows[r] = make([]string, maxCol+1)
		for c, v := range grid[r] {
			rows[r][c] = v
		}
	}
	if err := checkTable(rows); err != nil {
		return port.Table{}, err
	}
	return port.Table{Rows: rows}, nil
}

// ---------- write ----------

// neutralise stops a spreadsheet application treating exported text as a formula.
func neutralise(s string) string {
	if s != "" && strings.ContainsRune("=+-@\t\r", rune(s[0])) {
		return "'" + s
	}
	return s
}

func (Codec) EncodeCSV(rows [][]string) ([]byte, error) {
	var buf bytes.Buffer
	buf.WriteString("\xef\xbb\xbf") // BOM so Excel reads UTF-8
	w := csv.NewWriter(&buf)
	for _, row := range rows {
		out := make([]string, len(row))
		for i, c := range row {
			out[i] = neutralise(c)
		}
		if err := w.Write(out); err != nil {
			return nil, err
		}
	}
	w.Flush()
	return buf.Bytes(), w.Error()
}

func colName(i int) string {
	s := ""
	for i++; i > 0; i = (i - 1) / 26 {
		s = string(rune('A'+(i-1)%26)) + s
	}
	return s
}

func xmlText(s string) string {
	var b bytes.Buffer
	_ = xml.EscapeText(&b, []byte(s)) // skip: writing to a bytes.Buffer cannot fail
	return b.String()
}

func (Codec) EncodeXLSX(sheet string, rows [][]string) ([]byte, error) {
	if sheet == "" || len(sheet) > 31 || strings.ContainsAny(sheet, `[]:*?/\`) {
		return nil, errors.New("sheet: invalid worksheet name")
	}
	var data bytes.Buffer
	data.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>`)
	for r, row := range rows {
		fmt.Fprintf(&data, `<row r="%d">`, r+1)
		for c, v := range row {
			// t="inlineStr": a literal string cell. Never a formula, whatever the text starts with.
			fmt.Fprintf(&data, `<c r="%s%d" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>`, colName(c), r+1, xmlText(v))
		}
		data.WriteString(`</row>`)
	}
	data.WriteString(`</sheetData></worksheet>`)

	parts := []struct{ name, body string }{
		{"[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`},
		{"_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`},
		{"xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="` + xmlText(sheet) + `" sheetId="1" r:id="rId1"/></sheets></workbook>`},
		{"xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`},
		{"xl/worksheets/sheet1.xml", data.String()},
	}
	var out bytes.Buffer
	zw := zip.NewWriter(&out)
	for _, p := range parts {
		w, err := zw.Create(p.name)
		if err != nil {
			return nil, err
		}
		if _, err := w.Write([]byte(p.body)); err != nil {
			return nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}
