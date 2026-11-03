// Package config reads configuration from environment variables (12-factor).
// product.go holds the MatterControl configuration; this file keeps the parser it uses.
package config

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// parser collects errors from all variables instead of stopping at the first error.
type parser struct {
	lookup func(string) (string, bool)
	errs   []error
}

func (p *parser) fail(format string, args ...any) {
	p.errs = append(p.errs, fmt.Errorf(format, args...))
}

func (p *parser) str(key, def string) string {
	if v, ok := p.lookup(key); ok && strings.TrimSpace(v) != "" {
		return strings.TrimSpace(v)
	}
	return def
}

func (p *parser) duration(key, def string) time.Duration {
	d, err := time.ParseDuration(p.str(key, def))
	if err != nil {
		p.fail("%s: %w", key, err)
	}
	return d
}

func (p *parser) int64(key string, def int64) int64 {
	raw := p.str(key, "")
	if raw == "" {
		return def
	}
	n, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		p.fail("%s: %w", key, err)
	}
	return n
}

func (p *parser) bool(key string, def bool) bool {
	raw := p.str(key, "")
	if raw == "" {
		return def
	}
	b, err := strconv.ParseBool(raw)
	if err != nil {
		p.fail("%s: %w", key, err)
	}
	return b
}
