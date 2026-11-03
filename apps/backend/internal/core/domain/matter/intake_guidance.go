package matter

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"
)

// ---------- Intake (RLF-06) ----------

// IntakeID identifies one intake record.
type IntakeID string

func NewIntakeID(s string) (IntakeID, error) { return newUUID[IntakeID](s, "intakeId") }
func (id IntakeID) String() string           { return string(id) }

// IntakeStatus is the minimal honest lifecycle: recorded → converted or declined. Conversion is
// never execution and never verification; it only creates real work through the ordinary
// commands.
type IntakeStatus string

const (
	IntakePending   IntakeStatus = "PENDING"
	IntakeConverted IntakeStatus = "CONVERTED"
	IntakeDeclined  IntakeStatus = "DECLINED"
)

// IntakeRecord keeps the original request as it arrived: attributable requester text, the
// recorded received instant and the exact matter document versions it names. The requester is
// free text, never a membership; attachments are recorded references only.
type IntakeRecord struct {
	ID           IntakeID
	MatterID     MatterID
	Title        string
	RequestText  string
	Requester    string
	ReceivedAt   time.Time
	Attachments  []string // matter document version ids, validated at record time
	Status       IntakeStatus
	TriageReason string
	TriagedBy    *ActorID
	TriagedAt    *time.Time
	ItemID       *NodeID
	RecordedBy   ActorID
	CreatedAt    time.Time
	Revision     int64
}

// ---------- Guidance (RLF-07) ----------

// GuidanceDocumentID identifies one guidance document.
type GuidanceDocumentID string

func NewGuidanceDocumentID(s string) (GuidanceDocumentID, error) {
	return newUUID[GuidanceDocumentID](s, "guidanceDocumentId")
}
func (id GuidanceDocumentID) String() string { return string(id) }

// GuidanceRevisionID identifies one guidance revision.
type GuidanceRevisionID string

func NewGuidanceRevisionID(s string) (GuidanceRevisionID, error) {
	return newUUID[GuidanceRevisionID](s, "guidanceRevisionId")
}
func (id GuidanceRevisionID) String() string { return string(id) }

// GuidanceSourceRef is one attributable reference behind guidance text: either an exact matter
// document version (validated at write time) or a user-entered outside reference. No page or
// quote anchors are stored or invented.
type GuidanceSourceRef struct {
	VersionID string `json:"versionId,omitempty"`
	Reference string `json:"reference,omitempty"`
	Note      string `json:"note,omitempty"`
}

func (r GuidanceSourceRef) validate() error {
	if r.VersionID == "" && r.Reference == "" {
		return fmt.Errorf("guidance source reference: a version or a reference is required")
	}
	if len(r.Reference) > 500 || len(r.Note) > 500 {
		return fmt.Errorf("guidance source reference: too long")
	}
	return nil
}

// GuidanceDocument is one Matter-scoped guidance text.
type GuidanceDocument struct {
	ID        GuidanceDocumentID
	MatterID  MatterID
	Title     string
	CreatedBy ActorID
	CreatedAt time.Time
	Revision  int64
}

// GuidanceRevision is one version of the text. DRAFT rows may keep being appended by
// OWNER/EDITOR; a PUBLISHED row is immutable and is what any member reads.
type GuidanceRevision struct {
	ID          GuidanceRevisionID
	DocumentID  GuidanceDocumentID
	MatterID    MatterID
	No          int64
	Body        string
	SourceRefs  []GuidanceSourceRef
	Status      string // DRAFT | PUBLISHED
	CreatedBy   ActorID
	CreatedAt   time.Time
	PublishedBy *ActorID
	PublishedAt *time.Time
}

// ParseGuidanceSourceRefs decodes stored refs strictly.
func ParseGuidanceSourceRefs(b []byte) ([]GuidanceSourceRef, error) {
	var refs []GuidanceSourceRef
	if len(b) == 0 {
		return nil, nil
	}
	dec := json.NewDecoder(bytes.NewReader(b))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&refs); err != nil {
		return nil, fmt.Errorf("guidance source refs: %w", err)
	}
	for i, r := range refs {
		if err := r.validate(); err != nil {
			return nil, fmt.Errorf("guidance source refs[%d]: %w", i, err)
		}
	}
	return refs, nil
}

// ValidateGuidanceSourceRefs validates refs before storing them.
func ValidateGuidanceSourceRefs(refs []GuidanceSourceRef) error {
	if len(refs) > 20 {
		return fmt.Errorf("guidance source refs: at most 20 references")
	}
	for i, r := range refs {
		if err := r.validate(); err != nil {
			return fmt.Errorf("guidance source refs[%d]: %w", i, err)
		}
	}
	return nil
}
