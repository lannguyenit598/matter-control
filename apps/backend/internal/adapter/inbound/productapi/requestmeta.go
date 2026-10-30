package productapi

import (
	"crypto/rand"
	"encoding/hex"
	"net"
	"net/http"
	"net/netip"
	"strings"

	"github.com/labstack/echo/v5"

	"leonx.me/matter-control/internal/core/port"
)

// requestMeta injects the audit tracing fields (A1) into the request context: the client IP as
// seen at the trust boundary and the request correlation id. Audit only — never a security
// decision; forwarded headers are honored because a wrong audit IP is a tracing miss, not a
// bypass (B3's stricter proxy rule applies to any future rate admission).
func requestMeta(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {
		req := c.Request()
		rid := req.Header.Get("X-Request-Id")
		if !validRequestID(rid) {
			rid = newRequestID()
		}
		meta := port.RequestMeta{ClientIP: clientIPForAudit(req), RequestID: rid}
		c.SetRequest(req.WithContext(port.WithRequestMeta(req.Context(), meta)))
		return next(c)
	}
}

// clientIPForAudit prefers the first X-Forwarded-For hop (the chain the platform declares) and
// falls back to the remote address; an unparseable value records empty, never a guess.
func clientIPForAudit(req *http.Request) string {
	if xf := req.Header.Get("X-Forwarded-For"); xf != "" {
		first, _, _ := strings.Cut(xf, ",")
		if a, err := netip.ParseAddr(strings.TrimSpace(first)); err == nil {
			return a.String()
		}
	}
	host, _, err := net.SplitHostPort(req.RemoteAddr)
	if err != nil {
		host = req.RemoteAddr
	}
	if a, err := netip.ParseAddr(host); err == nil {
		return a.String()
	}
	return ""
}

// validRequestID keeps inbound correlation ids bounded and header-safe (printable ASCII, no
// spaces); anything else is replaced by a generated id.
func validRequestID(rid string) bool {
	if rid == "" || len(rid) > 128 {
		return false
	}
	for _, r := range rid {
		if r < 0x21 || r > 0x7E {
			return false
		}
	}
	return true
}

func newRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "" // audit rows record NULL rather than a failing request
	}
	return hex.EncodeToString(b)
}
