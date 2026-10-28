package matter_test

import (
	"errors"
	"testing"
	"time"

	"github.com/example/userapi/internal/core/domain"
	"github.com/example/userapi/internal/core/domain/matter"
)

const (
	actorUUID  = "00000000-0000-7000-8000-000000000001"
	matterUUID = "00000000-0000-7000-8000-000000000002"
	reqUUID    = "00000000-0000-7000-8000-000000000003"
)

// BE01-T01: typed Requirement and MatterControl access facts are their own types, never
// aliases of the legacy User/Task domain.
func TestTypedIdentitiesAreDistinctFromLegacyUser(t *testing.T) {
	var actor any = matter.ActorID(actorUUID)
	if _, ok := actor.(domain.UserID); ok {
		t.Fatal("matter.ActorID must not be the legacy domain.UserID type")
	}
	var req any = matter.RequirementID(reqUUID)
	if _, ok := req.(domain.UserID); ok {
		t.Fatal("matter.RequirementID must not be the legacy domain.UserID type")
	}
}

// BE01-T01: identity value objects accept canonical UUIDs and reject malformed input.
func TestIdentityParsing(t *testing.T) {
	valid := []struct {
		name string
		call func(string) error
	}{
		{"actor", func(s string) error { _, err := matter.NewActorID(s); return err }},
		{"matter", func(s string) error { _, err := matter.NewMatterID(s); return err }},
		{"requirement", func(s string) error { _, err := matter.NewRequirementID(s); return err }},
		{"workspace", func(s string) error { _, err := matter.NewWorkspaceID(s); return err }},
		{"workstream", func(s string) error { _, err := matter.NewWorkstreamID(s); return err }},
	}
	invalid := []struct {
		name string
		in   string
	}{
		{"uppercase hex", "00000000-0000-7000-8000-00000000000A"},
		{"too short", "00000000-0000-7000-8000-0001"},
		{"empty", ""},
		{"not a uuid", "not-a-uuid"},
		{"wrong group separators", "00000000-0000-7000-8000+00000000000A"},
	}
	for _, v := range valid {
		if err := v.call(actorUUID); err != nil {
			t.Fatalf("%s: canonical uuid rejected: %v", v.name, err)
		}
		for _, bad := range invalid {
			if err := v.call(bad.in); err == nil {
				t.Fatalf("%s: accepted invalid id %q", v.name, bad.in)
			} else {
				var ve *domain.ValidationError
				if !errors.As(err, &ve) {
					t.Fatalf("%s: want ValidationError, got %T %v", v.name, err, err)
				}
			}
		}
	}
}

// BE01-T01: the idempotency key is a UUIDv7 (per-user intent; its timestamp feeds the
// key-age check) and the request hash is a lowercase hex SHA-256 fingerprint.
func TestIdempotencyKeyAndRequestHash(t *testing.T) {
	if _, err := matter.NewIdempotencyKey("0197ce5a-0000-7000-8000-000000000001"); err != nil {
		t.Fatalf("uuidv7 key rejected: %v", err)
	}
	// UUIDv4 (version nibble 4) must be rejected: the key timestamp would be meaningless.
	for _, bad := range []string{
		"00000000-0000-4000-8000-000000000001", // v4
		"00000000-0000-7000-c000-000000000001", // wrong variant
		"",
		"nope",
	} {
		if _, err := matter.NewIdempotencyKey(bad); err == nil {
			t.Fatalf("invalid idempotency key accepted: %q", bad)
		}
	}

	if _, err := matter.NewRequestHash("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"); err != nil {
		t.Fatalf("sha256 hex rejected: %v", err)
	}
	for _, bad := range []string{
		"",
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85",   // 63 chars
		"E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855",  // uppercase
		"z3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  // not hex
		"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8555", // 65 chars
	} {
		if _, err := matter.NewRequestHash(bad); err == nil {
			t.Fatalf("invalid request hash accepted: %q", bad)
		}
	}
}

// BE01-T01: state enumerations accept their approved values and reject others.
func TestStateEnums(t *testing.T) {
	for _, s := range []matter.ExecutionState{
		matter.ExecutionNotStarted, matter.ExecutionInProgress, matter.ExecutionWaiting,
		matter.ExecutionCompleted, matter.ExecutionCancelled,
	} {
		if !s.Valid() {
			t.Fatalf("execution state %q rejected", s)
		}
	}
	if (matter.ExecutionState("PAUSED")).Valid() {
		t.Fatal("unlisted execution state accepted")
	}

	if !matter.DependencyReady.Valid() || !matter.DependencyBlocked.Valid() ||
		matter.DependencyState("WAITING").Valid() {
		t.Fatal("dependency state set wrong")
	}

	for _, s := range []matter.VerificationState{
		matter.VerificationNotRequired, matter.VerificationUnverified,
		matter.VerificationPartiallyVerified, matter.VerificationVerified,
		matter.VerificationDisputed,
	} {
		if !s.Valid() {
			t.Fatalf("verification state %q rejected", s)
		}
	}
	if (matter.VerificationState("DONE")).Valid() {
		t.Fatal("unlisted verification state accepted")
	}
}

// BE01-T01: creation fixes the approved initial states; owner/workstream/due stay unset;
// revision starts at 1 and the proof epoch at 0.
func TestNewRequirementInitialShape(t *testing.T) {
	id, err := matter.NewRequirementID(reqUUID)
	if err != nil {
		t.Fatal(err)
	}
	mID, err := matter.NewMatterID(matterUUID)
	if err != nil {
		t.Fatal(err)
	}
	r, err := matter.NewRequirement(id, mID, "  Sign the SPA  ", "Executed SPA countersigned by both parties")
	if err != nil {
		t.Fatal(err)
	}
	if r.ExecutionState != matter.ExecutionNotStarted {
		t.Fatalf("execution state = %q", r.ExecutionState)
	}
	if r.DependencyState != matter.DependencyReady {
		t.Fatalf("dependency state = %q", r.DependencyState)
	}
	if r.VerificationState != matter.VerificationUnverified {
		t.Fatalf("verification state = %q", r.VerificationState)
	}
	if r.VerificationApplicability != matter.VerificationRequired {
		t.Fatalf("verification applicability = %q", r.VerificationApplicability)
	}
	if r.Revision != 1 {
		t.Fatalf("revision = %d", r.Revision)
	}
	if r.ProofEpoch != 0 {
		t.Fatalf("proof epoch = %d", r.ProofEpoch)
	}
	if r.WorkstreamID != nil || r.OwnerActorID != nil || r.DueAt != nil || r.ApplicabilityReason != nil {
		t.Fatalf("optional refs must stay unset on create: %+v", r)
	}
	if r.Title != "Sign the SPA" {
		t.Fatalf("title not trimmed: %q", r.Title)
	}
}

func TestNewRequirementValidation(t *testing.T) {
	id, _ := matter.NewRequirementID(reqUUID)
	mID, _ := matter.NewMatterID(matterUUID)
	cases := []struct {
		name    string
		id      matter.RequirementID
		matter  matter.MatterID
		title   string
		outcome string
	}{
		{"blank title", id, mID, "   ", "Executed SPA"},
		{"title with NUL", id, mID, "Sig\x00n", "Executed SPA"},
		{"blank outcome", id, mID, "Sign the SPA", "  "},
		{"outcome with NUL", id, mID, "Sign the SPA", "Sig\x00ned"},
		{"invalid requirement id", matter.RequirementID("nope"), mID, "Sign the SPA", "Executed SPA"},
		{"invalid matter id", id, matter.MatterID("nope"), "Sign the SPA", "Executed SPA"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := matter.NewRequirement(tc.id, tc.matter, tc.title, tc.outcome)
			var v *domain.ValidationError
			if !errors.As(err, &v) {
				t.Fatalf("want ValidationError, got %v", err)
			}
		})
	}
}

// BE01-T01: membership value objects expose the approved role/status sets.
func TestAccessFactSets(t *testing.T) {
	if !matter.WorkspaceRoleOwner.Valid() || !matter.WorkspaceRoleMember.Valid() ||
		matter.WorkspaceRole("ADMIN").Valid() {
		t.Fatal("workspace role set wrong")
	}
	for _, r := range []matter.MatterRole{matter.MatterRoleOwner, matter.MatterRoleEditor, matter.MatterRoleViewer} {
		if !r.Valid() {
			t.Fatalf("matter role %q rejected", r)
		}
	}
	if matter.MatterRole("CONTRIBUTOR").Valid() {
		t.Fatal("unlisted matter role accepted")
	}
	if !matter.StatusActive.Valid() || !matter.StatusRevoked.Valid() ||
		matter.MembershipStatus("PENDING").Valid() {
		t.Fatal("membership status set wrong")
	}
}

// BE01-T01: the key-age policy is an explicit injected value (test/boundary input only);
// a zero policy enforces nothing and CheckKeyAge reports why a key failed.
func TestKeyAgePolicy(t *testing.T) {
	key, err := matter.NewIdempotencyKey("0197ce5a-0000-7000-8000-000000000001")
	if err != nil {
		t.Fatal(err)
	}
	now := key.V7Time().Add(time.Second)

	var zero matter.KeyAgePolicy
	if err := zero.Check(key, now); err != nil {
		t.Fatalf("zero policy must not enforce: %v", err)
	}

	p := matter.KeyAgePolicy{Retention: 100 * time.Second, AllowedSkew: time.Second}
	if err := p.Check(key, now); err != nil {
		t.Fatalf("fresh key rejected: %v", err)
	}
	old := key.V7Time().Add(-102 * time.Second)
	if err := p.Check(key, old); !errors.Is(err, matter.ErrKeyExpired) {
		t.Fatalf("expired key: got %v", err)
	}
	future := key.V7Time().Add(-2 * time.Second) // now before the key by more than the skew
	if err := p.Check(key, future); !errors.Is(err, matter.ErrKeyExpired) {
		t.Fatalf("key beyond future skew: got %v", err)
	}
}
