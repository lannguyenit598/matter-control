### GW-01 Transaction walkthrough — actors: ba-alice OWNER / ba-binh EDITOR+designated verifier / ba-editor2 EDITOR submitter / ba-cuc VIEWER / ba-dung non-member. All data synthetic (Atlas-flavored).
workspace: 01a192b1-948e-70b7-ba51-3d66970b8335
matter: 01a192b1-95b3-78fc-9e80-ce9b50a46112
TRAP non-member GET matter: {"status":404,"type":"urn:mc:not-found"}
TRAP non-member list requirements: {"status":404,"type":"urn:mc:not-found"}
requirement RQ1: 01a192b1-9731-735f-8149-1df75e8711f2
action AC1: 01a192b1-975d-768f-bdfb-d24e656ab194
AC1 after completion: {"exec":"COMPLETED","ver":null}
TRAP D1 requirement-after-action-completed (expect exec unchanged + UNVERIFIED): {"exec":"NOT_STARTED","ver":"UNVERIFIED"}
doc+versions: 01a192b1-9833-7ac9-ba6d-04d5182c8cd9 01a192b1-986d-72f5-9720-e58a8787cad4 01a192b1-98a1-7105-b2fc-226c525cf785
promotion v2 current: {"current":"01a192b1-98a1-7105-b2fc-226c525cf785"}
TRAP D4 partial-signature (claim pending, expect UNVERIFIED): {"ver":"UNVERIFIED"}
assessment rejected recorded: "REJECTED"
TRAP D4 after-rejection (expect UNVERIFIED): {"ver":"UNVERIFIED"}
assessment accepted recorded: 1
TRAP D4 after-full-signature-accept (expect VERIFIED): {"ver":"VERIFIED"}
TRAP D4a supersession-after-promotion (current-version claim invalidated, expect UNVERIFIED): {"ver":"UNVERIFIED"}
payment requirement verified: {"ver":"VERIFIED"}
milestone: 01a192b1-9ce1-7c87-8514-57b19e2e57be
edge A1->A2: {"result":"committed","path":null}
edge A2->A3: {"result":"committed","path":null}
TRAP D9 cycle A3->A1 (expect 409 cycle+path): {"result":"cycle","path":["01a192b1-9d5e-76d9-8233-afb3bfd134fc","01a192b1-9d86-7ef4-97ae-bd83b21da107","01a192b1-9db1-70bf-9d4e-9acea2535b2f"]}
TRAP D10 complete-while-blocked (expect 409 dependency-blocked): {"result":"dependency-blocked","gates":[{"edgeId":"01a192b1-9df6-73e8-96a6-95966eb28062","sourceId":"01a192b1-9d5e-76d9-8233-afb3bfd134fc","gate":"COMPLETION","code":"NOT_COMPLETED"}]}
TRAP D11 dependent-after-cancel (expect BLOCKED): {"dep":"BLOCKED","reasons":[null]}
TRAP D11 dependent-completion (expect 409 dependency-blocked): {"result":"dependency-blocked","gates":[{"edgeId":"01a192b1-9f3e-7a41-bb9b-3bc728567501","sourceId":"01a192b1-9ed6-75a5-a280-deed31b5ca8a","gate":"PROOF","code":"CANCELLED"}]}
TRAP viewer-patch (expect 403/404, no mutation): {"status":403,"type":"urn:mc:forbidden"}
TRAP viewer-execution: {"status":403,"type":"urn:mc:forbidden"}
TRAP viewer-submit-evidence: {"status":400,"type":"urn:mc:bad-request"}
viewer-export-allowed (expect 200): 200
viewer-control-room-allowed (expect 200): 200
TRAP D15 stale-second-writer (expect 412): {"status":412,"type":"urn:mc:precondition-failed"}
TRAP D15 item-after-conflict (first write stands): {"title":"first writer","rev":2}
TRAP D13 same-key-replay: 01a192b1-a13f-7868-b439-9af8848783c8 replayed=true count=1
export-axes (header row): 01a192b1-9731-735f-8149-1df75e8711f2,REQUIREMENT,Internal approval recorded,Board approval minute on file,,,NOT_STARTED,READY,UNVERIFIED,1
GW01_DONE
