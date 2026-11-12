package service

import (
	"errors"
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

func TestParseEml(t *testing.T) {
	sentAt := time.Date(2026, 11, 10, 9, 30, 0, 0, time.UTC)
	sentAt2 := time.Date(2026, 11, 10, 10, 0, 0, 0, time.UTC)
	cases := []struct {
		name     string
		raw      string
		want     parsedMail
		wantCode string
	}{
		{
			name: "plain text message",
			raw: "From: Alice Nguyen <alice@example.com>\r\n" +
				"To: bob@example.com, Carol <carol@example.com>\r\n" +
				"Subject: CP list update\r\n" +
				"Date: Tue, 10 Nov 2026 09:30:00 +0000\r\n" +
				"Content-Type: text/plain; charset=utf-8\r\n" +
				"\r\nThe signed SPA arrived.\r\nSecond line.\r\n",
			want: parsedMail{
				Sender: "alice@example.com", Recipients: []string{"bob@example.com", "carol@example.com"},
				Subject: "CP list update", SentAt: &sentAt, Excerpt: "The signed SPA arrived. Second line.",
			},
		},
		{
			name: "multipart with quoted-printable plain part",
			raw: "From: sender@example.com\r\nTo: rcpt@example.com\r\n" +
				"Subject: Supplement request\r\nDate: Tue, 10 Nov 2026 10:00:00 +0000\r\n" +
				"MIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"XY\"\r\n" +
				"\r\n--XY\r\nContent-Type: text/plain; charset=utf-8\r\n" +
				"Content-Transfer-Encoding: quoted-printable\r\n" +
				"\r\nPlease suppl=79 the notarized copy.\r\n--XY--\r\n",
			want: parsedMail{
				Sender: "sender@example.com", Recipients: []string{"rcpt@example.com"},
				Subject: "Supplement request", SentAt: &sentAt2, Excerpt: "Please supply the notarized copy.",
			},
		},
		{
			name: "encoded-word subject is decoded and collapsed",
			raw: "From: a@b.co\r\nTo: c@d.co\r\n" +
				"Subject: =?UTF-8?q?B=E1=BB=81n_khai_b=E1=BB=95_s=c6=A1n?=\r\n" +
				"\r\nbody\r\n",
			want: parsedMail{
				Sender: "a@b.co", Recipients: []string{"c@d.co"},
				Subject: "Bền khai bổ sơn", Excerpt: "body",
			},
		},
		{
			name: "html only body yields no excerpt",
			raw: "From: a@b.co\r\nTo: c@d.co\r\nSubject: hi\r\n" +
				"Content-Type: text/html; charset=utf-8\r\n\r\n<b>hello</b>\r\n",
			want: parsedMail{
				Sender: "a@b.co", Recipients: []string{"c@d.co"}, Subject: "hi", Excerpt: "",
			},
		},
		{
			name:     "missing From is rejected",
			raw:      "To: x@y.co\r\nSubject: no from\r\n\r\nbody\r\n",
			wantCode: "invalid-eml",
		},
		{
			name: "duplicate address across To and Cc is deduped",
			raw: "From: a@b.co\r\nTo: x@y.co, X@Y.co\r\nCc: X@y.co, d@e.co\r\n" +
				"Subject: dup\r\n\r\nbody\r\n",
			want: parsedMail{
				Sender: "a@b.co", Recipients: []string{"x@y.co", "d@e.co"},
				Subject: "dup", Excerpt: "body",
			},
		},
		{
			name:     "not an RFC 5322 message at all",
			raw:      "this is not a message",
			wantCode: "invalid-eml",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := parseEml([]byte(tc.raw))
			if tc.wantCode != "" {
				var re *matter.RejectedError
				if !errors.As(err, &re) || re.Code != tc.wantCode {
					t.Fatalf("want rejected %s, got %v", tc.wantCode, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Sender != tc.want.Sender || got.Subject != tc.want.Subject || got.Excerpt != tc.want.Excerpt {
				t.Fatalf("envelope mismatch:\n got %+v\nwant %+v", got, tc.want)
			}
			if len(got.Recipients) != len(tc.want.Recipients) {
				t.Fatalf("recipients %v, want %v", got.Recipients, tc.want.Recipients)
			}
			for i := range got.Recipients {
				if got.Recipients[i] != tc.want.Recipients[i] {
					t.Fatalf("recipients %v, want %v", got.Recipients, tc.want.Recipients)
				}
			}
			if (got.SentAt == nil) != (tc.want.SentAt == nil) {
				t.Fatalf("sentAt %v, want %v", got.SentAt, tc.want.SentAt)
			}
			if got.SentAt != nil && !got.SentAt.Equal(*tc.want.SentAt) {
				t.Fatalf("sentAt %v, want %v", got.SentAt, tc.want.SentAt)
			}
		})
	}
}

func TestParseEmlMissingOrInvalidDate(t *testing.T) {
	for _, header := range []string{"", "Date: not-a-date\r\n"} {
		got, err := parseEml([]byte("From: synthetic@example.invalid\r\n" + header + "\r\nBody\r\n"))
		if err != nil || got.SentAt != nil {
			t.Fatalf("expected accepted mail without sent date: %+v %v", got, err)
		}
	}
}

func TestParseEmlCaps(t *testing.T) {
	// A subject far beyond the stored cap is truncated, not rejected.
	got, err := parseEml([]byte("From: a@b.co\r\nTo: c@d.co\r\nSubject: " + strings.Repeat("x", 5000) + "\r\n\r\nbody\r\n"))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len([]rune(got.Subject)) != mailSubjectMaxRunes {
		t.Fatalf("subject capped at %d, got %d", mailSubjectMaxRunes, len([]rune(got.Subject)))
	}
}
