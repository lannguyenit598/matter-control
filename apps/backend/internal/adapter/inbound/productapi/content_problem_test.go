package productapi

import (
	"context"
	"fmt"
	"net/http"
	"reflect"
	"testing"

	"leonx.me/matter-control/internal/core/port"
)

// Telling "missing" and "corrupt" apart is for operators (logs); the client still sees the same
// retryable "content unavailable" answer, with a fixed body that says nothing about why.
func TestToProblem_ContentIntegrityErrorsKeepTheUnavailableAnswer(t *testing.T) {
	want := toProblem(context.Background(), port.ErrObjectUnavailable)
	if want.Status != http.StatusServiceUnavailable || want.Type != "urn:mc:content-unavailable" || !want.Retryable {
		t.Fatalf("baseline: %+v", want)
	}
	for name, err := range map[string]error{
		"missing":          port.ErrObjectMissing,
		"corrupt":          port.ErrObjectCorrupt,
		"missing, wrapped": fmt.Errorf("open version content: %w", port.ErrObjectMissing),
		"corrupt, wrapped": fmt.Errorf("open version content: %w", port.ErrObjectCorrupt),
	} {
		if got := toProblem(context.Background(), err); !reflect.DeepEqual(got, want) {
			t.Errorf("%s: %+v differs from %+v", name, got, want)
		}
	}
}
