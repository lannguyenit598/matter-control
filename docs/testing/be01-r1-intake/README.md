# MC-BE-01-R1 intake evidence

See [intake and disposition](../../reviews/be01-r1-intake.md), `intake.json`, `source-manifest.json`, and `review-manifest.json`. `owner-evidence/*.gz` decompress byte-for-byte to retained owner payloads. `review-sources.tar.gz` is a gzip-compressed tar with only the45 manifest members; no credentials, binaries or databases. Read/archive inspection is sufficient for the initial independent review; do not execute embedded code.

`codex-recheck/` records the actual three-counterexample green recheck on unchanged source. Owner race passes are separately attributed. Commit and external dispatch have not occurred.
