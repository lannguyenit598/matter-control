# Primary-source notes for the narrow preflight correction

Verified by Codex2026-10-26; these are documentation checks, not runtime or architecture approval.

- PostgreSQL18 JSON Types§8.14: JSONB stores decomposed data and does not preserve input whitespace/object-key order. An immutable JSONB value alone is not an archive of original HTTP body bytes. Reference: https://www.postgresql.org/docs/18/datatype-json.html
- RFC9110§8.8.1: a strong validator must distinguish changes observable in selected representation data. A volatile metadata zone inside the JSON response body still participates in that representation. Reference: https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1

Source facts separately inspected: existing createdResultDTO has no schemaVersion; response storage is JSONB; native bindJSON distinguishes415 unsupported media type from400 syntax/type errors. Do not transfer native defaults or an unversioned persistence DTO directly into a new product wire contract.
