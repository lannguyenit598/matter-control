package service

import (
	"errors"
	"strings"
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// readLimited bounds every upload read: anything larger is a rejection, never a truncation.
func TestReadLimited(t *testing.T) {
	raw, err := readLimited(strings.NewReader("hello"), 10)
	if err != nil || string(raw) != "hello" {
		t.Fatalf("under cap: %q %v", raw, err)
	}
	_, err = readLimited(strings.NewReader("0123456789abcdef"), 10)
	var re *matter.RejectedError
	if !errors.As(err, &re) || re.Code != "too-large" {
		t.Fatalf("over cap: want rejected too-large, got %v", err)
	}
	raw, err = readLimited(strings.NewReader("x"), 0)
	if err != nil || len(raw) != 1 {
		t.Fatalf("non-positive limit uses the default cap: %q %v", raw, err)
	}
}

// mailDocumentName derives the document name: subject first, sender as fallback, always within
// the display limit the documents table enforces.
func TestMailDocumentName(t *testing.T) {
	name, err := mailDocumentName(parsedMail{Subject: strings.Repeat("x", 500), Sender: "a@b.co"})
	if err != nil {
		t.Fatalf("long subject: %v", err)
	}
	if l := len([]rune(name)); l > 300 {
		t.Fatalf("name capped at 300, got %d", l)
	}
	name, err = mailDocumentName(parsedMail{Sender: "a@b.co"})
	if err != nil || name != "Email: a@b.co" {
		t.Fatalf("empty subject falls back to sender: %q %v", name, err)
	}
}
