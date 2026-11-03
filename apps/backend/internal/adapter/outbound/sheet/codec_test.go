package sheet_test

import (
	"archive/zip"
	"bytes"
	"errors"
	"strings"
	"testing"

	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/core/port"
)

func zipOf(t *testing.T, parts map[string]string) []byte {
	t.Helper()
	var b bytes.Buffer
	zw := zip.NewWriter(&b)
	for n, body := range parts {
		w, _ := zw.Create(n)
		_, _ = w.Write([]byte(body))
	}
	if err := zw.Close(); err != nil {
		t.Fatal(err)
	}
	return b.Bytes()
}

func TestXLSX_RoundTripKeepsFormulaLookingTextLiteral(t *testing.T) {
	c := sheet.Codec{}
	rows := [][]string{{"key", "title"}, {"R1", "=HYPERLINK(\"http://evil.test\")"}, {"R2", "+1+1"}, {"R3", "-5"}, {"R4", "@SUM(A1)"}, {"R5", "a & <b> \"q\""}, {"R6", ""}}
	b, err := c.EncodeXLSX("Work", rows)
	if err != nil {
		t.Fatal(err)
	}
	got, err := c.Decode("xlsx", bytes.NewReader(b), 1<<20)
	if err != nil {
		t.Fatal(err)
	}
	for i := range rows {
		for j := range rows[i] {
			if got.Rows[i][j] != rows[i][j] {
				t.Fatalf("cell %d,%d: %q != %q", i, j, got.Rows[i][j], rows[i][j])
			}
		}
	}
	// the written cells are literal strings, never formula cells
	zr, _ := zip.NewReader(bytes.NewReader(b), int64(len(b)))
	for _, f := range zr.File {
		rc, _ := f.Open()
		var buf bytes.Buffer
		_, _ = buf.ReadFrom(rc)
		_ = rc.Close()
		if strings.Contains(buf.String(), "<f>") || strings.Contains(buf.String(), "<f ") {
			t.Fatalf("%s must contain no formula element", f.Name)
		}
	}
}

func TestCSV_ExportNeutralisesFormulaStarts(t *testing.T) {
	b, err := sheet.Codec{}.EncodeCSV([][]string{{"=A1", "+x", "-y", "@z", "ok", "\tt"}})
	if err != nil {
		t.Fatal(err)
	}
	s := strings.TrimPrefix(string(b), "\xef\xbb\xbf")
	if strings.TrimSpace(s) != "'=A1,'+x,'-y,'@z,ok,'\tt" {
		t.Fatalf("%q", s)
	}
}

func TestDecode_RefusesWhatItCannotReadSafely(t *testing.T) {
	c := sheet.Codec{}
	formula := zipOf(t, map[string]string{
		"xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>key</t></is></c></row><row r="2"><c r="A2"><f>1+1</f><v>2</v></c></row></sheetData></worksheet>`,
	})
	macro := zipOf(t, map[string]string{"xl/vbaProject.bin": "x", "xl/worksheets/sheet1.xml": `<worksheet/>`})
	macroCT := zipOf(t, map[string]string{"[Content_Types].xml": `<Types><Override ContentType="application/vnd.ms-excel.sheet.macroEnabled.main+xml"/></Types>`, "xl/worksheets/sheet1.xml": `<worksheet/>`})
	errCell := zipOf(t, map[string]string{"xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="e"><v>#REF!</v></c></row></sheetData></worksheet>`})
	for name, tc := range map[string]struct {
		format string
		data   []byte
		want   string
	}{
		"formula cell":   {"xlsx", formula, "A2 contains a formula"},
		"macro part":     {"xlsx", macro, "macros are not supported"},
		"macro type":     {"xlsx", macroCT, "macro-enabled"},
		"error cell":     {"xlsx", errCell, "spreadsheet error"},
		"not a zip":      {"xlsx", []byte("hello"), "not a valid .xlsx"},
		"ragged csv":     {"csv", []byte("a,b\n1\n"), "wrong number of fields"},
		"empty csv":      {"csv", []byte(""), "empty"},
		"control char":   {"csv", []byte("a\n\x01\n"), "control character"},
		"unknown format": {"ods", []byte("x"), "unsupported format"},
	} {
		_, err := c.Decode(tc.format, bytes.NewReader(tc.data), 1<<20)
		if !errors.Is(err, port.ErrSheetInvalid) || !strings.Contains(err.Error(), tc.want) {
			t.Errorf("%s: %v", name, err)
		}
	}
	if _, err := c.Decode("csv", strings.NewReader(strings.Repeat("a,b\n", 100)), 10); !errors.Is(err, port.ErrObjectTooLarge) {
		t.Fatalf("size limit: %v", err)
	}
}

func TestDecode_CSVKeepsFormulaTextAndEmbeddedURLsLiteral(t *testing.T) {
	got, err := sheet.Codec{}.Decode("csv", strings.NewReader("\xef\xbb\xbfkey,title\nR1,=cmd|' /C calc'!A0\nR2,http://example.test/x\n"), 1<<20)
	if err != nil {
		t.Fatal(err)
	}
	if got.Rows[0][0] != "key" || got.Rows[1][1] != "=cmd|' /C calc'!A0" || got.Rows[2][1] != "http://example.test/x" {
		t.Fatalf("%+v", got.Rows)
	}
}
