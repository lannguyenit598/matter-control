package domain

import (
	"sort"
	"strings"
)

// Package domain holds business-rule errors shared across the core (invalid input).
// Use-case outcome errors (not found, version conflict) belong to package port.
// Inbound adapters map them to protocol-specific errors; core knows nothing about HTTP status codes.

// FieldError describes a validation error for one field.
type FieldError struct {
	Field   string
	Message string
}

// ValidationError collects all input errors for a single response.
type ValidationError struct {
	Fields []FieldError
}

func (e *ValidationError) Add(field, message string) {
	e.Fields = append(e.Fields, FieldError{Field: field, Message: message})
}

func (e *ValidationError) HasErrors() bool { return len(e.Fields) > 0 }

func (e *ValidationError) Error() string {
	parts := make([]string, 0, len(e.Fields))
	for _, f := range e.Fields {
		parts = append(parts, f.Field+" "+f.Message)
	}
	sort.Strings(parts)
	return "validation failed: " + strings.Join(parts, "; ")
}
