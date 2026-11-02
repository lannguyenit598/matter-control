package productapi

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io"
	"time"

	"leonx.me/matter-control/internal/core/port"
)

type searchCursors struct {
	aead cipher.AEAD
	key  []byte
	now  func() time.Time
}
type cursorPayload struct {
	Version     int    `json:"v"`
	Binding     string `json:"b"`
	Fingerprint string `json:"f"`
	Kind        string `json:"k"`
	ID          string `json:"i"`
	Issued      int64  `json:"t"`
	Expires     int64  `json:"e"`
}

// NewSearchCursors leaves only this capability unavailable when its dedicated key is absent.
func NewSearchCursors(encoded string, now func() time.Time) port.SearchCursors {
	key, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil || len(key) != 32 {
		return nil
	}
	h := hmac.New(sha256.New, key)
	_, _ = h.Write([]byte("mc-search-cursor-aes-v1"))
	derived := h.Sum(nil)
	block, err := aes.NewCipher(derived)
	if err != nil {
		return nil
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil
	}
	return &searchCursors{aead: aead, key: derived, now: now}
}
func (c *searchCursors) binding(b port.SearchBinding) string {
	raw, _ := json.Marshal(b)
	h := hmac.New(sha256.New, c.key)
	_, _ = h.Write(raw)
	return base64.RawURLEncoding.EncodeToString(h.Sum(nil))
}
func (c *searchCursors) Seal(b port.SearchBinding, a port.SearchAnchor) (string, error) {
	now := c.now().Unix()
	raw, err := json.Marshal(cursorPayload{1, c.binding(b), a.Fingerprint, a.Kind, a.ID, now, now + 300})
	if err != nil {
		return "", err
	}
	nonce := make([]byte, c.aead.NonceSize())
	if _, err = rand.Read(nonce); err != nil {
		return "", err
	}
	sealed := c.aead.Seal(nonce, nonce, raw, []byte("mc-search-v1"))
	return base64.RawURLEncoding.EncodeToString(sealed), nil
}
func (c *searchCursors) Open(token string, b port.SearchBinding) (port.SearchAnchor, error) {
	fail := port.ErrSearchStale
	if len(token) > 2048 {
		return port.SearchAnchor{}, fail
	}
	raw, err := base64.RawURLEncoding.DecodeString(token)
	n := c.aead.NonceSize()
	if err != nil || len(raw) < n+c.aead.Overhead() {
		return port.SearchAnchor{}, fail
	}
	plaintext, err := c.aead.Open(nil, raw[:n], raw[n:], []byte("mc-search-v1"))
	if err != nil {
		return port.SearchAnchor{}, fail
	}
	var p cursorPayload
	decoder := json.NewDecoder(bytes.NewReader(plaintext))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&p) != nil || decoder.Decode(new(any)) != io.EOF {
		return port.SearchAnchor{}, fail
	}
	now := c.now().Unix()
	if p.Version != 1 || !hmac.Equal([]byte(p.Binding), []byte(c.binding(b))) || p.Issued > now || p.Expires <= now || p.Expires-p.Issued != 300 || p.ID == "" || p.Fingerprint == "" {
		return port.SearchAnchor{}, fail
	}
	return port.SearchAnchor{Fingerprint: p.Fingerprint, Kind: p.Kind, ID: p.ID}, nil
}
