# External Origin / PostgreSQL Options — Additional Cost Evidence

Owner: Codex Cloud/DevOps. Checked 2026-10-24. Status: **RESEARCH_ONLY / NO_PROVIDER_SELECTED / NOT_DEPLOYED**. This follow-up was collected after the initial Claude and OpenCode packets; it is not part of those reviewed input manifests. It informs Claude ADR-001 H1 trade-offs only. Any origin outside Cloudflare is still a PO hosting-constraint exception; no account or service was created.

## Native origin evidence

[Render Free documentation](https://render.com/docs/free) explicitly excludes production use from its recommendation. Free web services sleep after 15 idle minutes, have ephemeral disk and share 750 running hours/workspace/month. Quota/traffic exhaustion can suspend services or produce charges if billing permits; external database/object-store traffic has an additional unquantified high-traffic suspension threshold. Its free PostgreSQL expires after 30 days and has no backups. Therefore Render Free plus its free database is not an evidenced durable production solution for approved legal workflows. It may inform a separately approved disposable validation environment, not a promised $0 MVP release. No such environment is selected here.

## PostgreSQL alternative evidence

[Neon pricing](https://neon.com/pricing) currently lists Free at $0 with 100 CU-hours/project/month and 1GB PostgreSQL storage/project. [Plan details](https://neon.com/docs/introduction/plans) add 5GB public transfer/project/month, mandatory idle scale-to-zero after five minutes, limited six-hour recovery history/size, one manual snapshot and no Free uptime SLA. Exhausting compute/transfer suspends compute; storage-growth operations fail at the cap without deleting data. These documented allowances do not prove pgx/Goose session/transaction behavior, latency, backup adequacy or a complete $0 system. Direct vs pooled migration connections, encryption/access and restore requirements need actual owner PoCs and policy acceptance.

## Decision implication

An external managed PostgreSQL option may preserve the PostgreSQL constraint, but it neither supplies the native Go HTTP origin nor resolves Cloudflare-only hosting, object storage, identity, backup costs or the approved operational invariants. H1 still needs a concrete eligible compute provider, quantified peak demand, data growth/retention, recovery objectives, total-service cost model and PO exception before deployment feasibility can pass. Neither vendor's newer auth/object/functions capabilities are silently adopted or used to replace Go/PostgreSQL/R2 choices.

All third-party plan figures are dated public documentation, not actual account entitlement, service reliability, compliance or cost measurements. No payment method, subscription, credentials or resources changed.
