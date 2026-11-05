# Erratum — `caddy validate` evidence description (PI-04)

Date: 2026-10-31. Author: actual ZCode, task `MC-ZCODE-DEPLOY-READINESS-FINISH-20261030` (WP-8),
per the bounded intake finding PI-04 in `docs/testing/codex-claude-portability-intake-20261030-r1/return.md`.
Historical receipts in this directory are NOT modified.

## Adjudication

The retained receipt `receipts/yaml-caddy-validate.out` records, at line 18, the executed check:

```json
"caddy_validate": "Valid configuration\n"
```

The check table in `return.md` (lines 61–62) therefore describes the evidence correctly: the
rendered `Caddyfile` was validated by `caddy validate` (caddy 2.11.7-alpine, `--network none`) and
returned `Valid configuration`.

The erratum is confined to one sentence in the NOT_RUN paragraph of `return.md` (line 73), which
lists "`caddy validate` not run". That clause is wrong as written for `caddy validate` — the check
DID run and passed, per the retained receipt. The same sentence's remaining NOT_RUN items are
unaffected and stay open: Caddy TLS issuance, firewall, systemd/COS supervision, reboots and
journald retention were never exercised (no VM).

## Scope of this erratum

- Only the evidence DESCRIPTION is corrected. No rendered template, source file, or receipt is changed.
- `caddy validate` proves configuration syntax only; it is not TLS issuance, network, or runtime evidence.
- The retained receipt file is the source of record for what ran.
