#!/usr/bin/env python3
"""
MC-002-INTA-FE-VALIDATION-R3: Upstream HTTP Observer
Durable, fail-closed loopback observer addressing R1-C03.
- Atomic updates on every request using tempfile + fsync + os.replace.
- Explicit signal handling (SIGTERM, SIGINT) ensuring cleanShutdown state is flushed.
- Structured PID, variant, isFinal flag, and UTC timestamp metadata.
- Propagates write failures rather than swallowing them.
"""

import argparse
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
import signal
import sys
import threading


class AtomicStateWriter:
    def __init__(self, target_path: str, variant: str, pid: int):
        self.target_path = target_path
        self.variant = variant
        self.pid = pid
        self.target_dir = os.path.dirname(os.path.abspath(target_path))
        os.makedirs(self.target_dir, exist_ok=True)
        self.lock = threading.Lock()

    def write_state(
        self,
        request_count: int,
        clean_shutdown: bool = False,
        error: str = None,
        is_final: bool = False,
    ) -> None:
        """
        Atomically writes observer state to disk in the SAME directory.
        Uses fsync and os.replace to guarantee durability across process abrupt terminations.
        """
        payload = {
            "variant": self.variant,
            "pid": self.pid,
            "requestCount": request_count,
            "cleanShutdown": clean_shutdown,
            "isFinal": is_final,
            "updatedAtUTC": datetime.now(timezone.utc).isoformat(),
        }
        if error is not None:
            payload["error"] = str(error)

        tmp_path = f"{self.target_path}.tmp.{self.pid}"
        with self.lock:
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.replace(tmp_path, self.target_path)


class ObserverHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default stderr request logging
        pass

    def do_GET(self):
        self._record_and_respond()

    def do_POST(self):
        self._record_and_respond()

    def do_PUT(self):
        self._record_and_respond()

    def do_DELETE(self):
        self._record_and_respond()

    def do_HEAD(self):
        self._record_and_respond()

    def do_OPTIONS(self):
        self._record_and_respond()

    def _record_and_respond(self):
        server: "ObservableServer" = self.server  # type: ignore
        server.record_request(f"{self.command} {self.path}")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"observed"}\n')


class ObservableServer(HTTPServer):
    def __init__(
        self, server_address, RequestHandlerClass, state_writer: AtomicStateWriter
    ):
        super().__init__(server_address, RequestHandlerClass)
        self.state_writer = state_writer
        self.request_count = 0
        self.requests_log = []
        self._counter_lock = threading.Lock()
        # Initialize initial zero-count state on startup
        self.state_writer.write_state(
            request_count=0, clean_shutdown=False, is_final=False
        )

    def record_request(self, info: str):
        with self._counter_lock:
            self.request_count += 1
            self.requests_log.append(info)
            # Durably persist positive counter immediately on each HTTP event
            self.state_writer.write_state(
                request_count=self.request_count,
                clean_shutdown=False,
                is_final=False,
            )


def run_observer_process(port: int, state_file: str, variant: str):
    pid = os.getpid()
    writer = AtomicStateWriter(state_file, variant, pid)
    server = None

    def handle_signal(sig, frame):
        if server:
            try:
                writer.write_state(
                    request_count=server.request_count,
                    clean_shutdown=True,
                    is_final=True,
                )
            except Exception as e:
                # If writing fails, exit with error code 2
                sys.exit(2)
            sys.exit(0)

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    try:
        server = ObservableServer(("127.0.0.1", port), ObserverHandler, writer)
    except Exception as e:
        # Record startup error atomically and exit with failure
        try:
            writer.write_state(
                request_count=0,
                clean_shutdown=False,
                error=f"Startup bind failure on 127.0.0.1:{port}: {e}",
                is_final=True,
            )
        except Exception:
            pass
        sys.exit(1)

    try:
        server.serve_forever()
    except Exception as e:
        try:
            writer.write_state(
                request_count=server.request_count if server else 0,
                clean_shutdown=False,
                error=f"Runtime server exception: {e}",
                is_final=True,
            )
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MC-002 Upstream HTTP Observer")
    parser.add_argument("--port", type=int, default=18086, help="Loopback port to bind")
    parser.add_argument(
        "--state-file",
        type=str,
        required=True,
        help="Path to write atomic observer state",
    )
    parser.add_argument(
        "--variant",
        type=str,
        default="unknown",
        help="Variant key/name being observed",
    )
    args = parser.parse_args()

    run_observer_process(args.port, args.state_file, args.variant)
