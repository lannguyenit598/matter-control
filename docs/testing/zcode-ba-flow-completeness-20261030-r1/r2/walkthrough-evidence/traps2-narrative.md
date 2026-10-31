### Bước D remaining traps: bulk partial failure, >200 pagination, export formula escaping, timezone round-trip, reconciliation.
D17 preview (3 rows): 
D17b viewer bulk commit denied: {"status":400,"type":"urn:mc:bad-request"}
D17 commit per-row result (expect 2 success + 1 stale): 
D17 failed row unchanged: {"title":"direct bump"}
D18 export row for formula-leading title: 01a192b4-a61c-749b-b7c1-6cb280569d7a,ACTION,'=1+2 cmd,'@SUM probe,,,NOT_STARTED,READY,,1
D21 dueAt +07:00 stored as instant (UTC readback): {"due":"2026-06-18T10:00:00Z","timing":"OVERDUE"}
F15 GET /operations unknown key → uniform 404: {"status":404,"type":"urn:mc:not-found"}
F15 reconciliation unknown key → uniform 404: {"status":404,"type":"urn:mc:not-found"}
D19 page1 count (expect 200): 200
D19 nextCursor present: yes
D19 page2 count (expect 205-200=5 + earlier items): 11
TRAPS2_DONE
