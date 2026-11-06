package matter

import (
	"fmt"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
)

// ---------- Contract term lines (MC-ZCODE-TERMSHEET-01, design 2026-11-05 §2.2) ----------

// TermSheetImported records an accepted import without contractual content.
type TermSheetImported struct {
	VersionID VersionID
	Created   int
	Replaced  int
	Unchanged int
}

// TermLineID identifies one contract term line.
type TermLineID string

func NewTermLineID(s string) (TermLineID, error) { return newUUID[TermLineID](s, "termLineId") }
func (id TermLineID) String() string             { return string(id) }

// TermField is the closed v1 vocabulary of contract term facts (design Decision #7). The enum IS
// the explicit semantics — there is deliberately no free-form metadata carrier (Principle 4), so
// a term line can never degrade into a generic key/value blob.
type TermField string

const (
	TermParty         TermField = "PARTY"
	TermEffectiveDate TermField = "EFFECTIVE_DATE"
	TermRenewalDate   TermField = "RENEWAL_DATE"
	TermNoticePeriod  TermField = "NOTICE_PERIOD"
	TermValueAmount   TermField = "VALUE_AMOUNT"
	TermValueCurrency TermField = "VALUE_CURRENCY"
	TermGoverningLaw  TermField = "GOVERNING_LAW"
	TermNote          TermField = "NOTE"
)

func (f TermField) String() string         { return string(f) }
func (k TermPromotionKind) String() string { return string(k) }

// ParseTermField validates s against the closed vocabulary; an unknown field is a caller error
// and is never silently stored (design edge case: the import rejects the row and names it).
func ParseTermField(s string) (TermField, error) {
	switch TermField(s) {
	case TermParty, TermEffectiveDate, TermRenewalDate, TermNoticePeriod,
		TermValueAmount, TermValueCurrency, TermGoverningLaw, TermNote:
		return TermField(s), nil
	}
	return "", fmt.Errorf("term field %q is outside the closed vocabulary", s)
}

// TermPromotionKind names the record kind a promotion is allowed to create.
type TermPromotionKind string

const (
	TermPromotesContextRecord TermPromotionKind = "context_record"
	TermPromotesMilestone     TermPromotionKind = "milestone"
	TermPromotesAction        TermPromotionKind = "action"
	TermPromotesRequirement   TermPromotionKind = "requirement"
)

// PromotionTargetOf is the fixed field→promotion mapping (design §2.2): a party becomes an
// Entity context record, contract dates become milestones, the notice period becomes an Action
// draft, and the remaining facts become Requirement drafts. The mapping is total on the enum —
// every field has exactly one target — so promotion never invents semantics per line.
func PromotionTargetOf(f TermField) TermPromotionKind {
	switch f {
	case TermParty:
		return TermPromotesContextRecord
	case TermEffectiveDate, TermRenewalDate:
		return TermPromotesMilestone
	case TermNoticePeriod:
		return TermPromotesAction
	default: // VALUE_AMOUNT, VALUE_CURRENCY, GOVERNING_LAW, NOTE
		return TermPromotesRequirement
	}
}

// TermLine is ONE typed fact about ONE contract document version: what the contract says, pinned
// to where it was read. A term line is a fact, never an obligation — Completion ≠ Verified
// applies unchanged, and promoting a line creates a DRAFT record that completes and verifies
// nothing.
type TermLine struct {
	ID       TermLineID
	MatterID MatterID
	// DocumentVersionID pins the source version (evidence domain identity, W3).
	DocumentVersionID VersionID
	Field             TermField
	// Exactly one value carrier is populated per field (Validate enforces which): text for
	// parties/amounts/law/notes, the timestamp for contract dates. Amounts keep their sheet
	// digits as text — parsing money into numbers is a presentation decision, not a domain one.
	ValueText string
	ValueDate *time.Time
	// RowKey identifies the line inside its sheet (several PARTY lines are legitimate); together
	// with the document version and field it forms the import identity.
	RowKey string
	// SourceHash is the SHA-256 of the imported row content: re-importing the same bytes is a
	// no-op, changed bytes replace that version's lines (design §2.2 idempotency).
	SourceHash string
	// Promotion link: empty until a promotion created the draft record this fact operationalizes.
	PromotedRef  string
	PromotedKind TermPromotionKind
	PromotedAt   *time.Time
	ImportedBy   ActorID
	CreatedAt    time.Time
	UpdatedAt    time.Time
	Revision     int64
}

// termFieldWantsText reports whether the field carries its value in ValueText (the rest carry a
// contract date in ValueDate).
func termFieldWantsText(f TermField) bool {
	return f != TermEffectiveDate && f != TermRenewalDate
}

// ValidateTermValue enforces the per-field value carrier for one unparsed row (no identity yet):
// text fields carry ValueText and no date, date fields the reverse. The import path uses this
// before a line exists; Validate reuses it for the stored shape.
func ValidateTermValue(f TermField, valueText string, valueDate *time.Time) error {
	v := &domain.ValidationError{}
	if termFieldWantsText(f) {
		if valueDate != nil {
			v.Add("valueDate", "must be empty for a text field")
		}
		if t := strings.TrimSpace(valueText); t == "" || len(t) > 500 {
			v.Add("valueText", "must be 1..500 characters for a text field")
		}
	} else {
		if valueText != "" {
			v.Add("valueText", "must be empty for a date field")
		}
		if valueDate == nil {
			v.Add("valueDate", "must be set for a date field")
		}
	}
	if v.HasErrors() {
		return v
	}
	return nil
}

// Validate enforces the per-field value carrier, the source pin and the promotion pair so an
// invalid line can never reach a store. Adapters decode strings and must call ParseTermField at
// their boundary; this check re-runs it so a hostile decode cannot smuggle a field through.
func (l TermLine) Validate() error {
	v := &domain.ValidationError{}
	if _, err := NewTermLineID(l.ID.String()); err != nil {
		v.Add("id", "must be a canonical UUID")
	}
	if _, err := NewMatterID(l.MatterID.String()); err != nil {
		v.Add("matterId", "must be a canonical UUID")
	}
	if _, err := newUUID[VersionID](l.DocumentVersionID.String(), "documentVersionId"); err != nil {
		v.Add("documentVersionId", "must be a canonical UUID")
	}
	if _, err := ParseTermField(l.Field.String()); err != nil {
		v.Add("field", err.Error())
	}
	if l.RowKey == "" || len(l.RowKey) > 100 {
		v.Add("rowKey", "must be 1..100 characters")
	}
	if _, err := NewRequestHash(l.SourceHash); err != nil {
		v.Add("sourceHash", "must be 64 hexadecimal characters")
	}
	if err := ValidateTermValue(l.Field, l.ValueText, l.ValueDate); err != nil {
		v.Add("value", err.Error())
	}
	if (l.PromotedRef == "") != (l.PromotedKind == "") {
		v.Add("promotion", "ref and kind must be set together")
	}
	if l.PromotedRef != "" {
		if _, err := newUUID[string](l.PromotedRef, "promotedRef"); err != nil {
			v.Add("promotedRef", "must be a canonical UUID")
		}
		switch l.PromotedKind {
		case TermPromotesContextRecord, TermPromotesMilestone, TermPromotesAction, TermPromotesRequirement:
		default:
			v.Add("promotedKind", "is outside the closed vocabulary")
		}
	}
	if v.HasErrors() {
		return v
	}
	return nil
}
