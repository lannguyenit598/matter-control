package service

// MC-ZCODE-NOTIF-MAILPITCH-20261110: minimal RFC 5322 parsing for email capture. Standard
// library only (the sheet codec sets the house bar); .msg (OLE compound) is out of scope and is
// rejected upstream by extension. Every cap is hard: a capture must never make the server do
// unbounded work on an attacker-shaped message.

import (
	"bytes"
	"fmt"
	"io"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net/mail"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"
)

const (
	// mailExcerptMaxRunes bounds the stored plain-text excerpt (single line, display-sized).
	mailExcerptMaxRunes = 2000
	// mailSubjectMaxRunes bounds the parsed subject as stored.
	mailSubjectMaxRunes = 300
	// mailRecipientsMax caps the parsed recipient list.
	mailRecipientsMax = 50
	// mailMimeDepthMax bounds multipart walking; deeper nesting yields no excerpt.
	mailMimeDepthMax = 3
	// mailBodyReadCap bounds the bytes inspected for the excerpt, independent of upload size.
	mailBodyReadCap = 256 << 10
)

// parsedMail is the envelope extracted from one .eml upload.
type parsedMail struct {
	Sender     string
	Recipients []string
	Subject    string
	SentAt     *time.Time
	Excerpt    string
}

// parseEml parses one RFC 5322 message: envelope headers plus a plain-text excerpt of the first
// text/plain part. A message without a parsable From is rejected — the envelope is the point of
// the capture, and the database check requires a sender.
func parseEml(raw []byte) (parsedMail, error) {
	msg, err := mail.ReadMessage(bytes.NewReader(raw))
	if err != nil {
		return parsedMail{}, rejected("invalid-eml", "the upload is not a parseable RFC 5322 message")
	}
	from, err := msg.Header.AddressList("From")
	if err != nil || len(from) == 0 {
		return parsedMail{}, rejected("invalid-eml", "the message has no parsable From address")
	}
	sender := from[0].Address
	if l := utf8.RuneCountInString(sender); l < 3 || l > 320 {
		return parsedMail{}, rejected("invalid-eml", "the From address is outside the accepted length")
	}
	recipients := dedupeAddresses(append(mailAddresses(msg.Header, "To"), mailAddresses(msg.Header, "Cc")...))
	if len(recipients) > mailRecipientsMax {
		recipients = recipients[:mailRecipientsMax]
	}
	subject := collapseSpace([]rune(decodeHeaderWord(msg.Header.Get("Subject"))))
	subject = trimSpaceRunes(subject)
	if len(subject) > mailSubjectMaxRunes {
		subject = subject[:mailSubjectMaxRunes]
	}
	var sentAt *time.Time
	if d, derr := msg.Header.Date(); derr == nil {
		t := d.UTC()
		sentAt = &t
	}
	excerpt, _ := firstPlainText(msg.Header.Get("Content-Type"), msg.Body, 0)
	return parsedMail{
		Sender: sender, Recipients: recipients, Subject: string(subject),
		SentAt: sentAt, Excerpt: excerpt,
	}, nil
}

// decodeHeaderWord decodes RFC 2047 encoded-words in an unstructured header (net/mail decodes
// addresses but leaves subjects raw). Unknown charsets keep the raw value rather than failing.
func decodeHeaderWord(s string) string {
	d := &mime.WordDecoder{CharsetReader: func(charset string, input io.Reader) (io.Reader, error) {
		if strings.EqualFold(charset, "utf-8") || strings.EqualFold(charset, "us-ascii") {
			return input, nil
		}
		return nil, fmt.Errorf("unsupported charset %q", charset)
	}}
	if out, err := d.DecodeHeader(s); err == nil {
		return out
	}
	return s
}

// trimSpaceRunes drops leading and trailing whitespace the collapse may have left behind.
func trimSpaceRunes(in []rune) []rune {
	first, last := 0, len(in)-1
	for first <= last && unicode.IsSpace(in[first]) {
		first++
	}
	for last >= first && unicode.IsSpace(in[last]) {
		last--
	}
	return in[first : last+1]
}

// dedupeAddresses drops repeats across To and Cc (the same address routinely sits in both),
// case-insensitively, keeping the first occurrence in wire order.
func dedupeAddresses(in []string) []string {
	seen := make(map[string]bool, len(in))
	out := make([]string, 0, len(in))
	for _, a := range in {
		key := strings.ToLower(a)
		if seen[key] {
			continue
		}
		seen[key] = true
		out = append(out, a)
	}
	return out
}

// mailAddresses lists one address header tolerantly: an unparsable header contributes nothing
// rather than failing the capture.
func mailAddresses(h mail.Header, field string) []string {
	list, err := h.AddressList(field)
	if err != nil {
		return nil
	}
	out := make([]string, 0, len(list))
	for _, a := range list {
		if a.Address != "" {
			out = append(out, a.Address)
		}
	}
	return out
}

// firstPlainText walks the MIME tree to the first text/plain part and returns its collapsed
// single-line excerpt. HTML is never read: the excerpt is text, not rendered content.
func firstPlainText(contentType string, body io.Reader, depth int) (string, error) {
	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil {
		// A missing or broken Content-Type defaults to plain text per RFC 5322.
		mediaType = "text/plain"
	}
	switch {
	case mediaType == "text/plain":
		return readExcerpt(body), nil
	case strings.HasPrefix(mediaType, "multipart/") && depth < mailMimeDepthMax:
		mr := multipart.NewReader(body, params["boundary"])
		for {
			part, perr := mr.NextPart()
			if perr != nil {
				return "", nil
			}
			partType := part.Header.Get("Content-Type")
			pt, _, perr := mime.ParseMediaType(partType)
			if perr != nil {
				pt = "text/plain"
			}
			if pt == "text/plain" {
				return readExcerpt(transferDecoded(part)), nil
			}
			if strings.HasPrefix(pt, "multipart/") {
				if inner, ierr := firstPlainText(partType, part, depth+1); ierr == nil && inner != "" {
					return inner, nil
				}
			}
		}
	}
	return "", nil
}

// transferDecoded wraps quoted-printable parts; base64 parts are skipped (binary payloads are
// not excerpt material and decoding them here would be wasted work).
func transferDecoded(part *multipart.Part) io.Reader {
	if strings.EqualFold(strings.TrimSpace(part.Header.Get("Content-Transfer-Encoding")), "quoted-printable") {
		return quotedprintable.NewReader(part)
	}
	return part
}

// readExcerpt reads a bounded slice of the body and collapses it to one display line.
func readExcerpt(r io.Reader) string {
	raw, err := io.ReadAll(io.LimitReader(r, mailBodyReadCap))
	if err != nil {
		return ""
	}
	runes := []rune(strings.ToValidUTF8(string(raw), string(utf8.RuneError)))
	runes = collapseSpace(runes)
	runes = trimSpaceRunes(runes)
	if len(runes) > mailExcerptMaxRunes {
		runes = runes[:mailExcerptMaxRunes]
	}
	return string(runes)
}

// collapseSpace maps control characters and whitespace runs to single spaces.
func collapseSpace(in []rune) []rune {
	out := make([]rune, 0, len(in))
	lastSpace := false
	for _, r := range in {
		if r == 0 || (r < 0x20 && r != '\t') || r == 0x7f {
			r = ' '
		}
		if unicode.IsSpace(r) {
			if lastSpace {
				continue
			}
			r = ' '
			lastSpace = true
		} else {
			lastSpace = false
		}
		out = append(out, r)
	}
	return out
}
