#!/usr/bin/env python3
"""Assemble prototype.html and study/participant-surface.html from src/.

Deterministic: same inputs produce identical bytes. Both outputs are
self-contained — no CDN, no network reference, no external stylesheet.
The Atlas snapshot is copied verbatim from the R7 package so the canonical
24 records, 7 edges and as-of time are provably unchanged.
"""
import json
import os
import re
import subprocess
import sys

PKG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R7 = os.path.join(os.path.dirname(PKG), "p0-handoff-r7", "prototype.html")


def read(*parts):
    with open(os.path.join(PKG, *parts), encoding="utf-8") as f:
        return f.read()


def write(text, *parts):
    path = os.path.join(PKG, *parts)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    return path


def main():
    with open(R7, encoding="utf-8") as f:
        r7 = f.read()
    atlas = re.search(r'<script id="atlas-data" type="application/json">(.*?)</script>', r7, re.S).group(1)
    snapshot = json.loads(atlas)
    assert len(snapshot["records"]) == 24, "the canonical Atlas snapshot must carry 24 records"
    assert len(snapshot["edges"]) == 7, "the canonical Atlas snapshot must carry 7 edges"

    css = read("polish.css")
    body = read("src", "body.html")
    logic = read("src", "logic.js")
    fixtures = subprocess.run([sys.executable, os.path.join(PKG, "src", "fixtures.py")],
                              check=True, capture_output=True, text=True).stdout.strip()
    json.loads(fixtures)

    for name, text in (("fixtures", fixtures), ("logic", logic), ("body", body)):
        assert "</script" not in text.lower(), "%s must not contain a script terminator" % name

    head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
            '<title>MatterControl — P0 concept prototype (R8 candidate, synthetic)</title>\n'
            '<style id="r8-polish">' + css + '</style></head>\n')
    tail = ('\n<script id="atlas-data" type="application/json">' + atlas + '</script>\n'
            '<script id="fixtures-data" type="application/json">' + fixtures + '</script>\n'
            '<script id="concept-logic">\n' + logic + '</script></body></html>\n')
    path = write(head + body + tail, "prototype.html")
    print("wrote %s (%d bytes)" % (os.path.relpath(path, PKG), os.path.getsize(path)))

    # Participant study surface: same stylesheet, study datasets only.
    study = [json.loads(read("study", "scenario-a.json")), json.loads(read("study", "scenario-b.json"))]
    payload = json.dumps(study, ensure_ascii=False, separators=(",", ":"))
    assert "</script" not in payload.lower()
    slogic = read("src", "study-logic.js")
    shtml = (
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<title>MatterControl — Control Room (study surface)</title>\n'
        '<style id="study-polish">' + css + '</style>\n</head>\n<body>\n'
        '<header><strong>MatterControl</strong><div class="scope"><span id="scenario-name"></span></div>'
        '<span class="meta" id="scenario-asof"></span></header>\n'
        '<div class="appbar"><label for="scenario-select">Scenario<select id="scenario-select">'
        '<option value="SCENARIO-A">A</option><option value="SCENARIO-B">B</option></select></label>'
        '<span class="fixture-flag" id="counts"></span></div>\n'
        '<main id="main" tabindex="-1" style="padding:24px;">\n<h1>Control Room</h1>\n<div class="cr-layout">\n'
        '<section class="panel span"><h2>Blockers &amp; critical causal path</h2><div id="chain" class="chain"></div>'
        '<div class="chain-summary" id="chain-summary"></div></section>\n'
        '<section class="panel"><h2>Next Actions</h2><div id="next"></div></section>\n'
        '<section class="panel"><h2>Milestones</h2><div id="milestones"></div></section>\n'
        '<section class="panel"><h2>Waiting On</h2><div id="waiting"></div></section>\n'
        '<section class="panel"><h2>Evidence gaps</h2><div id="gaps"></div></section>\n'
        '</div>\n</main>\n'
        '<script id="study-data" type="application/json">' + payload + '</script>\n'
        '<script id="study-logic">\n' + slogic + '</script>\n</body></html>\n')
    spath = write(shtml, "study", "participant-surface.html")
    print("wrote %s (%d bytes)" % (os.path.relpath(spath, PKG), os.path.getsize(spath)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
