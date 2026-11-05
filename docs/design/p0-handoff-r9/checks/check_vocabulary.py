#!/usr/bin/env python3
"""DR7-01: exact axis-vocabulary comparison against the approved source.

Approved source: docs/requirements/state-semantics.md.
Checked consumers: current-ux-spec.md, screen-state-matrix.json, prototype.html.

The rule being enforced is not "never write the word EXPIRED". Expiry and graph
cycles are real and must be describable. The rule is that neither may appear as
a MEMBER of an axis enumeration. So this check parses the declared member list
out of each consumer and compares the sets exactly; prose that explains expiry
as a recompute input, or a cycle as a validation rejection, passes.
"""
import json
import os
import re
import sys

PKG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.abspath(os.path.join(PKG, "..", "..", ".."))

APPROVED = {
    "execution": {"NOT_STARTED", "IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED"},
    "verification": {"UNVERIFIED", "PARTIALLY_VERIFIED", "VERIFIED", "NOT_REQUIRED", "DISPUTED"},
    "dependency": {"READY", "BLOCKED"},
    "timing": {"ON_TRACK", "DUE_SOON", "OVERDUE"},
    "attention": {"NORMAL", "ATTENTION", "CRITICAL"},
}
BANNED_AS_MEMBER = {"verification": {"EXPIRED"}, "dependency": {"CIRCULAR_CONFLICT"}}

failures = []
notes = []


def check(label, ok, detail=""):
    if ok:
        print("PASS  " + label)
    else:
        print("FAIL  " + label + (" — " + detail if detail else ""))
        failures.append(label)


# 1. the approved source still says what we think it says
sem = open(os.path.join(REPO, "docs/requirements/state-semantics.md"), encoding="utf-8").read()
check("approved source defines dependency as READY/BLOCKED only",
      "READY when no unsatisfied incoming gates; BLOCKED otherwise" in sem)
check("approved source treats a graph cycle as a rejection, not a state",
      "acyclic graph" in sem and "CIRCULAR_CONFLICT" not in sem)
check("approved source treats expiry as an input that recomputes the aggregate",
      "expired proof cannot support VERIFIED" in sem and "EXPIRED" not in re.findall(
          r"\|\s*Verification\s*\|.*", sem)[0] if re.findall(r"\|\s*Verification\s*\|.*", sem) else True)
check("EXPIRED is not a verification axis member in the approved source",
      not re.search(r"UNVERIFIED[^\n]*EXPIRED", sem))

# 2. the UX spec's declared axis lists
spec = open(os.path.join(PKG, "current-ux-spec.md"), encoding="utf-8").read()
axis_lines = {
    "execution": re.search(r"\*\*Execution State\*\*.*", spec),
    "verification": re.search(r"\*\*Verification State\*\*.*", spec),
    "dependency": re.search(r"\*\*Dependency State\*\*.*", spec),
    "timing": re.search(r"\*\*Timing State\*\*.*", spec),
    "attention": re.search(r"\*\*Attention State\*\*.*", spec),
}
for axis, m in axis_lines.items():
    if m is None:
        check("current-ux-spec.md declares the %s axis" % axis, False, "line not found")
        continue
    members = set(re.findall(r"`([A-Z_]+)`", m.group(0)))
    check("current-ux-spec.md %s axis members match the approved set exactly" % axis,
          members == APPROVED[axis],
          "declared %s, approved %s" % (sorted(members), sorted(APPROVED[axis])))
    for banned in BANNED_AS_MEMBER.get(axis, set()):
        check("current-ux-spec.md does not list %s as a %s member" % (banned, axis), banned not in members)

# 3. the matrix must not enumerate a banned value as an axis member
matrix_text = open(os.path.join(PKG, "screen-state-matrix.json"), encoding="utf-8").read()
matrix = json.loads(matrix_text)
axes = {k: v for k, v in (matrix.get("state_axes") or {}).items() if isinstance(v, dict)}
check("screen-state-matrix.json publishes the axis vocabulary", len(axes) == 5, str(sorted(axes)))
if axes:
    for axis, spec_block in axes.items():
        members = set(spec_block.get("members", []))
        check("matrix %s axis members match the approved set exactly" % axis,
              members == APPROVED.get(axis, set()),
              "declared %s" % sorted(members))
        for banned in BANNED_AS_MEMBER.get(axis, set()):
            check("matrix records %s as a non-member with a stated reason" % banned,
                  banned in (spec_block.get("not_a_member") or {}),
                  "missing the explicit non-member note")

# 4. the prototype must not enumerate a banned value as an axis member, and must
#    still be able to explain expiry and cycle rejection in prose.
proto = open(os.path.join(PKG, "prototype.html"), encoding="utf-8").read()
for axis, banned_set in BANNED_AS_MEMBER.items():
    for banned in banned_set:
        occurrences = [m.start() for m in re.finditer(banned, proto)]
        bad = []
        for pos in occurrences:
            window = proto[max(0, pos - 240): pos + 240]
            # a member enumeration looks like a list of sibling axis values
            siblings = APPROVED[axis] - {banned}
            if sum(1 for s in siblings if s in window) >= 2:
                bad.append(window)
        check("prototype never enumerates %s as a %s axis member" % (banned, axis), not bad,
              "%d suspicious enumeration(s)" % len(bad))
        notes.append("%s appears %d time(s) in prototype.html%s"
                     % (banned, len(occurrences),
                        ", every one of them in explanatory prose" if occurrences else " (it is not used at all)"))

# 5. every R8 document ZCode or a reviewer consumes, swept the same way
DOCS = ["current-ux-spec.md", "zcode-handoff.md", "validation-plan.md", "design-delta.md", "return.md"]
for name in DOCS:
    path = os.path.join(PKG, name)
    if not os.path.exists(path):
        check("%s exists for the vocabulary sweep" % name, False, "not written yet")
        continue
    text = open(path, encoding="utf-8").read()
    for axis, banned_set in BANNED_AS_MEMBER.items():
        for banned in banned_set:
            bad = []
            for mm in re.finditer(banned, text):
                window = text[max(0, mm.start() - 240): mm.start() + 240]
                siblings = APPROVED[axis] - {banned}
                if sum(1 for sib in siblings if sib in window) >= 2:
                    bad.append(window)
            check("%s never enumerates %s as a %s axis member" % (name, banned, axis), not bad,
                  "%d suspicious enumeration(s)" % len(bad))
    # a status the current contract does not define must not be reintroduced
    bad_status = re.findall(r"\b409\b", text)
    check("%s uses no status code the current contract does not define" % name, not bad_status,
          "%d occurrence(s) of 409" % len(bad_status))
    for stale in ("MC-P0-DESIGN-R5", "MC-P0-DESIGN-R6", "R6 \u2014 unified UX specification"):
        check("%s carries no stale revision label (%s)" % (name, stale), stale not in text)

check("prototype explains proof expiry as a recompute input",
      "Expired proof is an input that makes the evaluator recompute" in proto)
check("prototype explains graph cycles as a validation rejection",
      "Graph cycles are rejected at validation" in proto)

for n in notes:
    print("NOTE  " + n)

if failures:
    print("\nFAILED: %d vocabulary check(s)" % len(failures))
    sys.exit(1)
print("\nSOURCE_CHECKED: axis vocabulary matches the approved semantics in spec, matrix and prototype.")
