// Synthetic introspection stub IdP for the local MatterControl walkthrough
// (CO-17, decision D-1(b)). Stand-in for the real IdP: answers RFC 7662
// introspection for fixed synthetic bearer tokens ("tok-<subject>"). It accepts
// the client assertion without verifying it because this stub and the API key
// pair are both generated inside the same disposable walkthrough runtime and
// protect nothing. Loopback-only: the listener refuses a non-loopback address.
//
// Contract mirrored from the product verifier
// (internal/adapter/outbound/identity/zitadel/verifier.go): a known token gets
// {"active":true,"sub","iss","aud","exp"}; an unknown token gets
// {"active":false} with HTTP 200 so the verifier maps it to 401, while a stub
// outage (non-200) maps to 503 — fail-closed on both sides.
//
// Configuration (environment):
//
//	MC_WT_IDP_ADDR        listen address   (default 127.0.0.1:18093)
//	MC_WT_IDP_ISSUER      required; must equal MC_OIDC_ISSUER of the runtime
//	MC_WT_IDP_AUDIENCE    token audience   (default mc-walkthrough-aud)
//	MC_WT_IDP_SUBJECTS    comma-separated subjects (default the 5 walkthrough users)
//	MC_WT_IDP_TOKEN_PREFIX bearer prefix   (default tok-)
//	MC_WT_IDP_TTL_HOURS   introspected exp window (default 2, max 24)
//	MC_WT_IDP_LOG         log file path 0600 (empty → stderr)
package main

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

func envOr(key, def string) string {
	if v := strings.TrimSpace(os.Getenv(key)); v != "" {
		return v
	}
	return def
}

func main() {
	addr := envOr("MC_WT_IDP_ADDR", "127.0.0.1:18093")
	issuer := strings.TrimSpace(os.Getenv("MC_WT_IDP_ISSUER"))
	if issuer == "" {
		log.Fatal("MC_WT_IDP_ISSUER is required (must equal MC_OIDC_ISSUER of the runtime)")
	}
	audience := envOr("MC_WT_IDP_AUDIENCE", "mc-walkthrough-aud")
	prefix := envOr("MC_WT_IDP_TOKEN_PREFIX", "tok-")
	ttlHours := 2
	if raw := envOr("MC_WT_IDP_TTL_HOURS", ""); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil && n > 0 && n <= 24 {
			ttlHours = n
		}
	}
	subjects := map[string]bool{}
	for _, s := range strings.Split(envOr("MC_WT_IDP_SUBJECTS", "wt-alice,wt-binh,wt-editor2,wt-cuc,wt-dung"), ",") {
		if s = strings.TrimSpace(s); s != "" {
			subjects[s] = true
		}
	}

	if host, _, err := net.SplitHostPort(addr); err != nil {
		log.Fatalf("MC_WT_IDP_ADDR %q: %v", addr, err)
	} else if ip := net.ParseIP(host); host != "localhost" && (ip == nil || !ip.IsLoopback()) {
		log.Fatalf("refusing non-loopback listen address %q: this stub protects nothing", addr)
	}
	if path := envOr("MC_WT_IDP_LOG", ""); path != "" {
		f, err := os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0600)
		if err != nil {
			log.Fatal(err)
		}
		defer func() { _ = f.Close() }()
		log.SetOutput(f)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/introspect", func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		token := r.FormValue("token")
		log.Printf("%s introspect token_prefix=%q", time.Now().UTC().Format(time.RFC3339), shortToken(prefix, token))
		sub := strings.TrimPrefix(token, prefix)
		w.Header().Set("Content-Type", "application/json")
		enc := json.NewEncoder(w)
		if !subjects[sub] {
			_ = enc.Encode(map[string]any{"active": false})
			return
		}
		_ = enc.Encode(map[string]any{
			"active": true,
			"sub":    sub,
			"iss":    issuer,
			"aud":    []string{audience},
			"exp":    time.Now().Add(time.Duration(ttlHours) * time.Hour).Unix(),
		})
	})
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Printf("stub idp on %s issuer=%s aud=%s subjects=%d ttl=%dh", addr, issuer, audience, len(subjects), ttlHours)
	log.Fatal(srv.ListenAndServe())
}

// shortToken never logs a full token: prefix plus a few characters is enough to correlate.
func shortToken(prefix, t string) string {
	keep := len(prefix) + 8
	if len(t) > keep {
		return t[:keep] + "..."
	}
	return t
}
