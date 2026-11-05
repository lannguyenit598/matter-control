### GW-03 Regulatory Filing walkthrough — filing A (PACKAGE+OUTCOME, two supplement-adjacent stages), filing B (no OUTCOME criterion — BF-01 residual), filing C (negative outcome), filing D (proofRequired=false, BF-02).
matter1: 01a192b1-95b3-78fc-9e80-ce9b50a46112
package doc v1 current: {"current":"01a192b1-ace4-70ee-9cfa-81742f451261"}
filing A: 01a192b1-adfa-7bd3-b38c-8364548db0c0
criteria (package/outcome): 01a192b1-ae34-73bd-869c-f0fe3f1a2114 01a192b1-ae69-7017-8a94-0140fe504448
package part ready (outcome still 0/1): {"package":{"declared":true,"total":1,"mandatory":1,"satisfied":1,"ready":true},"outcome":{"declared":true,"total":1,"mandatory":1,"satisfied":0,"ready":false}}
stage PACKAGE_PREPARATION: {"stage":"PACKAGE_PREPARATION","next":["SIGNATURE"]}
TRAP D5a submission-without-reference (expect 409): {"code":"reference-required"}
stage SUBMISSION (submission is not completion): {"stage":"SUBMISSION","exec":"WAITING","ver":"PARTIALLY_VERIFIED"}
stage RECEIPT — receipt is not approval: {"stage":"RECEIPT","ver":"PARTIALLY_VERIFIED","ov":"PENDING"}
stage AUTHORITY_REVIEW (WAITING on authority): {"stage":"AUTHORITY_REVIEW","exec":"WAITING"}
stage SUPPLEMENT (cycle 2): {"stage":"SUPPLEMENT","cycle":2}
stage RESPONSE: {"stage":"RESPONSE"}
TRAP BF-01 after APPROVAL evidence (expect exec COMPLETED, verification PARTIALLY_VERIFIED, outcomeVerification PENDING): {"stage":"APPROVAL","exec":"COMPLETED","ver":"PARTIALLY_VERIFIED","ov":"PENDING"}
TRAP D2-filing submitter accepts outcome (expect 409): {"code":"not-verifier"}
outcome accepted by verifier (expect VERIFIED + ACCEPTED): {"ver":"VERIFIED","ov":"ACCEPTED"}
linked requirement NOT auto-completed/verified: {"exec":"NOT_STARTED","ver":"UNVERIFIED"}
TRAP BF-01 residual: package VERIFIED, outcome NOT_DECLARED (PO decision open): {"ver":"UNVERIFIED","ov":"NOT_DECLARED"}
TRAP AC-145 negative outcome (stage unchanged, evidence retained): {"stage":"AUTHORITY_REVIEW","neg":"REJECTED","open":true}
TRAP AC-145 approval refused while negative stands: {"code":null}
TRAP AC-145 closure by OWNER: {"exec":"CANCELLED","stage":"AUTHORITY_REVIEW"}
TRAP AC-145 reopening (history preserved): {"exec":"IN_PROGRESS","stage":"AUTHORITY_REVIEW"}
BF-02: package checklist reachable on proofRequired=false filing: {"declared":true,"total":1}
TRAP BF-02a OWNER-only signature decision: editor2 refused (expect 403): {"status":403,"type":"urn:mc:forbidden"}
BF-02: OWNER signature-applicability recorded: {"sigNotReq":true,"reason":"registry notice needs no signatures"}
BF-02: stage machine reachable, signature applicability honoured: {"stage":"PACKAGE_PREPARATION","next":["SIGNATURE"]}
GW03_DONE
