package service_test

// Review answers must stay outside the work model: Brief replay keeps working with review events in
// the history, and the events themselves never carry answer text.

import (
	"context"
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

func TestBriefStillReconstructsAfterReviewEvents(t *testing.T) {
	s := newReviewSUT(t)
	ctx := context.Background()
	if _, err := s.msvc.CreateRequirement(ctx, port.CreateRequirementCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), IdempotencyKey: newKey(), RequestHash: w1AnyHash,
		Title: "Board approval", Outcome: "Approved",
	}); err != nil {
		t.Fatalf("seed requirement: %v", err)
	}
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	if _, err := s.svc.RecordAnswer(ctx, answerCmd(g, v1, g.Questions[0].ID, "")); err != nil {
		t.Fatalf("answer: %v", err)
	}
	var last time.Time
	for _, r := range s.store.AllRecords() {
		if r.RecordedAt.After(last) {
			last = r.RecordedAt
		}
	}
	brief := service.NewDataOpsService(s.store, w6RecordIDs{}, sheet.Codec{}, discardLogger())
	res, err := brief.Brief(ctx, port.BriefQuery{ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), T1: fixtureBase, T2: last})
	if err != nil {
		t.Fatalf("a Brief must still reconstruct with review events in the history: %v", err)
	}
	if len(res.Outstanding) == 0 {
		t.Fatalf("the requirement must still be reported: %+v", res)
	}
}

func TestReviewEventsCarryNoAnswerText(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	cmd := answerCmd(g, v1, g.Questions[0].ID, "")
	cmd.Text, cmd.QuoteRef = "SECRET-ANSWER-TEXT", "SECRET-QUOTE"
	if _, err := s.svc.RecordAnswer(context.Background(), cmd); err != nil {
		t.Fatalf("answer: %v", err)
	}
	seen := map[string]bool{}
	for _, r := range s.store.AllRecords() {
		if r.TargetKind != "REVIEW_GRID" {
			continue
		}
		seen[r.Type] = true
		if body := string(r.Before) + string(r.After); strings.Contains(body, "SECRET") {
			t.Fatalf("%s leaks answer content: %s", r.Type, body)
		}
	}
	for _, want := range []string{"review.grid_created", "review.version_added", "review.question_added", "review.answer_recorded"} {
		if !seen[want] {
			t.Fatalf("missing event %s (saw %v)", want, seen)
		}
	}
}
