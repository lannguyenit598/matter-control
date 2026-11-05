#!/usr/bin/env python3
"""The embedded stylesheet must be byte-identical to polish.css."""
import os
import re
import sys

PKG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(os.path.join(PKG, "polish.css"), "rb") as f:
    css = f.read()
with open(os.path.join(PKG, "prototype.html"), "rb") as f:
    html = f.read()

m = re.search(b'<style id="r8-polish">(.*?)</style>', html, re.DOTALL)
if not m:
    print('FAIL: <style id="r8-polish"> not found in prototype.html', file=sys.stderr)
    sys.exit(1)
embedded = m.group(1)
print("polish.css on disk:      %d bytes" % len(css))
print("embedded <style> block:  %d bytes" % len(embedded))
if css != embedded:
    print("FAIL: byte mismatch", file=sys.stderr)
    sys.exit(1)

with open(os.path.join(PKG, "study", "participant-surface.html"), "rb") as f:
    study = f.read()
sm = re.search(b'<style id="study-polish">(.*?)</style>', study, re.DOTALL)
if not sm or sm.group(1) != css:
    print("FAIL: the study surface does not embed the same stylesheet", file=sys.stderr)
    sys.exit(1)
print("study surface <style>:   %d bytes (identical)" % len(sm.group(1)))

for name, blob in (("prototype.html", html), ("study/participant-surface.html", study)):
    for needle in (b"http://", b"https://", b"//cdn", b"<link"):
        if needle in blob and needle in (b"http://", b"https://"):
            # allow nothing: a self-contained artifact must not reference the network
            print("FAIL: %s contains a network reference (%s)" % (name, needle.decode()), file=sys.stderr)
            sys.exit(1)
    print("PASS: %s is self-contained (no external link, script src or network URL)" % name)

print("PASS: exact binary byte identity confirmed (%d bytes)." % len(css))
