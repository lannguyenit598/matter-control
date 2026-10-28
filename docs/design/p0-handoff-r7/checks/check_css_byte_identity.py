#!/usr/bin/env python3
"""Check binary byte identity between polish.css and embedded style in prototype.html."""
import os
import re
import sys

css_path = "/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r7/polish.css"
html_path = "/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r7/prototype.html"

with open(css_path, "rb") as f:
    css_bytes = f.read()

with open(html_path, "rb") as f:
    html_bytes = f.read()

m = re.search(b'<style id="r7-polish">(.*?)</style>', html_bytes, re.DOTALL)
if not m:
    print("FAIL: <style id=\"r7-polish\"> tag not found in prototype.html", file=sys.stderr)
    sys.exit(1)

embedded_bytes = m.group(1)

css_len = len(css_bytes)
embedded_len = len(embedded_bytes)

print(f"External polish.css size: {css_len} bytes")
print(f"Embedded <style> size:    {embedded_len} bytes")

if css_bytes != embedded_bytes:
    print(f"FAIL: Byte mismatch between polish.css ({css_len}B) and embedded style ({embedded_len}B)", file=sys.stderr)
    sys.exit(1)

print(f"PASS: Exact binary byte identity confirmed ({css_len} bytes matching byte-for-byte).")
