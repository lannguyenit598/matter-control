# MC-CLAUDE-ADR006-FINISH-TO-DEPLOY-CANDIDATE-20261030

Bạn là **actual Claude Code**, tiếp quản phần hoàn thiện readiness cho MatterControl. Thực hiện một assignment liên tục: intake → sửa các gap còn thật → hoàn thiện SQL/config/CI → kiểm thử local end-to-end → đóng gói candidate và một yêu cầu cloud authorization duy nhất. Không chỉ trả plan; không dừng xin “tiếp tục” sau từng phần; không restart W0–W7 hoặc làm lại implementation đã có.

Mục tiêu là một **synthetic pilot deploy candidate** theo ADR-006: Next.js/BFF trên Workers, Go trên Cloud Run Singapore, PostgreSQL Supabase Singapore, private R2, ZITADEL hiện có. Đây chưa phải production/legal-data release.

## 1. Quyền và writer

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch kỳ vọng `codex/unified-project-flow`. HEAD quan sát gần nhất `20feedbf06c859a9806055d609f5b132fe8bb086`, kèm rất nhiều source dirty/untracked hợp lệ; HEAD không định danh đủ candidate.

Codex đã hoàn tất lượt remediation trước và bàn giao source của lượt đó cho assignment này. Giữ mọi thay đổi, tác giả và evidence trước. Nếu bạn đang chạy `MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030`, consume prompt này như phần ưu tiên của cùng phiên, không tạo writer thứ hai hoặc bỏ công việc đã làm. Các profile Firebase/Compute Engine của assignment khác không phải điều kiện để hoàn thành pilot ADR-006; không chuyển topology để né lỗi Worker.

Được phép: sửa source/config/tests/SQL triển khai/runbook trong repo, dùng bản sao cô lập, dependencies cần thiết tối thiểu, fixture Docker/PostgreSQL mới có nhãn riêng và synthetic IdP/object storage. Đọc AGENTS/component rules, RTK; Semble trước khám phá; Context7 resolve→query khi dùng tài liệu framework/provider; xác minh API/flag từ tài liệu/source thật.

Không được: reset/stash/clean/ghi đè dirty work; commit/push/merge; tự deploy, bật billing, thay IAM/DNS/IdP, dùng bucket thật hoặc migrate DB retained/provider; đọc/xuất credential ngoài phạm vi được giao; sửa hook/security ledger hoặc né approval. Không dừng tất cả ứng dụng chỉ vì process còn sống. Nếu có writer cạnh tranh thật, nêu chính xác file/task đang xung đột rồi tiếp tục phần không xung đột.

## 2. Input bắt buộc và disposition hiện tại

Đọc:

- Root/component AGENTS, current workflow, project-status, current task/workboard.
- ADR-004/005 với approval/supersession; ADR-006 là topology hiện hành.
- `docs/testing/zcode-implemented-system-review-20261030-r1/`: return, findings, remediation-handoff, manifests. Packet tự khai actual ZCode/author-review; không tự đổi thành OpenCode independent PASS.
- `docs/testing/codex-adr006-remediation-20261030-r1/`: return.md, source-manifest.json, outputs-manifest.json, evidence-corrections.json, các gate và Worker logs/meta.
- `ops/adr006/README.md`, `ops/adr006/bff-state.sql`, Worker build/config, durable-state/session/pending-attempt source và callers.
- `docs/testing/zcode-adr006-cloud-readiness-20261030-r1/`: cloud-validation-approval-packet, readiness/security matrix, B1/B2 proposals.
- `docs/deployment/zitadel-supabase-operator-setup-20261030.md` và `docs/deployment/free-phase-deploy-checklist.md` — có đoạn lịch sử đã cũ, không chạy theo nguyên xi.
- `.github/workflows/backend.yml`, frontend.yml; Dockerfile và deployment artifacts hiện có.

Rehash current bytes trước khi kết luận. Codex đã xác minh40 source pins không drift ở thời điểm bàn giao; nếu sau đó đổi, intake delta và test liên quan, không rollback để khớp manifest cũ.

| Finding/gap | Baseline bàn giao — phải verify rồi reuse |
| --- | --- |
| R-01 root redirect | Đã sửa `/`→`/workspaces`, regression + actual Worker HTTP PASS. |
| R-02 cross-Matter receipt | Đã sửa service scope/current authority, hidden-denial audit; permanent memory+PG contract tests. Giữ HTTP fingerprint và same-scope replay. |
| R-03 TTL | Default source vẫn15s; ADR-004 đã phê duyệt30s. Khôi phục default30s và test. Đây là đưa code về approval đã có, không xin PO chọn lại15/30. Giữ explicit0s của local/test khi có chủ đích, không đồng nhất introspection cache với JWKS cache. |
| R-04 hygiene | Codex đã sửa gofmt và error wrapping; make check đã qua. Không làm lại nếu bytes hiện tại giữ nguyên. |
| R-05 receipt lỗi | Failed original giữ nguyên; Codex có full fresh Go/PG JSON717PASS/0FAIL/6SKIP và idle-expiry regression. Link evidence mới, không sửa/xóa failed artifact hoặc dựng lại lịch sử. |
| R-06 pointer | Cập nhật controlling checklist/citation bằng addendum hoặc supersession; không rewrite frozen historical packet/manifests. |
| R-07 design primitive | Path thật là `src/features/review/components/review-filters.tsx` (review số ít). Source hiện raw button là Search; đừng sửa theo mô tả “unread” sai. Reuse Button/form pattern và giữ URL semantics, keyboard, localization, không hard navigation nếu house pattern đã hỗ trợ soft navigation. |
| R-08 Storybook | Build mới đã PASS; runtime/browser story chưa được chứng minh. Kiểm tra gap thật, không reset deps vì kết luận cũ. |
| R-09 indexes |0009 còn proposal, có counter-evidence scale1. Không bắt buộc apply để pilot chạy; đo trên representative load, không tự apply schema proposal chưa được duyệt. |
| Worker/BFF | Đã implement OpenNext1.20.14 + Wrangler4.156.0 + pg8.23.1; encrypted PG PKCE/session/attempts.14 PG tests,17 Worker HTTP probes PASS. Không còn Map-only hay adapter PREPARED_ONLY. |

Codex final gates: BE717PASS/6SKIP; FE726PASS/12SKIP + check/Webpack/CSS/Storybook; frozen lockfile/peers/audit PASS. Worker build từ exact public-source isolated copy PASS. Đây là author verification, không independent/cloud acceptance.

## 3. Hoàn thiện các gap deploy thật

Lập checklist có owner, dependency, test, artifact và phân loại: CODE_REQUIRED, LOCAL_VERIFY, PROVIDER_VERIFY, PO_DECISION, OPTIONAL_AFTER_PILOT. Sau khi lưu checklist, triển khai liên tục các CODE_REQUIRED/LOCAL_VERIFY. Không biến toàn bộ B1–B9 thành backlog vô hạn và cũng không tự waive security.

### A. SQL triển khai và least privilege

- Chuyển B1 từ test-only thành SQL/bootstrap deploy reviewable, không chứa DROP OWNED/DROP SCHEMA CASCADE/DROP ROLE hay fixture cleanup. Không chạy fixture test script như bootstrap managed DB.
- Tách owner NOLOGIN, migration identity, Go runtime và BFF identity. Chốt schema/search_path theo source thật; không relocate schema chỉ để giống tài liệu nếu làm tăng scope.
- Go runtime không owner/superuser/CREATEDB/CREATEROLE/BYPASSRLS/schema CREATE; chỉ table-specific privileges cần thiết; append-only tables không UPDATE/DELETE/TRUNCATE. Xử lý sequences/functions/migration ledger/default privileges đúng ownership.
- BFF chỉ dùng `mc_bff.state`; không đọc product tables. Migration credentials không cấp cho serving revision. Provision `(issuer,sub)` riêng qua operator path, không auto-link email hoặc tự cấp OWNER cho người login bất kỳ.
- Dùng runtime/migrator/BFF roles thật trong fresh local PG để chạy positive flow và negative DDL/append-only/cross-role tests; không chỉ dùng superuser rồi kiểm tra pg_roles. Test schema bootstrap chạy lại an toàn; không cần provider credential để viết và verify SQL local.
- Remote TLS verify-full + CA; session-compatible connection, advisory locks/prepared statements. Tính tổng PG connections gồm Go replicas, rolling revisions, BFF concurrent requests, migrator/ops; BFF hiện connection-per-transaction nên Go pool math một mình không đủ. Đề xuất một bound cụ thể cho pilot với dữ liệu đo; không tự hứa free-plan fit.
- Data API restrictions và negative request là provider step sau authorization. Không đưa Supabase service-role key vào FE.

### B. Worker state, resource limits và secret/origin boundary

- Giữ native Socket fix, encryption key versioning, expiry/logout fencing, single-winner refresh, UNKNOWN và same-key recovery. Chạy tests trên production-wired callers, không SQL semantics reference một mình.
- Worker profile tắt cacheComponents/partialPrefetching do authenticated SSR hang; Node profile giữ nguyên. Đánh giá đây là workaround bounded và ghi candidate architecture delta; không tự bật lại vì build thành công.
- Pending import hiện encrypted inline PG capped36MiB, khác proposal R2 ref. Đo real workerd memory/CPU/timeout cho near25MiB **pending import** và explicit retry/recovery. Document upload streaming17-probe không chứng minh large-import path.
- Nếu workload vượt giới hạn mục tiêu: sửa tối thiểu ở host/storage boundary để hỗ trợ đúng payload được duyệt, ví dụ private encrypted payload reference với ownership/expiry/integrity/revocation checks; không chuyển tokens ra browser, không âm thầm hạ25MiB hoặc bỏ import. Chuẩn bị local substitute + tests trước; real R2 và policy trade-off vẫn scope cloud riêng.
- Physical expired-state cleanup: có operator/job bounded, idempotent, keyset/batch limit, dry-run, lock/role boundary và active-session/UNKNOWN retention semantics rõ. Không bỏ receipt DELETE trigger để “purge cho chạy”. B7 receipt retention chưa chốt thì đưa số/semantics vào một PO decision packet, không tự purge. Phân biệt BFF expired state và business receipts.
- Xác minh runtime secret bindings thật → app config; build không cần private .env/key. Quét bundle/client chunks/logs theo known synthetic secrets, không chỉ quét source. Worker Free bundle/CPU evidence phải đo từ artifact/runtime có phương pháp, không chỉ gzip một file.
- Test cùng origin Server Actions/CSRF/cookies, token bearer đúng user, account A/B và revoke trong hai FE instances. Không chứng nhận public TLS/real ZITADEL từ fake IdP.

### C. Deployment descriptors và CI

- Một supported entrypoint cho preflight/validate/build/package, và một deployment plan liệt kê exact commands theo resource/secret references. validate/build không tự gọi deploy hay chọn account.
- Reuse Go image nonroot, health/readiness/PORT, max-concurrency/timeouts và separate migration job; verify bounded loaded SIGTERM drain, filesystem backend refusal trên cloud, transfer1MiB/near25MiB và timeout/UNKNOWN.
- Worker→Cloud Run invocation: chốt cả transport auth và per-user auth. Private Cloud Run cần đường Google identity hợp lệ mà không làm mất user's Authorization. Không giả định Worker gọi được internal ingress hoặc dùng static SA key mới. Public invocation là security decision phải trình một phương án cụ thể để PO duyệt, không tự grant allUsers.
- Thêm Worker build và durable BFF PostgreSQL tests vào CI với fresh fixture đúng guard `mc_fixture`, secrets synthetic, artifact retention. Không để14 PG cases skip mà CI vẫn gắn nhãn durable PASS.
- Backend current no-unexpected-skips allowlist thiếu `TestContract_R2_RealBucket` và `TestAccessPathExplainVerification`; xử lý bằng exact named opt-in skips có lý do hoặc job riêng, không bỏ skip gate/mở wildcard. Existing memory-only rollback skip cũng phải narrow đúng subtest, không blanket toàn W6 suite.
- Release check bảo đảm source/config/migration/image/Worker artifact cùng candidate identity. Không deploy từ dirty HEAD mà bỏ untracked source; tạo source+artifact manifest và hướng dẫn release commit sau approval, không commit hộ khi chưa được yêu cầu.
- Thay checklist hiện hành đang còn Cloud Run FE/Map-only/`*.run.app`/restart mất session bằng runbook ADR-006 hiện tại. Giữ archive/provenance, không dùng lịch sử để điều khiển deploy mới.

### D. B1–B9 và môi trường cloud

Disposition từng B1–B9 bằng scope pilot: B1 quyền DB thật; B2 optional measured migration; B3 actor/IP rate control và max-in-flight khác nhau; B4 managed TLS/private transport; B5 provider at-rest thực; B6 IdP MFA/recovery policy; B7 retention; B8 rotate/revoke runbook; B9 minimum actionable monitoring. Không xây thêm service mesh/EDR/platform mới chỉ để “đủ checklist”.

Rate-limit actor phải lấy identity đã verify; IP chỉ dùng trusted proxy chain cụ thể, không tin arbitrary X-Forwarded-For. Nếu backend public có đường bypass edge thì edge-only limiter không bảo vệ đường đó. Chọn bounded implementation/config tối thiểu cho pilot, có negative test và trình numeric/policy decision cần thiết; không tự activate policy cloud.

Chuẩn bị nonsecret input inventory từ files/operator guide đã có. Không xin lại issuer/client/project IDs đã được cung cấp nếu vẫn dùng environment đó; mark live-readback-needed. Chỉ hỏi một lần các giá trị thực sự thiếu: Cloudflare account/Worker origin/R2 bucket và secret refs; GCP project/region/registry/deployer/service identities/invocation choice; Supabase ref/hosts/CA/role refs; ZITADEL exact callbacks/API key secret ref/A-B setup status; owner/cost/residency decisions. Không yêu cầu gửi token/password/fullDSN/private key vào chat.

## 4. Kiểm thử và bằng chứng cuối

Chạy applicable backend check/sqlc/race trên fresh PG với exact role tests, FE check/CSS/Webpack/Worker build/Storybook và local end-to-end. Reuse existing17-probe chương trình khi phù hợp nhưng làm portable paths/fixture inputs, capture argv/cwd/tool versions/UTC/exit. Không copy private .env/key hoặc dùng symlink node_modules trỏ về shared tree khi cài dependency.

Test login→authenticated Workspace/Matter→create/readback→document upload/download→restart→recovery→logout với synthetic A/B; cross-Matter/user denial, idle/absolute expiry, refresh concurrency/crash/UNKNOWN, role denial, missing dependency/storage failure. UI browser nếu tool được cấp thì chạy; nếu không, record đúng giới hạn và chạy HTTP layer còn lại, không bypass permission. Storybook build không phải rendered acceptance.

Lưu red/green và failed attempts. Mỗi failure phải có root cause/bounded correction rồi rerun phần ảnh hưởng; không rerun vô hạn hoặc nới assertion để đạt xanh. Quét secret evidence trước bàn giao. Pin final source và artifact, final drift check; stop/retain chỉ tài nguyên test do task sở hữu.

## 5. Cách hoàn thành mà không stuck

Không dừng vì chưa có cloud secrets: hoàn tất SQL, artifacts, CI, local tests và dry-run plan bằng placeholders/synthetic trước. Không gọi lỗi môi trường hoặc thiếu provider authorization là product FAIL. Không xin approval lại cho30s đã duyệt, source đã sửa hay topology đã chọn.

Nếu network/tool permission bị từ chối, dùng cách kiểm chứng khác vẫn được phép; báo exact failed action/reason, tiếp tục phần không phụ thuộc. Không lách bảo vệ hoặc tự mạo danh independent reviewer. Những gì bạn sửa là AUTHOR_VERIFICATION; chuẩn bị một pinned independent review packet, không tự gửi provider hoặc tự cấp PASS cho mình.

Sau khi toàn bộ phần local đã hoàn thành, trả **một** `cloud-activation-packet.md` gồm candidate pins, exact resources/commands/IAM/origins/migrations/secret references, bounded synthetic workload, cost exposure, rollback và readback/negative tests. Tách:

1. READY_FOR_REVIEW: source/artifacts local đã thực thi.
2. READY_FOR_SCOPED_CLOUD_AUTHORIZATION: exact provider actions đã cụ thể, đang chờ quyền/operator inputs nào.
3. VERIFIED_ON_PROVIDER: chỉ sau lần chạy cloud được phê duyệt và có evidence thực tế.

Không yêu cầu phải deploy xong mới được xin quyền deploy. Không coi prompt này là quyền tạo resource/đổi billing/IAM/IdP. Khi mọi work có thể thực hiện đã xong, dừng ở **một operator handoff cụ thể**, không mở thêm nhiều vòng planning. Báo ngắn gọn thông tin cần PO điền và lệnh tiếp theo, không chỉ “blocked”.

## 6. Deliverables

Tạo/resume task `docs/implementation/tasks/MC-CLAUDE-ADR006-FINISH-TO-DEPLOY-CANDIDATE-20261030.md`; giữ requirement IDs/owner/priority/scope/dependencies/inputs/outputs/AC/tests/reviewer. Output namespace `docs/testing/claude-adr006-deploy-candidate-20261030-r1/`; nếu đã có, đọc checkpoint/resume hoặc tạo attempt con, không overwrite output người khác.

Phải có: consolidated findings disposition R-01..09 + B1..B9; actual source/config/SQL/CI changes; local command logs/results; source+artifact manifests; environment/secret-reference inventory; current pilot deployment + rollback + cleanup runbook; one independent-review packet; one cloud-activation packet; final return và exact next action. Có thể gom tài liệu liên quan để tránh proliferation.

Final return phải nói rõ: cái gì đã sửa; cái gì đã chạy trên final bytes; cái gì chỉ cited; remaining actual blockers và ai giải quyết; local candidate có đủ để xin cloud activation chưa. Không viết DONE/DEPLOYED/$0/production-ready khi chưa có đúng approval/evidence. Kết thúc bằng skipped checks và remaining risk.

**Bắt đầu intake ngay, rồi tiếp tục implementation và verification trong cùng assignment cho đến khi có candidate deploy reviewable hoặc chỉ còn đúng external prerequisite không thể tự thực hiện.**
