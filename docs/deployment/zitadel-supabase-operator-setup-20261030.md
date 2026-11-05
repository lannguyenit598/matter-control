# ZITADEL + Supabase — operator setup và thông tin cho ADR-006

Local Codex, 2026-10-30. Đối chiếu source ở `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` + working tree đang thay đổi. Đây là hướng dẫn thao tác cho operator; chưa tạo project, đổi policy, đọc secret, migrate hay deploy. Kiểm tra lại source trước khi áp dụng khi ZCode vẫn implement.

## 1. Kiến trúc và thông tin cần chốt trước

Browser → Next.js/BFF trên Workers → Go API trên Cloud Run → Supabase PostgreSQL. ZITADEL xác thực người dùng; quyền Workspace/Matter vẫn do Go và product DB kiểm tra. Không cần tích hợp Supabase Auth hay đưa database/service-role key vào frontend.

Chốt **một public frontend origin ổn định** trước khi đăng ký callback, ví dụ `https://legal-dev.example.com` (chỉ ví dụ, không phải domain đã provision). Dùng origin thực của Worker nếu chưa có custom domain; không dùng wildcard preview tùy ý. Backend có origin riêng, ví dụ URL Cloud Run; nó không phải callback login.

Theo ADR-006: Cloud Run `asia-southeast1`, Supabase `ap-southeast-1` (Singapore). Instance ZITADEL hiện được PO cung cấp ở Australia; không mô tả toàn hệ thống là Singapore-only.

## 2. ZITADEL — kiểm tra instance/project hiện có

1. Mở ZITADEL Console của instance đang dùng, chọn đúng Organization.
2. Vào **Projects**, mở project MatterControl hiện có; chưa cần tạo project mới nếu đây vẫn là cùng môi trường synthetic/dev.
3. Ghi Organization ID và Project ID. Vào **Applications** để phân biệt web application với API application.
4. Trong phần **URLs/endpoints** của application, lấy Issuer và introspection endpoint; có thể đối chiếu discovery công khai tại `<issuer>/.well-known/openid-configuration`.
5. Dùng cùng issuer chuẩn ở FE, Go và mapping user. Source FE bỏ dấu `/` cuối nhưng Go so sánh issuer chính xác; không để hai bên khác nhau. Với issuer hiện có, cấu hình không có dấu `/` cuối.

Thông tin đã có trong public dev overlay của repo, cần operator xác nhận nếu tiếp tục dùng môi trường này:

| Trường | Giá trị dev đã cung cấp |
|---|---|
| Issuer | `https://matter-control-legal-dev-fm2k48.au1.zitadel.cloud` |
| Organization ID | `396978885222316422` |
| Project ID | `396983669648046470` |
| Web Client ID | `396983754624613928` |
| API Client ID | `396983864414715432` |

Các giá trị trên không chứng minh live account chưa thay đổi. Nếu tạo environment mới, lấy lại ID, không chép ID dev sang project mới.

## 3. ZITADEL — web login application

Vào **Projects → MatterControl → web application**. Nếu chưa có app đúng môi trường: **New → Web**.

1. Flow: **Authorization Code + PKCE**, S256.
2. Kiểm tra token-endpoint authentication thực tế là **none / PKCE**. Source hiện gửi `client_id` + `code_verifier`, không gửi client secret. PKCE và client authentication là hai thiết lập khác nhau: đừng chọn Basic/Post/private-key JWT cho web app rồi giả định source này hỗ trợ. Nếu wizard không cho profile này, kiểm tra cấu hình nâng cao/API với maintainer; không tự đổi loại app hoặc bỏ xác thực để vượt lỗi.
3. Grant types: Authorization Code và Refresh Token; không cần Implicit/password grant.
4. Đăng ký **Redirect URI** đúng tuyệt đối: `<PUBLIC_FRONTEND_ORIGIN>/api/auth/callback`.
5. Deploy HTTPS: tắt **Dev Mode**. Để giữ localhost đang dùng HTTP, nên dùng web application dev riêng; không tắt Dev Mode ở app local đang được dùng mà chưa bàn giao.
6. Token Settings: cho phép Refresh Token. App đã yêu cầu `offline_access`.
7. ID token phải tương thích **RS256** vì verifier FE hiện chỉ chấp nhận RS256. Access token có thể opaque vì Go dùng introspection; không cần ép JWT access token để login hoạt động.
8. Copy **Client ID** vào `OIDC_CLIENT_ID`. Không cần sinh web client secret cho profile source hiện tại.
9. Source yêu cầu các scope sau tự động, không phải dán thủ công vào từng request:

   `openid profile email offline_access urn:zitadel:iam:org:project:id:<PROJECT_ID>:aud`

10. Source logout hiện xóa session ứng dụng, revoke refresh token best-effort rồi redirect `/login?signedOut=1`; chưa gọi OIDC `end_session_endpoint`. Vì vậy đăng ký Post Logout Redirect URI không tự tạo global SSO logout. Nếu thiết kế sau bổ sung RP-initiated logout, mới chốt URI và test tương ứng. Không điền `/api/auth/logout` như callback GET: route này hiện là same-origin POST.

Tài liệu: [Applications](https://zitadel.com/docs/guides/manage/console/applications-overview), [token endpoint và none/PKCE](https://zitadel.com/docs/apis/openidoauth/endpoints), [scopes/audience](https://zitadel.com/docs/apis/openidoauth/scopes).

## 4. ZITADEL — API introspection application và key

1. Trong **cùng project**, mở API application hiện có. Nếu cần app mới: **New → API → JWT** (private-key JWT).
2. Copy **API Client ID** vào `MC_OIDC_API_CLIENT_ID`.
3. Vào **Keys → New**, chọn JSON, đặt thời hạn theo policy được duyệt, **Add → Download**. Nếu key hiện có vẫn hợp lệ và đã được quản lý an toàn thì không cần tạo key mới chỉ để lấy lại thông tin.
4. File JSON chứa private key thật. Giữ trong nơi riêng tư; local mode0600; không gửi vào chat, commit, log hay image Docker. Backend khi deploy nhận file qua secret-volume read-only.
5. `MC_OIDC_API_KEY_FILE` là **đường dẫn trong container**, ví dụ `/var/run/secrets/zitadel/api-key.json`; không dùng đường dẫn `/Users/...` của máy Mac. Operator/DevOps gắn secret version tương ứng vào đúng mount path.
6. Lấy introspection endpoint từ URLs/discovery, thường là `<issuer>/oauth/v2/introspect` → `MC_OIDC_INTROSPECTION_URL`.
7. **Audience của access token** ở profile hiện tại là **Project ID**, vì FE yêu cầu project-audience scope. Điền `MC_OIDC_AUDIENCE=<PROJECT_ID>`; không nhầm với API Client ID dùng ký assertion, hoặc web client dùng nhận ID token. Xác minh `aud` qua một flow thật, chỉ ghi kết quả boolean/status, không xuất token.

Tài liệu: [đăng ký API/JWT và tải key](https://zitadel.com/docs/guides/integrate/token-introspection/private-key-jwt).

## 5. ZITADEL — tài khoản và quyền truy cập sản phẩm

1. **Users → Users → New** tạo user tương tác; tab Service Accounts là loại khác.
2. Dùng email test operator nhận được, thiết lập mật khẩu/passkey và hoàn tất email verification theo flow bình thường. Không lặp lại email giả không nhận mã của các lượt test trước.
3. Ghi **User ID/sub** của A/B; không gửi mật khẩu/OTP. MFA áp theo policy operator đã phê duyệt, giữ admin recovery; không tắt verification/MFA chỉ để vượt kiểm thử.
4. Backend hiện **lookup-only** `(issuer, sub)` trong bảng product users; có user ở ZITADEL chưa tự tạo product user. DevOps/backend cần provision mapping rõ ràng vào DB deploy và cấp Workspace/Matter qua flow được duyệt. Không liên kết bằng email và không tự copy toàn bộ dữ liệu local.
5. ZITADEL Organization/Project roles không tự thay thế Matter roles của sản phẩm. Organization ID hiện không có biến env enforcement riêng ở app; không coi điền ID vào tài liệu là đã có Organization isolation.

## 6. Supabase — tạo/chọn project và lấy connection info

1. Vào Supabase Dashboard, chọn đúng Organization. Nếu chưa có project pilot: **New project**, tên ví dụ `mattercontrol-dev`, chọn **Singapore `ap-southeast-1`**, chọn Free nếu account cho phép; không bật add-on/upgrade để xử lý connectivity khi chưa được duyệt.
2. Tạo database password mạnh, lưu password manager. Password project này là password role quản trị `postgres`, không phải password login ZITADEL.
3. Sau khi project sẵn sàng, ghi **Project reference**, region, PostgreSQL version và database name thực tế. Project ref có trong Project Settings/General hoặc Dashboard URL.
4. Bấm **Connect** ở đầu project. Chọn **Session pooler**, copy riêng host/port/database/user và mẫu connection string. Không tự ghép pooler hostname từ region: có cluster index riêng.
5. Với Go Cloud Run, baseline ADR-006 dùng kết nối tương thích session. **Session pooler port5432** là lựa chọn IPv4 để kiểm thử trước. Direct `db.<ref>.supabase.co:5432` phù hợp nếu mạng deploy/migration đã chứng minh IPv6 hoặc endpoint IPv4 được duyệt.
6. Không chọn shared Transaction pooler port6543 chỉ vì frontend dùng Workers: **Go** mới là PostgreSQL client sản phẩm hiện tại. pgx prepared statements, session statement timeout và migration advisory locks cần kiểm chứng; đừng thêm flag Prisma `pgbouncer=true` vào pgx.
7. Migrations/backup ưu tiên Direct theo tài liệu provider. Nếu môi trường operator không có IPv6, dùng session-compatible route sau khi kiểm chứng advisory locks và tooling; không hạ xuống transaction pooling để vượt lỗi.

Tài liệu: [Connect, pooler, username và IP](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 7. Supabase — TLS và Data API

1. **Database → Settings → SSL Configuration**: tải CA certificate được cung cấp. CA không phải private key; mount file vào container/job và cấu hình đúng `sslrootcert`.
2. Client deploy dùng `sslmode=verify-full`, xác minh CA và hostname, không chỉ `require` hoặc `disable`.
3. Bật **Enforce SSL on incoming connections** khi operator thực hiện cấu hình project; thao tác có thể reboot DB, nên không thay trên DB đang dùng mà không có maintenance window.
4. Vì app chỉ dùng Go→Postgres, vào **Integrations → Data API** (hoặc Project Settings → Data API tùy Dashboard), tắt Data API nếu project không dùng. Nếu vẫn bật cho mục đích khác, bỏ schema nội bộ khỏi exposed schemas và áp grants/default privileges deny; kiểm tra negative thật.
5. `mcapp` là schema private trong fixture B1 mới, chưa phải bằng chứng đã provision trên Supabase. Schema có tên private vẫn có thể bị expose/grant nhầm: kiểm tra settings thực và quyền của `anon`, `authenticated`, `service_role`, `PUBLIC`; RLS/grants bổ sung theo surface thực tế.
6. Với topology này, không cần `SUPABASE_URL`, anon/publishable key hoặc service-role/secret API key trong FE/Go hiện tại. Chỉ cung cấp database DSN cho đúng backend/job.

Tài liệu: [SSL enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement), [Data API security](https://supabase.com/docs/guides/api/securing-your-api).

## 8. Supabase — tách role trước khi chạy app

Profile mục tiêu từ B1: `mc_owner` NOLOGIN, `mc_migrator` LOGIN cho migration, `mc_runtime` LOGIN cho Go API, maintenance riêng chưa kích hoạt purge. Tên có thể đổi theo environment; phải đồng bộ SQL/DSN.

Operator cần **SQL deploy đã review**, không chạy fixture test lên managed DB. Hiện `b1_least_privilege_test.go` là test có `DROP OWNED`, `DROP SCHEMA ... CASCADE`, `DROP ROLE` ở preamble: **không dùng nó như bootstrap Supabase**. Profile test và local55-pass vẫn cần đóng gói/kiểm chứng trên Supabase; chưa có kết luận provider PASS.

SQL deploy phải giải quyết owner thực của objects/default privileges, schema/search_path, migration ledger read, sequence/function permissions, append-only SELECT/INSERT và table-specific DML. Runtime không sở hữu bảng/schema, không DDL/TRUNCATE/BYPASSRLS/role escalation; không blanket `GRANT ALL`, không blanket UPDATE/DELETE lên append-only. Không đưa admin password vào API revision.

Mẫu DSN **chỉ là hình dạng**, placeholders không phải credential:

```dotenv
# Cloud Run API secret: user custom role qua SESSION pooler
MC_DATABASE_URL=postgresql://mc_runtime.PROJECT_REF:ENCODED_RUNTIME_PASSWORD@EXACT_SESSION_POOLER_HOST:5432/postgres?sslmode=verify-full&sslrootcert=/etc/ssl/supabase/ca.crt&search_path=mcapp

# Migration job secret, chỉ cấp cho job; DIRECT khi network cho phép
MC_MIGRATE_DATABASE_URL=postgresql://mc_migrator:ENCODED_MIGRATOR_PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=verify-full&sslrootcert=/etc/ssl/supabase/ca.crt&search_path=mcapp
```

Nếu migration dùng Session pooler thì username là `mc_migrator.PROJECT_REF`, host lấy từ Connect. `mcapp` chỉ dùng sau khi SQL bootstrap/migration runner/search_path được chốt và test. Percent-encode password khi đưa vào URI; không paste full DSN để nhờ kiểm tra. Không dùng restricted runtime để seed user bằng SQL ngoài contract; provisioning là bước operator riêng.

Go pool hiện cố định MaxConns10 mỗi instance; phải tính replicas, rolling old+new revisions, migrator/ops và pooler client/server limits. Các con số3instances/50inflight trong proposal chưa được PO duyệt để kích hoạt mặc định.

## 9. Gắn biến vào đúng nơi

**Frontend/BFF runtime (Workers, server-only):**

```dotenv
API_MODE=rest
API_BASE_URL=https://ACTUAL_API_ORIGIN/api/v1
AUTH_ALLOW_ANONYMOUS=false
OIDC_ISSUER=https://ACTUAL_ZITADEL_ISSUER
OIDC_CLIENT_ID=WEB_CLIENT_ID
OIDC_PROJECT_ID=PROJECT_ID
APP_ORIGIN=https://ACTUAL_FRONTEND_ORIGIN
SESSION_COOKIE_SECURE=true
```

Không đặt chung `API_TOKEN` để thay bearer của mọi user. Worker adapter/bindings→serverEnv mapping vẫn cần implement/test; file env này không chứng minh đã có Worker config. Durable session/key bindings sẽ do implementation được review xác định, không tự invent env names.

**Go API Cloud Run:**

```dotenv
MC_HTTP_ADDR=0.0.0.0:8080
MC_MIGRATE_ON_START=false
MC_LOCAL_PEOPLE_DIRECTORY=false
MC_OIDC_ISSUER=https://ACTUAL_ZITADEL_ISSUER
MC_OIDC_INTROSPECTION_URL=https://ACTUAL_ZITADEL_ISSUER/oauth/v2/introspect
MC_OIDC_AUDIENCE=PROJECT_ID
MC_OIDC_API_CLIENT_ID=API_CLIENT_ID
MC_OIDC_API_KEY_FILE=/var/run/secrets/zitadel/api-key.json
MC_OIDC_CACHE_TTL=0s
MC_DATABASE_URL=<secret reference to runtime DSN>
MC_OBJECT_BACKEND=r2
```

`<secret reference ...>` là deployment descriptor, không phải literal value để export. R2 endpoint/bucket/access-key/secret và Worker→Cloud Run invocation model còn là cấu hình riêng; chỉ điền IdP+DB chưa đủ khởi động API. Mount CA đúng path. Không cấp migration DSN vào serving revision; migration job có DSN riêng, key/secret/mount tối thiểu mà CLI hiện thực sự yêu cầu. Source hiện load full ProductConfig khi migrate nên DevOps cần kiểm tra required env của job, không giả định chỉ truyền một DSN là đủ.

## 10. Operator trả lại gì để nối deploy

Điền bản công khai này, không chứa password/key/token:

```text
Environment: synthetic pilot/dev
Frontend public origin:
API origin (nếu đã có):

ZITADEL issuer:
Organization ID:
Project ID:
Web Client ID:
Web auth method: none/PKCE
Redirect URI:
Dev Mode: off cho HTTPS deploy
Refresh grant: enabled
ID token algorithm: RS256
API Client ID:
API key: đã lưu private / secret reference NAME + VERSION; KHÔNG nội dung
Synthetic A sub / email-setup-complete: yes/no
Synthetic B sub / email-setup-complete: yes/no

Supabase project reference:
Region / PostgreSQL version:
Database name:
Session pooler hostname / port:
Direct hostname / port / network reachable: yes/no/not-tested
Runtime role / pooled username:
Migrator role / connection method:
Private schema (proposed or applied):
SSL enforcement: on/off/not-checked
CA certificate local path or deployment artifact reference:
Data API: disabled / restricted / not-configured
Reviewed role/bootstrap SQL: path/revision hoặc PENDING
Runtime DSN secret reference NAME + VERSION; KHÔNG DSN
Migrator DSN secret reference NAME + VERSION; KHÔNG DSN
```

## 11. Kiểm chứng sau cấu hình, không thay bằng suy đoán

Theo authorization stage riêng: kiểm tra role/TLS/current_schema bằng kết nối runtime; denials DDL/append-only và full positive contract; migrate đúng job một lần; API ready; login A/B→app; refresh/logout/revoke; isolation; provider/network outage→unavailable trung thực; reload/cold-start trên Worker; R2 upload/download+restore.

Local return mới `docs/testing/zcode-adr006-cloud-readiness-20261030-r1/return.md` chỉ ghi LOCAL_CANDIDATE. Adapter workerd chưa chạy, session durable mới design/reference SQL, provider checks và independent review mở. Cấu hình chính xác là đầu vào cho các bước này, không phải deploy/release approval.

Skipped: live account inspection/provisioning, secrets, SQL execution, login, managed-provider tests and deployment. Rủi ro: source đang đổi, SQL role profile và Worker durable state còn cần review/implementation; tài liệu UI provider có thể đổi nhãn menu.
