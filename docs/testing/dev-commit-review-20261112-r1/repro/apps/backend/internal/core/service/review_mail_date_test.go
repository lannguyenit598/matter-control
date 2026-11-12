package service

import "testing"

func TestReviewMailWithoutDateIsAccepted(t *testing.T) {
	parsed, err := parseEml([]byte("From: synthetic@example.invalid\r\nTo: recipient@example.invalid\r\nSubject: Synthetic mail without Date\r\n\r\nBody\r\n"))
	if err != nil || parsed.SentAt != nil {
		t.Fatalf("missing Date is accepted with nil sentAt: parsed=%+v err=%v", parsed, err)
	}
}
