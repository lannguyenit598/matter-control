# Backend MatterControl

`mcapi` là API sản phẩm MatterControl: Go 1.26, Echo v5, PostgreSQL (pgx/v5 + sqlc), kiến trúc Hexagonal. API xác thực bằng cách introspect bearer token tại issuer OpenID Connect và kiểm tra tư cách thành viên workspace/matter cho mọi thao tác.

| | |
|---|---|
| Điểm vào | `cmd/mcapi` (`mcapi` chạy API, `mcapi migrate` chạy migration) |
| Thiết kế | [docs/mattercontrol-backend.md](docs/mattercontrol-backend.md) |
| Hợp đồng HTTP | [docs/api.md](docs/api.md) và hợp đồng chung ở `../../docs/implementation/p0-zcode-execution/local-contract.md` |
| Cấu hình và vận hành | [docs/operations.md](docs/operations.md), [.env.example](.env.example) |
| Quy tắc cho người đóng góp và agent | [AGENTS.md](AGENTS.md) |

## Bắt đầu nhanh

```bash
cp .env.example .env        # điền các giá trị MC_* bắt buộc rồi export
make test                   # test đơn vị, HTTP và hợp đồng bộ nhớ; không cần database
make test-integration       # chạy thêm bộ hợp đồng PostgreSQL (khởi động database của compose)
make check                  # mọi thứ CI chạy: sqlc, gofmt, tidy, lint, test
make run                    # áp dụng migration rồi chạy tại 127.0.0.1:8081
make up                     # PostgreSQL + migrate + API qua docker compose
```

`make help` liệt kê mọi target. Các bộ test PostgreSQL tự tạo và xóa schema riêng nên an toàn trên database phát triển.

## Cấu trúc

```text
cmd/mcapi                       điểm vào
internal/core/{domain,port,service}   quy tắc nghiệp vụ, port, use case (chỉ dùng stdlib)
internal/adapter/inbound/productapi   handler Echo và ánh xạ lỗi problem+json
internal/adapter/outbound/*           postgres, objectstore, sheet (CSV/XLSX), identity/zitadel, system
internal/app                    gốc lắp ráp (Uber Fx), nơi duy nhất nối các adapter
internal/config, internal/observability   cấu hình và OpenTelemetry
```

Hướng phụ thuộc và các quy tắc lint bảo vệ nó được mô tả trong [AGENTS.md](AGENTS.md).

## CI

GitHub Actions chạy từ gốc repository: `../../.github/workflows/backend.yml` (lint, test với PostgreSQL, govulncheck, build image).
