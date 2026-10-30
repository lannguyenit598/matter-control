package port

import "context"

// RequestMeta carries the per-request tracing fields the security audit records (A1): the
// client IP as seen at the trust boundary and the server-generated request correlation id.
// The HTTP adapter injects it into the request context; services copy it into
// matter.SecurityAuditEntry at the audit write sites. Absent meta is a zero value — audit
// rows record empty fields rather than guessing.
type RequestMeta struct {
	ClientIP  string
	RequestID string
}

type requestMetaKeyType struct{}

// WithRequestMeta returns a context carrying m.
func WithRequestMeta(ctx context.Context, m RequestMeta) context.Context {
	return context.WithValue(ctx, requestMetaKeyType{}, m)
}

// RequestMetaFromContext returns the meta carried by ctx, or the zero value.
func RequestMetaFromContext(ctx context.Context) RequestMeta {
	m, _ := ctx.Value(requestMetaKeyType{}).(RequestMeta)
	return m
}
