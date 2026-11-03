// Package productapi is the MatterControl product HTTP adapter (contract revision 4):
// bearer authentication through port.TokenVerifier + port.IdentityResolver, strict JSON
// decoding, intent fingerprints, strong ETags, revision CAS and RFC 9457 problems with
// product URNs. It talks to the core only through inbound ports.
package productapi

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
)

// fingerprintVersion changes only with a contract revision that alters the frame.
const fingerprintVersion = "mc-intent-v1"

// fingerprint is the SHA-256 over the deterministic framed tuple
// (version, method, routeTemplate, path, body, preconditions): fixed member order,
// 8-byte big-endian length prefixes, exact bytes, no normalization. It is the replay
// input bound to an idempotency key and is never taken from the client.
func fingerprint(method, routeTemplate, path string, body []byte, preconditions string) string {
	h := sha256.New()
	for _, part := range [][]byte{
		[]byte(fingerprintVersion), []byte(method), []byte(routeTemplate), []byte(path), body, []byte(preconditions),
	} {
		var n [8]byte
		binary.BigEndian.PutUint64(n[:], uint64(len(part)))
		h.Write(n[:])
		h.Write(part)
	}
	return hex.EncodeToString(h.Sum(nil))
}

// etagOf is the strong validator of an exact representation: equal tags imply equal bytes.
func etagOf(body []byte) string {
	sum := sha256.Sum256(body)
	return `"` + hex.EncodeToString(sum[:]) + `"`
}

// errMalformed marks any decode failure; the boundary maps it to 400 malformed-body.
var errMalformed = errors.New("malformed request body")

// decodeStrict decodes exactly one JSON object into dst, rejecting unknown fields,
// duplicate keys at any depth, trailing data and a non-object top level.
func decodeStrict(raw []byte, dst any) error {
	if len(bytes.TrimSpace(raw)) == 0 || bytes.TrimSpace(raw)[0] != '{' {
		return fmt.Errorf("%w: body must be a JSON object", errMalformed)
	}
	if err := rejectDuplicateKeys(raw); err != nil {
		return err
	}
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return fmt.Errorf("%w: %s", errMalformed, sanitize(err))
	}
	if _, err := dec.Token(); !errors.Is(err, io.EOF) {
		return fmt.Errorf("%w: trailing data", errMalformed)
	}
	return nil
}

// sanitize keeps decoder diagnostics free of echoed request values.
func sanitize(err error) string {
	var ute *json.UnmarshalTypeError
	if errors.As(err, &ute) {
		return "field " + ute.Field + " has the wrong type"
	}
	if strings.HasPrefix(err.Error(), "json: unknown field") {
		return "unknown field"
	}
	return "invalid JSON"
}

func rejectDuplicateKeys(raw []byte) error {
	dec := json.NewDecoder(bytes.NewReader(raw))
	if err := walk(dec); err != nil {
		return err
	}
	return nil
}

func walk(dec *json.Decoder) error {
	tok, err := dec.Token()
	if err != nil {
		return fmt.Errorf("%w: invalid JSON", errMalformed)
	}
	delim, ok := tok.(json.Delim)
	if !ok {
		return nil
	}
	switch delim {
	case '{':
		seen := map[string]bool{}
		for dec.More() {
			kt, err := dec.Token()
			if err != nil {
				return fmt.Errorf("%w: invalid JSON", errMalformed)
			}
			key, _ := kt.(string)
			if seen[key] {
				return fmt.Errorf("%w: duplicate key", errMalformed)
			}
			seen[key] = true
			if err := walk(dec); err != nil {
				return err
			}
		}
	case '[':
		for dec.More() {
			if err := walk(dec); err != nil {
				return err
			}
		}
	}
	if _, err := dec.Token(); err != nil { // closing delimiter
		return fmt.Errorf("%w: invalid JSON", errMalformed)
	}
	return nil
}
