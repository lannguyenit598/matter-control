package productapi

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

// inFlightLimit refuses requests beyond max concurrent ones with a retryable 503 and Retry-After
// instead of queueing them: every API request loads a whole matter graph, so unbounded concurrency
// exhausts the database pool and memory before any timeout helps. Refusal happens before the
// request is read or executed, so a refused command is never applied and is safe to retry.
// max <= 0 disables the limit.
func inFlightLimit(max int) echo.MiddlewareFunc {
	if max <= 0 {
		return func(next echo.HandlerFunc) echo.HandlerFunc { return next }
	}
	slots := make(chan struct{}, max)
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			select {
			case slots <- struct{}{}:
				defer func() { <-slots }()
				return next(c)
			default:
				c.Response().Header().Set("Retry-After", "1")
				return writeProblem(c, mk(http.StatusServiceUnavailable, "unavailable", "Service Unavailable",
					"the service is at capacity; retry shortly", true))
			}
		}
	}
}
