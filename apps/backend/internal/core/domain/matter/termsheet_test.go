package matter

import (
	"strings"
	"testing"
	"time"
)

// validTermLine returns a term line that passes Validate; tests mutate one field at a time.
func validTermLine() TermLine {
	now := time.Date(2026, 11, 5, 9, 0, 0, 0, time.UTC)
	return TermLine{
		ID:                TermLineID("01900000-0000-7000-8000-000000000001"),
		MatterID:          MatterID("01900000-0000-7000-8000-000000000002"),
		DocumentVersionID: "01900000-0000-7000-8000-000000000003",
		Field:             TermParty,
		ValueText:         "Công ty TNHH ABC",
		RowKey:            "row-1",
		SourceHash:        strings.Repeat("a", 64),
		ImportedBy:        ActorID("01900000-0000-7000-8000-000000000004"),
		CreatedAt:         now,
		UpdatedAt:         now,
		Revision:          1,
	}
}

func TestTermLineValidate(t *testing.T) {
	t.Parallel()
	date := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	tests := []struct {
		name    string
		mutate  func(*TermLine)
		wantErr string // "" = valid; otherwise a field name expected in the error
	}{
		{name: "valid text field", mutate: func(*TermLine) {}},
		{
			name: "valid date field",
			mutate: func(l *TermLine) {
				l.Field, l.ValueText, l.ValueDate = TermEffectiveDate, "", &date
			},
		},
		{
			name:    "date field without a date",
			mutate:  func(l *TermLine) { l.Field, l.ValueText, l.ValueDate = TermRenewalDate, "", nil },
			wantErr: "valueDate",
		},
		{
			name:    "date field carrying text",
			mutate:  func(l *TermLine) { l.Field, l.ValueText, l.ValueDate = TermEffectiveDate, "2026", &date },
			wantErr: "valueText",
		},
		{
			name:    "text field carrying a date",
			mutate:  func(l *TermLine) { l.ValueDate = &date },
			wantErr: "valueDate",
		},
		{
			name:    "blank text value",
			mutate:  func(l *TermLine) { l.ValueText = "   " },
			wantErr: "valueText",
		},
		{
			name:    "value text over the cap",
			mutate:  func(l *TermLine) { l.ValueText = strings.Repeat("x", 501) },
			wantErr: "valueText",
		},
		{
			name:    "unknown field string",
			mutate:  func(l *TermLine) { l.Field = TermField("CLAUSE") },
			wantErr: "field",
		},
		{
			name:    "bad document version uuid",
			mutate:  func(l *TermLine) { l.DocumentVersionID = "not-a-uuid" },
			wantErr: "documentVersionId",
		},
		{
			name:    "bad source hash",
			mutate:  func(l *TermLine) { l.SourceHash = "abc" },
			wantErr: "sourceHash",
		},
		{
			name:    "empty row key",
			mutate:  func(l *TermLine) { l.RowKey = "" },
			wantErr: "rowKey",
		},
		{
			name: "valid promotion pair",
			mutate: func(l *TermLine) {
				l.PromotedRef = "01900000-0000-7000-8000-000000000005"
				l.PromotedKind = TermPromotesRequirement
			},
		},
		{
			name: "promotion kind without ref",
			mutate: func(l *TermLine) {
				l.PromotedKind = TermPromotesRequirement
			},
			wantErr: "promotion",
		},
		{
			name: "promotion ref without kind",
			mutate: func(l *TermLine) {
				l.PromotedRef = "01900000-0000-7000-8000-000000000005"
			},
			wantErr: "promotion",
		},
		{
			name: "unknown promotion kind",
			mutate: func(l *TermLine) {
				l.PromotedRef = "01900000-0000-7000-8000-000000000005"
				l.PromotedKind = TermPromotionKind("milestone2")
			},
			wantErr: "promotedKind",
		},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			l := validTermLine()
			tt.mutate(&l)
			err := l.Validate()
			if tt.wantErr == "" {
				if err != nil {
					t.Fatalf("Validate() = %v, want nil", err)
				}
				return
			}
			if err == nil {
				t.Fatalf("Validate() = nil, want error mentioning %s", tt.wantErr)
			}
			if !strings.Contains(err.Error(), tt.wantErr) {
				t.Fatalf("Validate() = %v, want error mentioning %s", err, tt.wantErr)
			}
		})
	}
}

func TestPromotionTargetOfIsTotal(t *testing.T) {
	t.Parallel()
	all := []TermField{TermParty, TermEffectiveDate, TermRenewalDate, TermNoticePeriod,
		TermValueAmount, TermValueCurrency, TermGoverningLaw, TermNote}
	for _, f := range all {
		k := PromotionTargetOf(f)
		switch k {
		case TermPromotesContextRecord, TermPromotesMilestone, TermPromotesAction, TermPromotesRequirement:
		default:
			t.Fatalf("PromotionTargetOf(%s) = %q, want a known promotion kind", f, k)
		}
	}
	// The fixed mapping itself (design §2.2).
	if got := PromotionTargetOf(TermParty); got != TermPromotesContextRecord {
		t.Fatalf("PARTY target = %q", got)
	}
	if got := PromotionTargetOf(TermEffectiveDate); got != TermPromotesMilestone {
		t.Fatalf("EFFECTIVE_DATE target = %q", got)
	}
	if got := PromotionTargetOf(TermNoticePeriod); got != TermPromotesAction {
		t.Fatalf("NOTICE_PERIOD target = %q", got)
	}
	if got := PromotionTargetOf(TermGoverningLaw); got != TermPromotesRequirement {
		t.Fatalf("GOVERNING_LAW target = %q", got)
	}
}

func TestParseTermField(t *testing.T) {
	t.Parallel()
	if _, err := ParseTermField("PARTY"); err != nil {
		t.Fatalf("PARTY rejected: %v", err)
	}
	if _, err := ParseTermField("clause"); err == nil {
		t.Fatal("unknown field accepted")
	}
}

// A PARTY promotes to an Entity context record titled "PARTY: <value>", whose title is capped at
// 200 bytes, so the import must refuse a value that could never be promoted.
func TestValidateTermValuePartyFitsPromotionTitle(t *testing.T) {
	t.Parallel()
	limit := 200 - len("PARTY: ")
	if err := ValidateTermValue(TermParty, strings.Repeat("a", limit), nil); err != nil {
		t.Fatalf("a party at the title limit must pass: %v", err)
	}
	if err := ValidateTermValue(TermParty, strings.Repeat("a", limit+1), nil); err == nil {
		t.Fatal("a party longer than the promotion title allows must be refused")
	}
	if err := ValidateTermValue(TermNote, strings.Repeat("a", 500), nil); err != nil {
		t.Fatalf("other text fields keep the 500-byte limit: %v", err)
	}
}
