// faultproxy is a loopback-only forwarder in front of the mcapi product API for
// walkthrough fault-injection (MC-ENABLE-E2-E4-20261107, E-4).
//
// It binds only to a loopback address and forwards only to a loopback upstream —
// both are refused otherwise (the loopback-only walkthrough constraint is absolute).
// The frontend points at this proxy instead of mcapi directly (API_BASE_URL), so
// faults are visible to the real UI without touching product code:
//
//	mode file absent or "off"        → plain pass-through
//	"latency-ms=<N>"                 → sleep N ms, then forward (degraded, not failed)
//	"status=<NNN>"                   → respond NNN immediately (upstream never called)
//
// Anything else in the mode file is logged and ignored (pass-through). The mode
// file is re-read for every request, so fault scripts toggle it live; the obvious
// inverse of every fault is fault-restore.sh ("off"). Nothing persists: down.sh
// deletes the state dir including the mode file.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type mode struct {
	kind   string // "off", "latency", "status"
	latency time.Duration
	status int
}

func readMode(path string) mode {
	raw, err := os.ReadFile(path)
	if err != nil {
		return mode{kind: "off"}
	}
	value := strings.TrimSpace(string(raw))
	switch {
	case value == "" || value == "off":
		return mode{kind: "off"}
	case strings.HasPrefix(value, "latency-ms="):
		ms, err := strconv.Atoi(strings.TrimPrefix(value, "latency-ms="))
		if err != nil || ms < 0 || ms > 600000 {
			log.Printf("faultproxy: ignoring invalid latency mode %q", value)
			return mode{kind: "off"}
		}
		return mode{kind: "latency", latency: time.Duration(ms) * time.Millisecond}
	case strings.HasPrefix(value, "status="):
		code, err := strconv.Atoi(strings.TrimPrefix(value, "status="))
		if err != nil || code < 400 || code > 599 {
			log.Printf("faultproxy: ignoring invalid status mode %q", value)
			return mode{kind: "off"}
		}
		return mode{kind: "status", status: code}
	default:
		log.Printf("faultproxy: ignoring unknown mode %q", value)
		return mode{kind: "off"}
	}
}

func loopback(hostPort string) (string, error) {
	host, _, err := net.SplitHostPort(hostPort)
	if err != nil {
		return "", fmt.Errorf("bad address %q: %w", hostPort, err)
	}
	if host != "127.0.0.1" && host != "localhost" && host != "::1" {
		return "", fmt.Errorf("refusing non-loopback host %q", host)
	}
	return host, nil
}

func writeJSON(w http.ResponseWriter, code int, payload map[string]string) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Retry-After", "2")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(payload)
}

func main() {
	listen := flag.String("listen", "127.0.0.1:8082", "loopback address to bind")
	upstream := flag.String("upstream", "127.0.0.1:8083", "loopback address of mcapi")
	modeFile := flag.String("mode-file", "", "fault mode file (re-read per request)")
	flag.Parse()

	if _, err := loopback(*listen); err != nil {
		log.Fatalf("faultproxy: listen: %v", err)
	}
	if _, err := loopback(*upstream); err != nil {
		log.Fatalf("faultproxy: upstream: %v", err)
	}
	if *modeFile == "" {
		log.Fatal("faultproxy: -mode-file is required")
	}
	target, err := url.Parse("http://" + *upstream)
	if err != nil {
		log.Fatalf("faultproxy: upstream url: %v", err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)
	proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
		// Upstream unreachable is itself the "API down" fault demonstration path.
		log.Printf("faultproxy: upstream error on %s %s: %v", r.Method, r.URL.Path, err)
		writeJSON(w, http.StatusBadGateway, map[string]string{"error": "upstream_unavailable"})
	}

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		m := readMode(*modeFile)
		switch m.kind {
		case "status":
			log.Printf("faultproxy: FAULT status=%d on %s %s", m.status, r.Method, r.URL.Path)
			writeJSON(w, m.status, map[string]string{"error": "fault_injected", "detail": "injected by faultproxy (walkthrough)"})
			return
		case "latency":
			time.Sleep(m.latency)
		}
		proxy.ServeHTTP(w, r)
	})

	server := &http.Server{Addr: *listen, Handler: handler, ReadHeaderTimeout: 10 * time.Second}
	log.Printf("faultproxy: %s -> %s (mode file %s)", *listen, *upstream, *modeFile)
	log.Fatal(server.ListenAndServe())
}
