package matter

import (
	"fmt"
	"strings"
	"time"
)

// MailMessageID identifies one captured email envelope row.
type MailMessageID string

// String returns the id in its string form.
func (id MailMessageID) String() string { return string(id) }

// MailDirection says whether a captured email came into the matter or was recorded as sent out.
// The direction is what the recorder asserted about the upload, not an observation the product
// derives.
type MailDirection string

const (
	MailInbound  MailDirection = "INBOUND"
	MailOutbound MailDirection = "OUTBOUND"
)

// ParseMailDirection validates the wire value; an empty value defaults to inbound because a
// captured email is overwhelmingly a received one.
func ParseMailDirection(raw string) (MailDirection, error) {
	switch strings.ToUpper(strings.TrimSpace(raw)) {
	case "", string(MailInbound):
		return MailInbound, nil
	case string(MailOutbound):
		return MailOutbound, nil
	}
	return "", fmt.Errorf("invalid mail direction %q", raw)
}

// MailMessage is the parsed envelope of one captured .eml, linked to the immutable document
// version that holds the raw bytes. The envelope is a capture aid, never legal state: it changes
// no requirement, criterion or filing, and the raw version always stays re-parsable.
type MailMessage struct {
	ID         MailMessageID
	MatterID   MatterID
	DocumentID DocumentID
	VersionID  VersionID
	Direction  MailDirection
	Sender     string
	Recipients []string
	Subject    string
	Excerpt    string
	SentAt     *time.Time
	RecordedBy ActorID
	CreatedAt  time.Time
}

// MailCreated is the immutable outcome of one mail intake: the envelope row plus the document
// and version the upload created. Replaying the same idempotency key returns it verbatim.
type MailCreated struct {
	MailID     string
	DocumentID string
	VersionID  string
	Seq        int64
	Replayed   bool
}
