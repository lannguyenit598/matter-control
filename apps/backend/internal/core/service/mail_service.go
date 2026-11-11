package service

// MC-ZCODE-NOTIF-MAILPITCH-20261110: email capture. One uploaded .eml becomes an ordinary
// document plus immutable version (the raw bytes stay authoritative) and one mail envelope row,
// inside the locked matter transaction and one receipt. The envelope never touches legal state:
// no criterion, verification or filing changes because an email was captured.

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"unicode/utf8"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// Mails captures correspondence into a matter.
type Mails struct {
	w       *WorkService
	objects port.ObjectStore
	ids     port.RecordIDGenerator
}

// NewMailService builds the capture service on the shared transaction spine.
func NewMailService(w *WorkService, objects port.ObjectStore, ids port.RecordIDGenerator) *Mails {
	return &Mails{w: w, objects: objects, ids: ids}
}

func mailTxOf(env *workEnv) (port.MailTx, error) {
	tx, ok := env.tx.(port.MailTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support mail capture")
	}
	return tx, nil
}

// MailIntake validates, authorizes, stores the bytes and records document + version + envelope
// under one receipt. Authorization runs before any byte is read or stored (the UploadVersion
// order); a content-addressed orphan after a failed command is harmless.
func (s *Mails) MailIntake(ctx context.Context, cmd port.MailIntakeCmd) (matter.MailCreated, error) {
	actor, key, _, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.MailCreated{}, err
	}
	filename, err := cleanFilename(cmd.Filename)
	if err != nil {
		return matter.MailCreated{}, err
	}
	if !strings.EqualFold(filepath.Ext(filename), ".eml") {
		return matter.MailCreated{}, rejected("invalid-eml-filename", "mail capture accepts only .eml uploads")
	}
	direction, err := matter.ParseMailDirection(cmd.Direction)
	if err != nil {
		return matter.MailCreated{}, rejected("invalid-direction", "direction must be INBOUND or OUTBOUND")
	}
	mid, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.MailCreated{}, err
	}
	// Authorize before reading or storing bytes: an actor who may not write never makes the
	// server parse or persist their message.
	if err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "MAIL_INTAKE", policy.DecideCreateRequirement, func(env *workEnv) error {
		_, err := env.g.LoadGraph(ctx)
		return err
	}); err != nil {
		return matter.MailCreated{}, err
	}
	raw, err := readLimited(cmd.Body, cmd.MaxBytes)
	if err != nil {
		return matter.MailCreated{}, err
	}
	parsed, err := parseEml(raw)
	if err != nil {
		return matter.MailCreated{}, err
	}
	ref, err := s.objects.Put(ctx, mid, bytes.NewReader(raw), cmd.MaxBytes)
	if err != nil {
		return matter.MailCreated{}, fmt.Errorf("store mail content: %w", err)
	}
	// The receipt fingerprint covers the intent and the stored content, like AddVersion.
	bound := sha256.Sum256([]byte(cmd.RequestHash + "|" + ref.SHA256 + "|" + string(direction)))
	reqHash, err := matter.NewRequestHash(hex.EncodeToString(bound[:]))
	if err != nil {
		return matter.MailCreated{}, err
	}
	var out matter.MailCreated
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "MAIL_INTAKE", policy.DecideCreateRequirement, func(env *workEnv) error {
		ev, err := evTx(env)
		if err != nil {
			return err
		}
		mtx, err := mailTxOf(env)
		if err != nil {
			return err
		}
		created, err := s.w.createdReceipt(ctx, env, actor, key, reqHash, func() (matter.CreatedResult, error) {
			mailID := matter.MailMessageID(env.ids.NewRecordID())
			docID := matter.DocumentID(env.ids.NewRecordID())
			name, err := mailDocumentName(parsed)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			d := matter.Document{ID: docID, MatterID: env.header.MatterID, Name: name, Revision: 1}
			if err := ev.InsertDocument(ctx, d); err != nil {
				return matter.CreatedResult{}, err
			}
			v := matter.DocumentVersion{
				ID: matter.VersionID(env.ids.NewRecordID()), MatterID: env.header.MatterID,
				DocumentID: docID, No: 1, Filename: filename, MediaType: "message/rfc822",
				SHA256: ref.SHA256, SizeBytes: ref.Size, UploadedBy: env.actor, UploadedAt: env.tCmd,
			}
			if err := ev.InsertVersion(ctx, v); err != nil {
				return matter.CreatedResult{}, err
			}
			m := matter.MailMessage{
				ID: mailID, MatterID: env.header.MatterID, DocumentID: docID, VersionID: v.ID,
				Direction: direction, Sender: parsed.Sender, Recipients: parsed.Recipients,
				Subject: parsed.Subject, Excerpt: parsed.Excerpt, SentAt: parsed.SentAt,
				RecordedBy: env.actor, CreatedAt: env.tCmd,
			}
			if err := mtx.InsertMailMessage(ctx, m); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "mail.intaken", "MAIL_MESSAGE", mailID.String(), "", nil,
				map[string]any{"document": docID.String(), "version": v.ID.String(), "direction": string(direction), "sender": parsed.Sender}, nil)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			out = matter.MailCreated{MailID: mailID.String(), DocumentID: docID.String(), VersionID: v.ID.String(), Seq: seq}
			return matter.CreatedResult{Kind: "MAIL_MESSAGE", ID: mailID.String(), Seq: seq}, nil
		})
		if err != nil {
			return err
		}
		if created.Replayed {
			// A stored snapshot carries only the mail id; reload the envelope so a replay
			// answers with the same document and version ids as the first run.
			m, lerr := mtx.LoadMailMessage(ctx, env.header.MatterID, matter.MailMessageID(created.ID))
			if lerr != nil {
				return lerr
			}
			out = matter.MailCreated{
				MailID: m.ID.String(), DocumentID: m.DocumentID.String(), VersionID: m.VersionID.String(),
				Seq: created.Seq, Replayed: true,
			}
		}
		return nil
	})
	return out, err
}

// ListMail reads the matter's captured envelopes in the authorized snapshot.
func (s *Mails) ListMail(ctx context.Context, q port.MailListQuery) ([]matter.MailMessage, error) {
	var out []matter.MailMessage
	err := s.w.execute(ctx, q.ActorID, q.MatterID, "LIST_MAIL", policy.DecideReadRequirement, func(env *workEnv) error {
		snap, ok := env.tx.(port.MailSnapshot)
		if !ok {
			return fmt.Errorf("matter transaction does not support mail capture")
		}
		rows, rerr := snap.ListMailMessages(ctx, env.header.MatterID)
		if rerr != nil {
			return rerr
		}
		out = rows
		return nil
	})
	return out, err
}

// readLimited reads an upload with a hard cap; anything larger is a rejection, not a truncation.
func readLimited(r io.Reader, limit int64) ([]byte, error) {
	if limit <= 0 {
		limit = 25 << 20
	}
	raw, err := io.ReadAll(io.LimitReader(r, limit+1))
	if err != nil {
		return nil, fmt.Errorf("read upload: %w", err)
	}
	if int64(len(raw)) > limit {
		return nil, rejected("too-large", "the upload exceeds the accepted size")
	}
	return raw, nil
}

// mailDocumentName derives the document name from the envelope; the subject leads, the sender
// stands in when the subject is empty, and the name never exceeds the display limit.
func mailDocumentName(p parsedMail) (string, error) {
	base := p.Subject
	if strings.TrimSpace(base) == "" {
		base = p.Sender
	}
	name := "Email: " + base
	if l := utf8.RuneCountInString(name); l > 300 {
		name = string([]rune(name)[:300])
	}
	return matter.NewDisplayName(name, "name")
}
