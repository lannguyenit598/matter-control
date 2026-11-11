package productapi

// MC-ZCODE-NOTIF-MAILPITCH-20261110 HTTP surface: derived cross-matter notifications (list +
// seen watermark) and matter email capture (.eml upload → document + version + envelope row).

import (
	"net/http"
	"strings"
	"time"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// ---------- notifications ----------

type notificationBody struct {
	ID          string  `json:"id"`
	Kind        string  `json:"kind"`
	MatterID    *string `json:"matterId"`
	MatterTitle *string `json:"matterTitle"`
	ItemID      *string `json:"itemId"`
	Title       string  `json:"title"`
	DueAt       *string `json:"dueAt"`
	CreatedAt   string  `json:"createdAt"`
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func notificationDTO(n matter.Notification) notificationBody {
	var mid, iid *string
	if n.MatterID != nil {
		s := n.MatterID.String()
		mid = &s
	}
	if n.ItemID != "" {
		s := n.ItemID
		iid = &s
	}
	return notificationBody{
		ID: n.ID, Kind: string(n.Kind), MatterID: mid, MatterTitle: strPtr(n.MatterTitle),
		ItemID: iid, Title: n.Title, DueAt: tsPtr(n.DueAt), CreatedAt: ts(n.CreatedAt),
	}
}

type notificationsBody struct {
	Items  []notificationBody `json:"items"`
	Page   pageMeta           `json:"page"`
	SeenAt *string            `json:"seenAt"`
	AsOf   string             `json:"asOf"`
}

// listNotifications derives the caller's notifications at the read instant; nothing here is
// stored, so the read is as fresh as the views it projects.
func (s *server) listNotifications(c *echo.Context) error {
	page, err := s.Notifications.ListNotifications(c.Request().Context(), port.ListNotificationsQuery{ActorID: actorOf(c)})
	if err != nil {
		return err
	}
	items := make([]notificationBody, 0, len(page.Items))
	for _, n := range page.Items {
		items = append(items, notificationDTO(n))
	}
	total := len(items)
	_, err = respond(c, http.StatusOK, notificationsBody{
		Items: items, Page: pageMeta{Limit: total, MaxLimit: maxPageLimit, Total: &total},
		SeenAt: tsPtr(page.SeenAt), AsOf: ts(page.AsOf),
	}, false)
	return err
}

// markNotificationsSeen advances the caller's unread watermark. It is not receipted: it records
// no domain fact and is idempotent by construction.
func (s *server) markNotificationsSeen(c *echo.Context) error {
	if _, err := readJSON(c, &struct{}{}); err != nil {
		return err
	}
	at, err := s.Notifications.MarkNotificationsSeen(c.Request().Context(), port.MarkNotificationsSeenCmd{
		ActorID: actorOf(c), At: time.Now().UTC(),
	})
	if err != nil {
		return err
	}
	_, err = respond(c, http.StatusOK, map[string]string{"seenAt": ts(at)}, false)
	return err
}

// ---------- mail capture ----------

type mailBody struct {
	ID         string   `json:"id"`
	DocumentID string   `json:"documentId"`
	VersionID  string   `json:"versionId"`
	Direction  string   `json:"direction"`
	Sender     string   `json:"sender"`
	Recipients []string `json:"recipients"`
	Subject    string   `json:"subject"`
	Excerpt    string   `json:"excerpt"`
	SentAt     *string  `json:"sentAt"`
	CreatedAt  string   `json:"createdAt"`
}

func mailDTO(m matter.MailMessage) mailBody {
	return mailBody{
		ID: m.ID.String(), DocumentID: m.DocumentID.String(), VersionID: m.VersionID.String(),
		Direction: string(m.Direction), Sender: m.Sender, Recipients: m.Recipients,
		Subject: m.Subject, Excerpt: m.Excerpt, SentAt: tsPtr(m.SentAt), CreatedAt: ts(m.CreatedAt),
	}
}

type mailCreatedBody struct {
	DocumentID string `json:"documentId"`
	VersionID  string `json:"versionId"`
	MailID     string `json:"mailId"`
}

// mailIntake takes the raw .eml bytes as the request body (the house upload pattern): the file
// name travels in X-Filename, the direction in the query. The body limit is the configured
// upload limit, not the JSON limit.
func (s *server) mailIntake(c *echo.Context) error {
	if err := requireNoIfMatch(c); err != nil {
		return err
	}
	key, err := idempotencyKey(c)
	if err != nil {
		return err
	}
	filename := strings.TrimSpace(c.Request().Header.Get("X-Filename"))
	if filename == "" {
		filename = "message.eml"
	}
	res, err := s.Mail.MailIntake(c.Request().Context(), port.MailIntakeCmd{
		ActorID: actorOf(c), MatterID: c.Param("id"), IdempotencyKey: key,
		RequestHash: s.fp(c, []byte(filename+"|"+c.Request().Header.Get("Content-Type")+"|"+c.QueryParam("direction"))),
		Filename:    filename, Direction: c.QueryParam("direction"),
		Body: c.Request().Body, MaxBytes: s.MaxUploadBytes,
	})
	if err != nil {
		return err
	}
	markReplay(c, res.Replayed)
	c.Response().Header().Set("Location", apiPrefix+"/matters/"+c.Param("id")+"/mail/"+res.MailID)
	_, err = respond(c, http.StatusCreated, mailCreatedBody{
		DocumentID: res.DocumentID, VersionID: res.VersionID, MailID: res.MailID,
	}, false)
	return err
}

func (s *server) listMail(c *echo.Context) error {
	rows, err := s.Mail.ListMail(c.Request().Context(), port.MailListQuery{ActorID: actorOf(c), MatterID: c.Param("id")})
	if err != nil {
		return err
	}
	items := make([]mailBody, 0, len(rows))
	for _, m := range rows {
		items = append(items, mailDTO(m))
	}
	total := len(items)
	_, err = respond(c, http.StatusOK, page[mailBody]{Items: items, Page: pageMeta{Limit: total, MaxLimit: maxPageLimit, Total: &total}}, false)
	return err
}
