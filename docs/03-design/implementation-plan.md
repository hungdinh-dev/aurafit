# Kế hoạch triển khai (D-038)

Bản chi tiết của `mvp-roadmap.md`: làm gì, theo thứ tự nào, xong là thế nào. Xem trước giao diện: artifact **AuraFit UI Preview**.

## 0. Việc chỉ chủ dự án làm được

| Khi nào | Việc | Ghi chú |
|---|---|---|
| Trước M0 | Tạo **Supabase project mới** (region gần VN, ví dụ Singapore) | Không gửi khoá bí mật qua chat. Repo sẽ có `.env.example`, khoá thật đặt trong `.env` (đã gitignore) và Supabase secrets |
| Trước M0 | Tạo **tài khoản Expo** (miễn phí) | Dùng cho EAS Build |
| Trước M0 | **Google Cloud Console**: tạo OAuth client cho iOS và Web | Cho đăng nhập Google |
| Trước spike AI | Tạo **Gemini API key** | Đặt vào Supabase secrets, không đặt trong app |
| Trước spike AI | Chụp **30–50 ảnh món Việt** bạn hay ăn, ghi kcal tham chiếu nếu biết | Bộ đánh giá AI |
| Trước M7 | Đăng ký **Apple Developer Program** (99 USD/năm) | Bắt buộc cho TestFlight |

## 1. Xử lý code cũ

1. Gắn tag **`legacy-v0`** trên commit mới nhất của `main` ⇒ giữ nguyên lịch sử, xem lại bất cứ lúc nào.
2. Ở M0, xoá `mobile/`, `web-3d/`, `supabase/` cũ khỏi nhánh làm việc. Giữ `docs/legacy/`.
3. Không dùng lại database cũ; schema mới viết lại từ đầu trên Supabase project mới.

## 2. Cấu trúc repo

```text
aurafit/
├── apps/mobile/
│   ├── app/                         # Expo Router – mỗi file là một màn
│   │   ├── _layout.tsx              # Provider: i18n, Query, theme, auth guard
│   │   ├── (auth)/welcome.tsx · sign-in.tsx
│   │   ├── (onboarding)/basics.tsx · goal.tsx · coach.tsx · character.tsx · ready.tsx
│   │   ├── (tabs)/_layout.tsx       # Hôm nay · Nhật ký · [＋ chụp] · Tập · Tôi
│   │   ├── (tabs)/today.tsx · diary.tsx · train.tsx · me.tsx
│   │   ├── food/add.tsx · confirm.tsx · library.tsx · barcode.tsx
│   │   ├── workout/[sessionId].tsx
│   │   ├── friends/index.tsx · invite.tsx
│   │   └── settings/…
│   └── src/
│       ├── features/<module>/       # components, hooks, api theo module
│       ├── ui/                      # bộ component nhỏ: Button, Card, Ring, Bar, Sheet, TabBar
│       ├── i18n/vi/*.json · en/*.json
│       └── lib/                     # supabase client, query client, storage, notifications
├── packages/core/src/               # logic thuần TypeScript, có test, dùng chung app + Edge Function
│   ├── nutrition/   bmr · tdee · targets · weeklyBudget · freeDayQuote · eta
│   ├── health/      weightTrend · adaptiveTdee · sleep · water
│   ├── coach/       dailyScore · streak · shields · aura · stats · quests · boss
│   ├── workout/     generator · progression · autoregulation · readiness · oneRm
│   └── time/        userDay · timezone
├── supabase/
│   ├── migrations/
│   ├── functions/   analyze-meal · analyze-text · close-day · weekly-review
│   └── seed/        exercises · food mẫu
└── docs/
```

Quản lý gói: **npm workspaces** (đơn giản nhất cho Expo trên Windows).

## 3. Mô hình dữ liệu (bản nháp)

Mọi bảng bật RLS: chỉ chủ dữ liệu đọc/ghi. Ngoại lệ duy nhất: bạn bè đọc **bữa ăn đã chia sẻ hôm nay**.

| Nhóm | Bảng |
|---|---|
| Hồ sơ | `profiles` (username, ngôn ngữ, múi giờ, nhân vật `kai`/`mira`, tên nhân vật) · `body_metrics` · `goals` (loại, tốc độ, hiệu lực từ ngày) · `coach_settings` (mức khắt khe, giọng văn, số ngày tự do, chế độ bù, giờ yên lặng) |
| Dinh dưỡng | `nutrition_targets` (theo ngày hiệu lực) · `meal_entries` · `meal_items` · `saved_foods` · `saved_meal_items` · `barcode_cache` · `ai_requests` |
| Sức khoẻ | `health_samples` (type, value, unit, start_at, end_at, source, source_id, metadata) · `daily_summaries` |
| Daily tasks | `task_definitions` · `task_logs` |
| Huấn luyện viên | `daily_scores` · `coach_state` (streak, khiên, mảnh khiên, XP, level, Aura) · `quests` · `boss_battles` · `badges` · `user_badges` · `free_days` |
| Workout | `exercises` (kèm chuỗi bậc calisthenics) · `equipment_profiles` · `programs` · `planned_sessions` · `planned_exercises` · `workout_sessions` · `set_logs` · `personal_records` |
| Bạn bè | `friendships` · `invites` · `meal_reactions` · `duo_streaks` |

## 4. Việc theo từng mốc

### M0 – Nền móng
- [ ] Tag `legacy-v0`; dọn repo; tạo npm workspaces.
- [ ] Expo app mới (SDK ổn định mới nhất), TypeScript strict, Expo Router, NativeWind cho bố cục, font hệ thống SF Pro (D-039).
- [ ] i18n vi/en; quy tắc lint chặn chuỗi giao diện viết cứng.
- [ ] Bộ UI theo `design-language.md`: tab bar native (Liquid Glass), header tiêu đề lớn, danh sách nhóm, nút dạng viên thuốc, vòng / thanh tiến độ, nút chụp nổi bằng kính, sheet; SF Symbols, haptics; sáng/tối (D-040).
- [ ] Supabase CLI; migration đầu tiên (`profiles` + RLS); sinh type TypeScript.
- [ ] Đăng nhập Google + email OTP; lưu phiên bằng SecureStore; màn chào và đăng nhập.
- [ ] `packages/core` + Jest; CI GitHub Actions chạy typecheck, lint, test.
- [ ] Hồ sơ EAS development build; cài lên iPhone.
- **Xong khi:** đăng nhập Google trên iPhone thật, đổi được vi/en, CI xanh.

### Spike AI (song song M0)
- [ ] Prompt + JSON schema cho `analyze-meal`: món, khẩu phần, 7 chất, độ tin cậy, tối đa 3 câu hỏi kèm mức điều chỉnh.
- [ ] Chạy bộ 30–50 ảnh món Việt qua mô hình Gemini Flash; đo sai số kcal, thời gian, token và chi phí mỗi ảnh.
- [ ] Thử 10 ảnh khó với một mô hình mạnh hơn để quyết định khi nào chuyển mô hình.
- **Xong khi:** có `docs/03-design/ai-spike-report.md` với số liệu và lựa chọn mô hình.

### M1 – Onboarding & mục tiêu
- [ ] `core/nutrition`: BMR, TDEE, mục tiêu theo tốc độ, sàn an toàn, macro, ngân sách tuần, báo giá ngày tự do, dự báo về đích – kèm test.
- [ ] Màn onboarding: thông tin cơ bản → mục tiêu + tốc độ → kết quả mục tiêu có giải thích → huấn luyện viên (mức + giọng) → chọn nhân vật Kai / Mira.
- **Xong khi:** 10 hồ sơ mẫu ra đúng mục tiêu như tính tay.

### M2 – Nutrition lõi
- [ ] Màn Hôm nay (thẻ dinh dưỡng, nhân vật, điểm tạm tính).
- [ ] Thêm món: Gần đây/Lặp lại, Món của tôi, mã vạch, mô tả chữ, chụp ảnh.
- [ ] Edge Function `analyze-meal`/`analyze-text` qua lớp `AiProvider`; hạn mức ảnh/ngày; ghi `ai_requests`.
- [ ] Màn xác nhận: câu hỏi làm rõ tính trên máy, chỉnh khẩu phần, ☆ lưu.
- [ ] Nhật ký ngày; ngày tự do + báo giá; "Ăn gì bây giờ?".
- **Xong khi:** ghi đủ một ngày ăn thật bằng cả 5 cách.

### M3 – Sức khoẻ & Daily Tasks
- [ ] `health_samples` + adapter nhập tay + adapter Apple Health (ngủ, bước, năng lượng vận động, cân nặng).
- [ ] Nước 1 chạm + nhắc thông minh; cân nặng xu hướng + nhắc + chỉnh TDEE hằng tuần; giấc ngủ.
- [ ] Daily tasks 4 loại, hẹn giờ tập trung, giờ yên lặng.
- **Xong khi:** dữ liệu Apple Watch / Garmin (qua Apple Health) hiện đúng, không trùng.

### M4 – Huấn luyện viên
- [ ] `core/coach` + test: điểm ngày, streak, khiên, ngày tự do, Level/Aura, chỉ số cứng, nhiệm vụ, boss.
- [ ] `close-day` chạy bằng pg_cron lúc 03:00 theo múi giờ từng người.
- [ ] Nhân vật Kai/Mira: bộ hình tĩnh theo tâm trạng + hào quang theo Aura.
- [ ] Bộ giọng văn vi/en × 3; thông báo theo ngữ cảnh; màn tuyên dương.
- **Xong khi:** một tuần dữ liệu mẫu ra đúng điểm, streak, khiên, boss.

### M5 – Workout
- [ ] Thư viện bài tập (gym, nhà, calisthenics) + chuỗi bậc tiến.
- [ ] Sinh giáo án dài + ngắn hạn; tăng tải; readiness.
- [ ] Màn buổi tập: ghi set, autoregulation theo khoảng rep, đồng hồ nghỉ có thông báo, đổi bài, thêm/bớt set.
- [ ] Bổ sung beta (D-048):
  - RIR / RPE mỗi set (WRK-14);
  - bài dự phòng "Máy đang bận" (WRK-17);
  - tạ đeo, rep từng bên, dây kháng lực (WRK-19);
  - thời gian nghỉ mặc định theo loại bài (WRK-16).
- [ ] Lịch xoay vòng A/B/C (WRK-15); kho dụng cụ phòng gym + máy tính bánh tạ (WRK-18); 7 giáo án mẫu làm seed (WRK-20).
- [ ] Ngưỡng khối lượng trên bản đồ cơ (WRK-13); 1RM chỉ tính khi set ≤ 10 rep (WRK-07).
- **Xong khi:** tập trọn một buổi ở gym và một buổi ở nhà; tuần sau tăng tải đúng.

### M6 – Progress & Bạn bè
- [ ] Biểu đồ ngày/tuần/tháng/năm từ `daily_summaries`; heatmap; tổng kết tuần.
- [ ] Kết bạn (username, link mời + QR); story bữa ăn; thả cảm xúc; streak đôi.
- **Xong khi:** hai tài khoản thấy story và streak đôi của nhau.

### M7 – Beta
- [ ] TestFlight; chính sách quyền riêng tư; form phản hồi trong app; theo dõi lỗi.
- **Xong khi:** 5–10 người bạn cài và dùng được.

## 5. Cách làm việc

- Mỗi mốc một nhánh (`feat/m0-foundation`…) và một PR; bạn duyệt rồi merge.
- Logic trong `packages/core` có test **trước** giao diện.
- Cuối mỗi mốc có bản build để bạn thử trên iPhone.
- Quyết định thay đổi ⇒ cập nhật `docs/` trong cùng PR.

## 6. Khi trễ tiến độ thì cắt gì

Cắt theo thứ tự: Boss tuần → streak đôi → readiness → "Ăn gì bây giờ?".

**Không cắt**: ghi món 5 cách, mục tiêu TDEE, điểm ngày + streak, sức khoẻ cơ bản.
