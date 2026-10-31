### GW-02 Due Diligence walkthrough — same workspace, second matter. ba-alice OWNER / ba-binh EDITOR+verifier / ba-editor2 EDITOR submitter / ba-cuc VIEWER-of-matter-1-only / ba-dung workspace member, no matter membership
matter2: 01a192b1-a228-7de2-91a6-9a45195b4594
TRAP AC-118 cuc (matter1-only member) reads matter2: {"status":404,"type":"urn:mc:not-found"}
TRAP AC-118 dung has explicit VIEWER on matter2 — reads OK: {"title":"Not Found","callerRole":null}
BF-08 discovery as alice (both matters): ["BA-DD Matter","Project Atlas — BA Review"]
2
BF-08 discovery as cuc (matter1 only): ["Project Atlas — BA Review"]
1
BF-08 discovery as dung (matter2 only): []
0
GW-02 review requirement verified: {"ver":"VERIFIED"}
TRAP D2 submitter-self-verify (expect 409): {"status":409,"type":"urn:mc:rejected","code":"not-verifier"}
TRAP D2b undesignated-owner-or-viewer cannot verify: {"status":404}
D2 verifier (binh, non-submitter) accepts: {"ver":"VERIFIED"}
dispute raised by editor2 on accepted proof: {"status":null,"type":null,"code":null,"disputeId":null}
subject DISPUTED: {"ver":"DISPUTED"}
raiser cannot resolve own dispute (expect 409): {"status":409,"type":"urn:mc:rejected","code":"not-verifier"}
verifier resolves dispute: {"status":null,"type":null,"code":null}
subject after resolution (recomputed, not restored): {"ver":"VERIFIED"}
D2c after rejected evidence (still has accepted CERT-1 → PARTIALLY/VERIFIED unchanged): {"ver":"VERIFIED"}
party: 01a192b1-a876-7693-8e24-068c7c53ad79
AC-104 WAITING with no dependency → dependency stays READY: {"exec":"WAITING","dep":"READY"}
waiting-on view: {"item":{"id":"01a192b1-a89e-7e7e-a495-cfa6755feb70","kind":"ACTION","matterId":"01a192b1-a228-7de2-91a6-9a45195b4594","title":"Follow up provider certificate","outcome":"certificate received","execution":"WAITING","dependency":"READY","dependencyReasons":[],"proofRequired":false,"verification":null,"verificationApplicability":null,"applicabilityReason":null,"proofEpoch":0,"workstreamId":null,"ownerId":"507a7b15-84c1-465c-98df-cf49ed88649e","dueAt":null,"completedAt":null,"cancelledAt":null,"waitingPartyId":"01a192b1-a876-7693-8e24-068c7c53ad79","waitingCondition":"certificate delivery","escalation":null,"revision":3},"derived":{"timing":"ON_TRACK","noDueDate":true,"attention":"ATTENTION","attentionReasons":["WAITING"],"criticalChain":false},"etag":"\"4f813f912b0cf240d160b14dbf3f5d020030e1fa14f73e0d771d487a97db30e4\""}
TRAP D3 sole evidence expired → aggregate must NOT be VERIFIED (AC-126): {"ver":"UNVERIFIED"}
D3 criterion view: [{"satisfied":false,"reason":"MISSING"}]
BF-05 verifier queue (binh sees pending): {"n":1,"first":[{"subjectTitle":null,"criterionTitle":null,"reason":"PENDING_REVIEW"}]}
BF-05 submitter queue empty (editor2): {"n":0}
BF-05 viewer queue empty (cuc — not even a matter2 member): {"n":0}
BF-05 queue after acceptance (empty): {"n":0}
GW02_DONE
