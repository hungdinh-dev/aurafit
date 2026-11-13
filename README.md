# AuraFit

Ứng dụng sức khoẻ & tập luyện có yếu tố game (iOS, tiếng Việt + English). Bản dựng lại từ đầu; code cũ ở tag `legacy-v0`.

| Thư mục | Nội dung |
|---|---|
| [`apps/mobile`](apps/mobile) | App Expo (Expo Router, TypeScript strict) |
| [`packages/core`](packages/core) | Logic thuần TypeScript có test: dinh dưỡng, sức khoẻ, huấn luyện viên, tập luyện, thời gian |
| [`packages/db`](packages/db) | Kiểu TypeScript của database Supabase |
| [`supabase`](supabase) | Migration, seed, Edge Functions |
| [`docs`](docs) | Toàn bộ tài liệu – bắt đầu từ [`docs/README.md`](docs/README.md) và [`docs/TONG_HOP.md`](docs/TONG_HOP.md) |

## Chạy

```bash
npm install
npm test            # test toàn bộ workspace
npm run typecheck
npm run lint
```

App: xem [`apps/mobile/README.md`](apps/mobile/README.md). Backend: xem [`supabase/README.md`](supabase/README.md).

Khoá bí mật không bao giờ commit: sao chép `.env.example` thành `apps/mobile/.env`; khoá server đặt bằng `supabase secrets set`.
