// Package matter holds the MatterControl product domain: typed identities, the
// Requirement aggregate, access facts, history/receipt values, and the key-age rule.
//
// These types are separate product facts. They are never aliases of the legacy
// userapi User/Task domain, and the package has no JSON or database tags: adapters
// map persistence representations at their boundary.
package matter

import (
	"strconv"
	"time"

	"leonx.me/matter-control/internal/core/domain"
)

// ActorID identifies a product user (users.id, backed by an issuer+subject identity).
// It is a trusted calling identity supplied by the boundary, never client-editable data.
type ActorID string

// MatterID identifies a matter.
type MatterID string

// WorkspaceID identifies a workspace.
type WorkspaceID string

// RequirementID identifies a Requirement row; it shares the value of its graph node id.
type RequirementID string

// NodeID identifies a work-graph node.
type NodeID string

// WorkstreamID identifies a workstream within a matter.
type WorkstreamID string

// IdempotencyKey is a UUIDv7 issued per user intent; its timestamp feeds the key-age rule.
type IdempotencyKey string

// RequestHash is the trusted hex-encoded SHA-256 fingerprint of a command.
type RequestHash string

func (id ActorID) String() string       { return string(id) }
func (id MatterID) String() string      { return string(id) }
func (id WorkspaceID) String() string   { return string(id) }
func (id RequirementID) String() string { return string(id) }
func (id NodeID) String() string        { return string(id) }
func (id WorkstreamID) String() string  { return string(id) }
func (k IdempotencyKey) String() string { return string(k) }
func (h RequestHash) String() string    { return string(h) }

// NewActorID validates and returns an ActorID.
func NewActorID(s string) (ActorID, error) { return newUUID[ActorID](s, "actorId") }

// NewMatterID validates and returns a MatterID.
func NewMatterID(s string) (MatterID, error) { return newUUID[MatterID](s, "matterId") }

// NewWorkspaceID validates and returns a WorkspaceID.
func NewWorkspaceID(s string) (WorkspaceID, error) {
	return newUUID[WorkspaceID](s, "workspaceId")
}

// NewRequirementID validates and returns a RequirementID.
func NewRequirementID(s string) (RequirementID, error) {
	return newUUID[RequirementID](s, "id")
}

// NewNodeID validates and returns a NodeID.
func NewNodeID(s string) (NodeID, error) { return newUUID[NodeID](s, "nodeId") }

// NewWorkstreamID validates and returns a WorkstreamID.
func NewWorkstreamID(s string) (WorkstreamID, error) {
	return newUUID[WorkstreamID](s, "workstreamId")
}

// uuidValid reports whether s is a canonical lowercase UUID string.
func uuidValid(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i := 0; i < len(s); i++ {
		c := s[i]
		switch i {
		case 8, 13, 18, 23:
			if c != '-' {
				return false
			}
		default:
			if (c < '0' || c > '9') && (c < 'a' || c > 'f') {
				return false
			}
		}
	}
	return true
}

// newUUID builds an typed UUID identity or collects a field error under field.
func newUUID[T ~string](s, field string) (T, error) {
	if !uuidValid(s) {
		var zero T
		v := &domain.ValidationError{}
		v.Add(field, "must be a canonical UUID")
		return zero, v
	}
	return T(s), nil
}

// NewIdempotencyKey validates that the key is a UUIDv7: the per-intent timestamp that
// the key-age rule reads is only meaningful for version 7.
func NewIdempotencyKey(s string) (IdempotencyKey, error) {
	v := &domain.ValidationError{}
	if !uuidValid(s) || s[14] != '7' || !uuidVariantOK(s[19]) {
		v.Add("idempotencyKey", "must be a UUIDv7")
		return "", v
	}
	return IdempotencyKey(s), nil
}

// V7Time returns the millisecond timestamp embedded in the UUIDv7 key.
func (k IdempotencyKey) V7Time() time.Time {
	s := string(k)
	// Parse with bitSize 32 so both halves stay in ranges that widen into int64 safely.
	hi, _ := strconv.ParseUint(s[0:8], 16, 32)
	mid, _ := strconv.ParseUint(s[9:13], 16, 32)
	return time.UnixMilli(int64(hi)<<16 | int64(mid)).UTC()
}

func uuidVariantOK(c byte) bool { return c == '8' || c == '9' || c == 'a' || c == 'b' }

// NewRequestHash validates a lowercase 64-character hex SHA-256 fingerprint.
func NewRequestHash(s string) (RequestHash, error) {
	if len(s) != 64 {
		v := &domain.ValidationError{}
		v.Add("requestHash", "must be 64 hexadecimal characters")
		return "", v
	}
	for i := 0; i < len(s); i++ {
		c := s[i]
		if (c < '0' || c > '9') && (c < 'a' || c > 'f') {
			v := &domain.ValidationError{}
			v.Add("requestHash", "must be 64 hexadecimal characters")
			return "", v
		}
	}
	return RequestHash(s), nil
}
