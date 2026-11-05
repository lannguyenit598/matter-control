# MC-CODEX-MANUAL-START-20261103 — local manual environment

Actual Local Codex. Direct PO request to start local manual testing supersedes the earlier pause for this named local runtime only. Branch codex/unified-project-flow, HEAD7bf198c plus current RLF dirty candidate. No implementation or Pre-flight code was changed.

Frontend http://localhost:3000/login, backend127.0.0.1:8081. Built from a frozen isolated970-file source copy, with already installed dependency bytes cloned (no install/relink). Backend build exit0; fresh Webpack production build plus compiled-CSS guard exit0. This start task did not rerun all tests or certify the author-adjacent review as independent.

Database: started exact retained container mc-codex-manual-20261101 (c39f6a925c9a…); backed up source mc_manual and restored into a new DB mc_manual_20261103_wsc760me before applying migrations12–16 only to the copy. Original database stays at schema11 with unchanged5workspaces/6matters/4users/2document-version records. New runtime has the same counts, schema16 and7new feature tables. DB backup/config/runtime logs remain private0600 in the task directory. No existing DB/volume was deleted. This local development connection is not deployed least-privilege verification.

Auth: reused the existing approved ZITADEL Cloud profile, strict configured audience/app identity and PKCE S256 callback http://localhost:3000/api/auth/callback. The API key is referenced at its original0600 path; no key copy/hash/content exported. Health/ready/login/session return200; root307→/my-actions; unauthenticated and synthetic invalid-token API return401; login redirect has expected Cloud origin, S256, state and nonce. No token/cookie/auth-code value recorded. The operator must sign in again; no human credential was entered by Codex.

Official in-app browser opened and observed the public login page; its tab is retained for the user. Screenshot login.jpg is public sign-in UI only. No authenticated user journey has been executed by this start task.

Known limits: RLF new features remain pending independent review and its author-adjacent findings remain open. Pre-flight remains queued, not implemented. Historical document bytes stored under now-missing temporary directories were not invented or replaced; new uploads use the new private object directory, historical download recovery is not established. The runtime uses a copied manual DB, so writes made while testing live in that new DB; the original remains unchanged.

Owned process IDs/cwd/binary and source pins: runtime-ready.json/source-capture.json. Private startup configuration/dump/logs location is recorded as metadata only. Stop only these exact verified FE/BE processes and the identified DB container when requested; no unrelated fixture, IdP or service was started.

Skipped: full regression, independent review, real authenticated workflow, browser/a11y/business acceptance, cloud mutation, production release and source commit/push. This is LOCAL_MANUAL_READY_WITH_LIMITATIONS, not P0/MC-002 DONE.
