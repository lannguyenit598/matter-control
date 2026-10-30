# MC-OPENCODE-ADR006-INDEPENDENT-TESTING-20261030

Bạn là **actual OpenCode — independent QA**, không phải implementation owner. Thực hiện kiểm thử thật cho MatterControl, không chỉ đọc source hoặc trích log tác giả. Không tự nhận mình là ZCode/Claude/Codex. Ghi actual CLI version/provider/model hiện tại; không đổi provider/model/login để chạy task này.

## 1. Assignment và source boundary

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; expected branch `codex/unified-project-flow`, preparation HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` + dirty source. Không dùng HEAD một mình làm candidate identity.

Đọc toàn bộ:

1. Root/component AGENTS, RTK, applicable test/security rules.
2. `docs/implementation/tasks/MC-OPENCODE-ADR006-INDEPENDENT-TESTING-20261030.md`.
3. `docs/testing/opencode-adr006-test-plan-20261030-r1/plan.md`, **cases.csv**, input-pins.json và preparation-manifest.json.
4. `docs/testing/codex-adr006-remediation-20261030-r1/{return.md,source-manifest.json,outputs-manifest.json,evidence-corrections.json}` và các evidence cần thiết.
5. `ops/adr006/README.md`, bff-state.sql; ADR-006; `docs/requirements/{golden-workflow-acceptance.md,permission-matrix.md,state-semantics.md,business-rules.md}` nếu đúng path hiện tại. Tìm canonical file thực, không đoán thêm source hay endpoint.
6. `docs/testing/zcode-implemented-system-review-20261030-r1/` — actual ZCode author-review, không phải independent OpenCode acceptance.
7. `MC-CLAUDE-ADR006-FINISH-TO-DEPLOY-CANDIDATE-20261030-PROMPT.md` cùng final return/source manifest của Claude **khi đã tồn tại thật**. Không suy luận prompt/IN_PROGRESS là final return.

Dùng Semble trước khám phá code và Context7 resolve→query khi cần framework/provider docs. Đọc source test/lifecycle trước chạy script.

Đây là local synthetic testing authority. Shared source read-only; Claude có thể đang sửa source. Bạn chỉ ghi QA output của mình và snapshot/fixtures của mình. Không chỉnh product source, historical reports/manifests, task owner của người khác hoặc formal51 INT-A ledger. Không commit/push/merge, gửi message task khác, deploy, đổi IAM/DNS/billing/IdP hay dùng real R2/provider credential.

Khai author overlap trước. Nếu đã đóng góp product code được test, ghi đúng AUTHOR_OVERLAP cho phạm vi đó; vẫn chạy test nhưng không cấp independent acceptance cho phần tự viết. Viết QA probes không biến bạn thành tác giả product code; các probes phải được giữ lại và mô tả rõ.

## 2. Bắt đầu ngay, không đợi toàn bộ Claude

**Stage A:** kiểm thử snapshot baseline/current source ổn định,45 BOTH cases. Không dừng ở static review hoặc inventory. Test browser được phép thì làm luôn; provider chưa authorized thì ghi riêng.

**Stage B:** sau khi có actual Claude final return, verify pins/delta và freeze final candidate mới. Chạy24 FINAL cases, impacted BOTH regressions và final full gates/integrated runtime. Nếu Claude chưa trả, hoàn tất A, trả `baseline-return.md` và checkpoint `PENDING_FINAL_RETURN` cho B; không ngồi poll hoặc xin tiếp tục từng test. Khi người dùng đưa final return, resume task này từ checkpoint.

Không dùng snapshot của A để chứng nhận source mới của B. Không tính “đã review author log” là “reviewer đã chạy”. Bổ sung findings thật với QA-NEW IDs nếu gặp lỗi ngoài82 case đã lên kế hoạch.

## 3. Freeze và tài nguyên được phép

- Rehash preparation pins và từng member của author manifests. Codex40 source pins chỉ là targeted subset; tạo **complete build/test snapshot manifest riêng**.
- Snapshot mới, mirror repo layout vào `/private/tmp/mc-opencode-adr006-<unique>/snapshot/`: đủ `apps/backend`, `apps/frontend`, `ops/adr006`, CI/config và canonical docs cần test. Manifest nguồn gồm relative path, bytes, SHA256. Không chỉ copy tracked HEAD, vì implementation có source untracked.
- Không copy `.env` private, keys, tokens, credentials, `.dev.vars`, node_modules, `.git`, `.next`, `.open-next`, `.wrangler`, security-hook state hoặc global agent dirs. `.env.example`/`.dev.vars.example` chỉ khi xác nhận placeholder. Không follow symlink ra ngoài snapshot; ghi exact exclusions/required missing inputs.
- Before/after pin live inputs khi copy. Nếu drift, list exact paths; recopy once khi có stable pins. Không repin PASS âm thầm; phần không freeze được là NEEDS_INPUT_REFRESH. Continue stable unaffected checks. Snapshot execution phải bất biến trừ declared QA probes và generated artifacts có inventory riêng.
- Dependencies dùng bản cài độc lập theo frozen lockfile trong snapshot. Không symlink node_modules về shared tree, không hardlink source có thể ghi. Được cài đúng dependencies đã pin khi tool/network policy cho phép; không upgrade, thêm blanket script approval, sửa global config hoặc dùng pnpm exec gây autoinstall ngoài kiểm soát. Dùng direct local executables/package scripts.
- Tạo PostgreSQL18.6 fixture mới với unique name/label owner=OpenCode/task, loopback port tự cấp, resource limit hợp lý và credential ngẫu nhiên private0700/0600. BFF tests hiện guard DB name `mc_fixture`; chuẩn bị đúng DB đó trong container mới. Go suite dùng đúng env **MC_TEST_DATABASE_URL**, FE PG suite **MC_BFF_TEST_DATABASE_URL**. Không nhầm TEST_DATABASE_URL/DATABASE_URL hoặc dùng database cũ.
- Role/restore tests dùng additional DB/schema/source/target do task này tạo trong fixture được xác minh. Không chạy B1 destructive fixture preamble lên DB retained/provider. Mỗi cleanup check exact container ID/name/label hoặc PID/start/cwd do bạn spawn; không prune hoặc kill theo port/name chung.
- Fake IdP/S3 emulator/filesystem objects chỉ synthetic, owned random loopback ports. Không đụng3000/8081, Codex stopped fixture/private credential directory hay app người dùng đang dùng. Nếu cần fixture cấp quyền/thêm A/B, provision mapping `(issuer,sub)` synthetic rõ ràng; không email auto-link.

## 4. Chạy test — commands và expected behaviors

Thực thi **từng row trong cases.csv**. Copy matrix vào QA output và fill status/observed/execution_ref; không sửa master. Tổng82 case:69 local (45 BOTH+24 FINAL),7 browser,6 provider.

Commands nền tảng, chạy trong **snapshot** sau khi private env/fixture đã setup:

```text
apps/backend:
  rtk proxy make check
  rtk proxy go test -race -count=1 -json ./...
  rtk proxy go test -race -count=1 -json ./internal/adapter/outbound/postgres -run TestAccessPathExplainVerification

apps/frontend:
  rtk proxy pnpm install --frozen-lockfile
  rtk proxy pnpm check
  rtk proxy node node_modules/vitest/vitest.mjs run src/lib/oidc/durable-state.test.ts src/features/data-transfer/durable-attempts.test.ts
  rtk proxy pnpm build:webpack
  rtk proxy pnpm build:worker
  rtk proxy pnpm build-storybook
```

Đây là command skeleton, không tự coi complete. EXPLAIN cần MC_EXPLAIN_VERIFY=1 và hai measured scales riêng; PG commands cần fixture env; capture stdout/stderr và exit tách biệt. Không in env/full DSN hoặc đưa secret vào argv/public logs. Default Turbopack cũng test khi môi trường hỗ trợ; compiler permission failure được ghi BLOCKED_ENV, không đổi thành code PASS. Selected Worker artifact vẫn cần actual preview, không chỉ build.

Không hardcode expected counts717/726 hoặc test count sau Claude. Parse tất cả Go JSON lines; ghi malformed line là lỗi evidence, không silently skip. Đếm test-level pass/fail/skip, package/build outcomes, exit riêng. Enumerate đúng skipped Test names. DB suite không chạy vì thiếu DSN không phải PASS; FAIL/build error exit1 không thể được0-fail count che đi.

Các test critical phải có reviewer execution/probe, không chỉ đọc test implementation:

- Service memory+PG cross-Matter receipt replay refused, same-scope replay works, revoke→hidden denial+audit with zero domain effect. HTTP fingerprint vẫn giữ.
- A/B isolation qua list/read/write/export/files; stale CAS, missing expected revision, last-owner guard.
- Actual least-privilege identities: positive product flow và negative DDL/escalation/append-only/cross-role. Nếu SQL final chưa có ở A, record pending B; khi B có phải thực thi, không chỉ inspect grant strings.
- Real synthetic IdP request counter:10 concurrent refresh requests từ2 FE/store instances chỉ1 actual refresh per generation; response loss/crash không resend rotating token; logout-versus-late-refresh không resurrect. Mock function count chỉ là unit proof, không tự đổi thành HTTP proof.
- PKCE state/cookie mismatch không đốt request hợp lệ; callback replay refused; restart trước callback và trước session read; idle/absolute/expired-access handling, corrupt sealed value/key rotation, storage failure fail-closed.
- Frozen pending import/bulk giữ nguyên keys/bytes, lease-expired explicit retry, stale dispatcher fence, terminal ACK, UNKNOWN retention, revoke/regrant purge và logout child fencing.
- **Near25MiB actual pending import on workerd** độc lập với streamed document upload. Đo memory/CPU/time với methodology. Nếu payload thuộc supported limit mà không chạy được, báo incompatibility, không tự giảm limit hoặc waive.
- Actual Worker runtime → Go/PG: entry/auth/CSS/Server Actions, origin refusal/zero writes, valid write/readback,1MiB/near25MiB upload/download SHA, abort/oversize/outage/UNKNOWN no-duplicate behavior.
- Golden workflows từ canonical acceptance: AC-161 transaction→closing/post-closing; AC-162 DD gap→independent resolution; AC-163 Filing hai supplement cycles→outcome. Persisted before/after/events/evidence/version readback; Action completion không auto-verify Requirement, receipt không thành approval. Fixtures không thực hiện payment/signature/legal submission thật.
- Final container with loaded SIGTERM drain; fresh source→target logical restore+objects/fresh-process semantic readback và corrupt/truncate/alter/delete negative controls. Không coi exit0 là đủ nếu checksum/census sai.
- Final CI activation và no-unexpected-skips parser: allowed exact named opt-ins, injected unexpected skip must fail. No wildcard toàn suite. Không trigger remote workflow/cloud build.

Reuse author verification programs trong `codex-adr006-remediation-20261030-r1/verification-programs/` sau đọc kỹ. Chúng hardcode **Codex source/output/private fixture paths**: **không chạy nguyên bản**. Adapt copy thành QA harness dùng snapshot/new resources/output của bạn, giữ original/adaptation diff. Bổ sung independent adversarial cases; không sửa source để làm test xanh. Nếu QA harness tự lỗi, giữ failed attempt, sửa harness bounded và rerun, không quy lỗi giả cho product.

## 5. Browser và cloud

Browser7 cases chỉ bằng công cụ browser được cấp. Dùng built local product, synthetic fixture; chưa được phép real IdP credential đọc thì dùng fake IdP. Login thật cần human tự nhập; không xin password/token/OTP. Kiểm chứng chữ Việt/layout/icon, search soft navigation, picker, creation dialog, Back link RV-001, keyboard/focus/reduced-motion, access-loss và UNKNOWN UI. Storybook HTTP200/unit tests không chứng minh rendered/a11y. Nếu browser chưa enabled, ghi exact tool error rồi tiếp tục HTTP/source tests, không bypass qua headless/server/OS capture.

Provider6 cases hiện **NOT_AUTHORIZED**, không thực hiện real network/account/resource/credential action để lấy PASS. Chỉ chuẩn bị commands/resource/preconditions/readback và names của missing inputs, không secret values. Sau một scoped authorization riêng mới chạy đúng Supabase/ZITADEL/Cloud Run/R2 resources được nêu. Local fake IdP/FS/S3 emulator không chứng minh provider, TLS, IAM, cost, residency hoặc managed restore.

## 6. Findings, status và evidence

Reviewer output duy nhất trong repo: `docs/testing/opencode-adr006-independent-testing-20261030-r1/`. Check absence; nếu own checkpoint đã có thì resume, nếu namespace thuộc người khác thì unique attempt dir, không overwrite. Không update canonical project gates/task trạng thái của tác giả.

Mỗi case: source/snapshot pin, argv/UI action, tool version, cwd, start/end UTC, exit/status, fixture identity, observed assertion, evidence ref, status và evidence class. Giữ raw evidence private trước sanitization; public logs không DSN/password/token/cookie/key hoặc synthetic private key. Known-secret scan in-memory của fixture của bạn; không đọc Codex credential để “scan hộ”.

Status: NOT_RUN/PASS/FAIL/BLOCKED_ENV/BLOCKED_INPUT/NOT_AUTHORIZED/NEEDS_INPUT_REFRESH. Evidence class: INDEPENDENT_EXECUTION/INDEPENDENT_STATIC_CHECK/AUTHOR_EVIDENCE_CITED. Trích author logs được nhưng không thay independent execution. Source finding có evidence tĩnh rõ vẫn actionable, không bịa runtime reproduction.

Finding: ID/severity/affected requirement, exact source lines/pins, expected vs actual, reproducible command/probe, impact, smallest correction owner, regression target. Không issue lại finding đã sửa chỉ vì đọc packet cũ. Preserve source-only versus runtime closure. P0/P1 leak/unsafe-secret/data-loss hoặc skipped required test→CHANGES_REQUIRED cho scope tương ứng.

Return phải có6 verdict riêng: SOURCE_SECURITY, LOCAL_RUNTIME, DATABASE_PRIVILEGES, BROWSER_UX_ACCESSIBILITY, RECOVERY, CLOUD_ACTIVATION. Gắn mỗi verdict với tested candidate; chỉ dùng PASS_WITH_LIMITATIONS/CHANGES_REQUIRED/INCOMPLETE/NOT_ASSESSED có căn cứ. Không cấp project DONE/production-ready/$0/DEPLOYED. READINESS_FOR_SCOPED_CLOUD_AUTHORIZATION cần đủ local critical evidence và một concrete remaining cloud plan; local tests không tự authorize deploy.

## 7. Deliverables và kết thúc

Ghi tối thiểu:

- identity.json, inputs.json và complete snapshot manifest.
- Filled cases.csv hoặc cases.json, tổng executed/pass/fail/blocked/not-run theo phase; IDs/expectations giữ nguyên.
- Command metadata + raw sanitized logs/test JSON; QA probes và adaptation diff; measurements.
- findings.json/md; source/snapshot drift report; privacy/cleanup receipt; output manifest không tự hash chính nó.
- baseline-return.md sau A và final-return.md/delta coverage sau B khi có final candidate; checkpoint nếu phải chờ actual Claude final.

Làm hết phần chạy được; failure không phải lý do dừng toàn matrix nếu không có rủi ro. Không re-run vô hạn; ghi root cause và tiếp tục independent cases. Nếu quyền/tool/network thật sự chặn, báo exact action/reason và phần đã hoàn tất, không lách bảo vệ.

Không gửi message cho Claude hoặc provider khác; trả findings qua output cho Codex intake. Kết thúc bằng exact next owner/action, skipped checks và remaining risk. **Bắt đầu freeze Stage A và chạy testing ngay; không trả chỉ một kế hoạch mới.**
