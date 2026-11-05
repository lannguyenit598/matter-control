# PO self-service guide — tạo tài nguyên cloud cho pilot (MC-PO-DEPLOY-EXECUTION-20261104)

- Dành cho: PO tự tạo tài nguyên trên console (theo "ok cloud để tôi tự làm", 2026-11-05).
- Nguồn sự thật: runbook đã pin `docs/deployment/pilot-deploy-runbook.md` (branch
  `codex/pilot-deploy-readiness-20261103`, diff `20d02870…`) — guide này KHÔNG thay runbook;
  nó chỉ map từng bước console → đúng tên/giá trị mà runbook và Phase 0 record yêu cầu.
- Trạng thái đã có sẵn: GCP project `mattercontrol-pilot` (số 258638029370) đã tạo · wrangler
  đã login (account `049fa5237a6a7f0a6659d009af1189c1`) · `aws`/`supabase` CLI đã cài ·
  `~/.mc-pilot/env.sh` đã tạo (đã fill `GCP_PROJECT`, `R2_ACCOUNT`).

## Quy ước

- 🔐 = lưu vào **password manager** (duy nhất); KHÔNG bao giờ dán vào chat, env.sh, git, log.
- ✍️ = tự sửa vào `~/.mc-pilot/env.sh`; ✉️ = nhắn tôi một câu ("xong bước X, giá trị là …").
- Kênh secret cục bộ cho tôi dùng (tôi không bao giờ in nội dung): `~/.pgpass` (0600, Supabase),
  `~/.mc-pilot/r2-credentials.env` (0600, R2 token), `~/.mc-pilot/zitadel-pat` (0600, ZITADEL).
- UI console đổi tên menu theo thời điểm — tìm theo **chức năng/tên trong ngoặc**; nếu lệch,
  chụp màn hình gửi tôi, tôi đối chiếu runbook.
- Không destructive (drop project/bucket/instance) — PD-7: chỉ forward-fix; cần drop thì phải
  có approval riêng của PO nêu đúng resource. Không upgrade plan (PD-1/PD-2 = Free).

---

## Bước 1 — GCP: link billing (~5 phút) → mở khóa P4

1. Vào `console.cloud.google.com` → chọn project **`mattercontrol-pilot`** → **Billing** →
   **Link a billing account** → chọn **`011DAF-C42C97-F11242`**.
   (Đường khác: `console.cloud.google.com/billing` → mở account `011DAF-…` → tab quản lý
   project/Account management → **Link/Attach project** → nhập `mattercontrol-pilot`.)
2. Verify: project Billing page hiện **billingEnabled: true** (hoặc nhắn tôi — tôi chạy
   `gcloud billing projects describe`).
3. ✉️ Báo tôi. **Phần còn lại của P4 là của tôi (CLI):** enable APIs cần thiết, Artifact
   Registry `mattercontrol` (asia-southeast1), 2 service account `mcapi-run`/`mcapi-migrate`
   (PI-02), probe org-policy `run.managed.requireInvokerIam`, **budget alerts 1/5/10 USD**
   (D2 — alert only, KHÔNG hard cap).
4. ⚠️ Nếu account công ty (`v-lannguyen@infinitepl.com`) mới có quyền trên billing account:
   cách B — `gcloud auth login` bằng account đó rồi nhắn tôi, tôi chạy lại đúng 1 lệnh link.

## Bước 2 — Cloudflare: subdomain + R2 (~10 phút) → mở khóa P3

1. **workers.dev subdomain**: dash.cloudflare.com → **Workers & Pages** → Overview → panel
   phải (**Subdomain**). Nếu chưa từng set, hệ thống sẽ đề nghị chọn khi tạo worker đầu tiên —
   hãy set trước. ✍️ `CF_SUBDOMAIN`.
2. **R2 bucket**: **R2** → *Create bucket* → tên ĐÚNG **`mattercontrol-pilot-objects`** →
   location hint **APAC** (PD-6) → Storage class Standard → **KHÔNG bật public access**
   (bucket phải private — P3 sẽ verify).
3. **Bucket-scoped token**: **R2** → *Manage R2 API Tokens* → *Create API Token* →
   quyền **Object Read & Write** → *Specify bucket(s)* → CHỈ bucket trên → tạo xong hệ thống
   hiện **Access Key ID + Secret Access Key + endpoint** `https://<account_id>.r2.cloudflarestorage.com`
   → 🔐 lưu NGAY (Secret chỉ hiện một lần). Đồng thời ghi vào
   `~/.mc-pilot/r2-credentials.env` (0600) theo mẫu:
   `AWS_ACCESS_KEY_ID=…` / `AWS_SECRET_ACCESS_KEY=…` / `R2_ENDPOINT=https://…` — tôi sẽ
   source file này cho kiểm tra bucket, không in ra log.
4. ✉️ Báo subdomain + tên bucket. Khi có subdomain, tôi fill luôn
   `APP_ORIGIN=https://mattercontrol-pilot.<CF_SUBDOMAIN>.workers.dev` — giá trị này nuôi P5.

## Bước 3 — Supabase: project Singapore (~10 phút) → mở khóa P2 + §3 DB bring-up (W1/W2)

1. supabase.com → organization của bạn → *New project* → tên gợi ý `mattercontrol-pilot`
   (ref mới là thứ quan trọng) → Region **Singapore / ap-southeast-1** → plan **Free** (PD-1).
2. **Database password**: bấm *Generate* hoặc tự chạy `openssl rand -hex 24` → 🔐 lưu password
   manager TRƯỚC khi bấm continue (Supabase chỉ hiện một lần).
3. Project provisioned xong → **Project Settings → Database**:
   - **Project ref** (chuỗi `xxxx…`) → ✍️ `SB_REF`;
   - Connection string → **Session pooler**: host `<ref>.pooler.supabase.com`, port **5432**,
     user `postgres.<ref>` → ✍️ `SB_POOLER=<ref>.pooler.supabase.com`;
   - **SSL Configuration** → *Download CA certificate* → lưu `~/.mc-pilot/sb-ca.crt`
     (chmod 644 — CA là dữ liệu công khai, không phải secret).
4. **`~/.pgpass`** (tạo nếu chưa có, chmod 600) — thêm dòng:
   `<ref>.pooler.supabase.com:5432:postgres:postgres.<ref>:<PASSWORD_TỪ_PASSWORD_MANAGER>`
5. ✉️ Báo ref + pooler. **Tôi sẽ chạy:** P2.1 probes (PG ≥ 16, ICU, quyền admin), §3 DB
   bring-up đúng thứ tự (bootstrap → hex passwords → migrate as mc_migrator không DSN
   search_path → runtime grants → bff-state + ownership → bff grants) với ON_ERROR_STOP=1,
   rồi §4 step-1 TLS probe → quyết PD-8. Kết quả = evidence **W1/W2**.
6. ⚠️ Free tier auto-pause sau khoảng ~1 tuần không hoạt động (PD-1 đã chấp nhận): nếu thấy
   *paused*, bấm resume — không phải sự cố (runbook §8).

## Bước 4 — ZITADEL: instance pilot (~15 phút) → mở khóa P5

Tham khảo: [ZITADEL Quick Start](https://zitadel.com/docs/guides/start/quickstart),
[Applications/PKCE](https://zitadel.com/docs/guides/integrate/login/oidc/login-users),
[Users/machine](https://zitadel.com/docs/guides/manage/console/users-overview).

1. **zitadel.cloud** → signup → tạo **instance** tên `mattercontrol-pilot` + organization →
   **chọn data region** (US hoặc EU — PD-6 đã chấp nhận residency cho synthetic pilot; chọn
   gì tôi cũng ghi vào release note) → nhận URL `https://<tên>.zitadel.cloud` = ✍️
   `OIDC_ISSUER` (không có dấu `/` cuối).
2. **Admin MFA** (PD-5): Console → Instance/Default Settings → **Login policy** → bật
   **Force MFA** (ZITADEL chỉ enforce MFA trên local authentication — đủ cho pilot).
3. Tạo **Project** mới (tên gợi ý `mattercontrol`) → ✍️ `ZITADEL_PROJECT_ID` = ID của
   **project resource này** (audience pin theo runbook §5 — không phải org/instance id).
4. Tạo **3 users A/B/C** (human users, email bạn kiểm soát được để đăng nhập thử được).
5. (Tuỳ chọn — nếu muốn tôi đăng ký apps qua API): Users → Add → **Machine user** → grant
   quyền Org Owner/Manager trên project → tạo **PAT** → 🔐 password manager +
   `~/.mc-pilot/zitadel-pat` (0600).
6. ⏱️ **Apps — đăng ký SAU khi có CF_SUBDOMAIN và ngay trước first deploy** (quy tắc
   runbook/Phase 2 P5: redirect URI đăng ký EXACTLY BEFORE first deploy):
   - **Web app**: Project → *Applications* → *New* → loại **Web** → auth **PKCE** → Redirect
     URI: `https://mattercontrol-pilot.<CF_SUBDOMAIN>.workers.dev/api/auth/callback` →
     Client ID → ✍️ `OIDC_WEB_CLIENT_ID`;
   - **API app**: *New* → loại **API** → auth **JWT / private key** → tải **key JSON** → 🔐
     password manager (+ `~/.mc-pilot/` file 0600 nếu tôi drive) → Client ID → ✍️
     `OIDC_API_CLIENT_ID`;
   - Bạn tự làm console hoặc nhắn tôi làm qua PAT — quyết định lúc tới bước đó.
7. ✉️ Báo: instance URL + project id (+ users đã tạo).

## Bước 5 — Phase 1 (không phải cloud, song song)

Dán `docs/implementation/handoffs/MC-OPENCODE-PILOT-DEPLOY-READINESS-REVIEW-R2-20261104-PROMPT.md`
vào **OpenCode** → verdict r2 quyết định việc commit candidate (Phase 1).

---

## Bảng handback tổng

| Giá trị | Nơi đến |
|---|---|
| `CF_SUBDOMAIN`, `SB_REF`, `SB_POOLER`, `OIDC_ISSUER`, `ZITADEL_PROJECT_ID`, `OIDC_WEB_CLIENT_ID`, `OIDC_API_CLIENT_ID` | `~/.mc-pilot/env.sh` (bạn ✍️) hoặc nhắn tôi |
| Supabase DB password | 🔐 password manager + dòng `~/.pgpass` (0600) |
| R2 Access Key ID/Secret + endpoint | 🔐 password manager + `~/.mc-pilot/r2-credentials.env` (0600) |
| ZITADEL API key JSON / PAT | 🔐 password manager (+ file 0600 nếu tôi drive) |
| Supabase CA cert | `~/.mc-pilot/sb-ca.crt` (644, public) |

## Trình tự gợi ý theo tốc độ mở khóa

**Bước 1 + 3 làm trước** (billing + Supabase) → tôi chạy được chuỗi dài nhất: P2 probes → §3
DB bring-up (W1/W2) → TLS probe (PD-8) → và P4 sau billing. **Bước 2** mở P3 (bucket +
APP_ORIGIN). **Bước 4.1–4.5** bất cứ lúc nào; **4.6 (apps)** chờ subdomain. Mỗi bước xong
nhắn tôi — tôi verify, ghi evidence vào `record.md` cùng thư mục này, và chạy phần CLI
thuộc tôi.
