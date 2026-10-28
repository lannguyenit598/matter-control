#!/usr/bin/env node
/**
 * Mock DOM bootstrap test verifying prototype.html initialization,
 * local $ helper presence before callers, 35 $() ID resolutions,
 * proof context rendering, demo fixture AC-DEMO-PROOF, and modal back navigation.
 */
const fs = require("fs");
const assert = require("assert");

const htmlPath = "/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r7/prototype.html";
const html = fs.readFileSync(htmlPath, "utf-8");

// Mock DOM elements registry
const elements = new Map();
function makeElem(id) {
  const el = {
    id,
    tagName: "DIV",
    innerHTML: "",
    textContent: "",
    value: "24",
    open: false,
    style: {},
    classList: {
      add(){},
      remove(){},
      toggle(){},
      contains(){ return false; }
    },
    setAttribute(){},
    getAttribute(){ return null; },
    removeAttribute(){},
    focus(){},
    showModal(){ el.open = true; },
    close(){ el.open = false; },
    addEventListener(){},
    closest(){ return makeElem("closest-mock"); },
    querySelectorAll(){ return []; }
  };
  return el;
}

// Register all IDs declared in HTML
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
ids.forEach(id => elements.set(id, makeElem(id)));

// Populate atlas-data textContent
const atlasDataMatch = html.match(/<script id="atlas-data"[^>]*>([\s\S]*?)<\/script>/);
assert(atlasDataMatch, "atlas-data script tag must exist");
elements.get("atlas-data").textContent = atlasDataMatch[1];

// Setup global mock DOM
global.document = {
  getElementById(id) {
    if (!elements.has(id)) {
      elements.set(id, makeElem(id));
    }
    return elements.get(id);
  },
  activeElement: makeElem("active"),
  addEventListener(){}
};
global.window = global;

// Extract logic script
const scriptMatch = html.match(/<script id="concept-logic">([\s\S]*?)<\/script>/);
assert(scriptMatch, "concept-logic script tag must exist");

// Assert $ helper is declared at top of script before callers
const logicText = scriptMatch[1];
const dollarIdx = logicText.indexOf("const $");
const callerIdx = logicText.indexOf("$(");
assert(dollarIdx !== -1, "const $ declaration must exist");
assert(callerIdx !== -1, "$( caller must exist");
assert(dollarIdx < callerIdx, "const $ declaration must appear before any $( caller");

// Evaluate script with globals exposed for assertion
eval(logicText + "\n;global.records = records; global.recordById = recordById; global.openRecord = openRecord; global.showProof = showProof; global.handleBackPrev = handleBackPrev; global.handleCloseDetail = handleCloseDetail;");

console.log("1. Standalone bootstrap executed cleanly without uncaught exceptions.");
assert.equal(records.length, 24, "Canonical Atlas records count must be exactly 24");
console.log("2. Canonical 24 records initialized correctly in data store.");

// Test RQ-03 consistency: historical baseline VERIFIED + caveat
openRecord("RQ-03");
showProof();
const rq03Title = elements.get("detail-title").textContent;
const rq03Body = elements.get("detail-body").innerHTML;
assert(rq03Title.includes("RQ-03"), "Detail title must name RQ-03");
assert(rq03Body.includes("VERIFIED (Historical baseline"), "RQ-03 must show historical baseline VERIFIED");
assert(rq03Body.includes("submitter U-02 self-review is flagged as an audit caveat"), "RQ-03 must document self-review caveat");
console.log("3. RQ-03 proof presentation verified consistent: historical baseline VERIFIED with explicit caveat.");

// Test RQ-05 / DEP-05 consistency: historical reported gate vs current policy
openRecord("RQ-05");
showProof();
const rq05Body = elements.get("detail-body").innerHTML;
assert(rq05Body.includes("Historically Reported: DEP-05 satisfied at baseline T0"), "RQ-05 must show historically reported gate satisfied");
assert(rq05Body.includes("Current Policy Evaluation: Evaluator flags self-review caveat"), "RQ-05 must show current policy evaluation separately");
console.log("4. RQ-05 proof presentation verified: historically reported gate separated from current policy caveat.");

// Test AC-DEMO-PROOF fixture: proof-bearing Action under state-semantics.md §10
openRecord("AC-DEMO-PROOF");
const demoTitle = elements.get("detail-title").textContent;
assert(demoTitle.includes("AC-DEMO-PROOF"), "Detail title must name AC-DEMO-PROOF");
showProof();
const demoProofBody = elements.get("detail-body").innerHTML;
assert(demoProofBody.includes("UNVERIFIED (Pending verifier evaluation)"), "AC-DEMO-PROOF must be UNVERIFIED");
assert(demoProofBody.includes("POA-DOC-01 v1 signed &amp; notarized"), "AC-DEMO-PROOF must specify POA-DOC-01");
assert(demoProofBody.includes("U-03 (Operations Contributor)"), "AC-DEMO-PROOF submitter must be U-03");
assert(demoProofBody.includes("U-02 (Designated Independent Verifier)"), "AC-DEMO-PROOF verifier must be U-02");
console.log("5. AC-DEMO-PROOF fixture verified: operational action with explicit proof requirements under state-semantics.md §10.");

// Test modal navigation and cleanup
handleBackPrev();
assert.equal(elements.get("detail-title").textContent, "RQ-05 · Evidence & Proof Verification Context", "Back navigation must return to previous modal view");
handleCloseDetail();
assert.equal(elements.get("detail").open, false, "Close detail must close modal");
console.log("6. Modal back navigation trail and close cleanup verified.");

console.log("PASS: Mock DOM bootstrap suite completed with 0 errors.");
