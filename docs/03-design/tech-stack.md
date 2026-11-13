# Tech stack (đề xuất – chờ xác nhận, D-010)

Tiêu chí chọn: **iOS trước qua TestFlight**, **làm từ máy Windows**, **một người phát triển**, **AI chụp ảnh là lõi**, **sau này kinh doanh được**.

## Tóm tắt

| Lớp | Lựa chọn | Lý do |
|---|---|---|
| App | **Expo** (SDK ổn định mới nhất lúc khởi tạo) + **TypeScript strict** | Bạn đã quen; build iOS được từ Windows qua EAS |
| Điều hướng | **Expo Router** (điều hướng theo file) | Chuẩn của Expo, có deep link; bản cũ tự chế tab bằng ScrollView |
| Build & phát hành | **EAS Build + EAS Submit → TestFlight** | Không cần máy Mac |
| Giao diện | Thành phần **native** theo HIG: tab bar native của Expo Router, header native có tiêu đề lớn, sheet native. **NativeWind** chỉ dùng cho bố cục. **Reanimated**, **expo-haptics** (D-039, D-040) | Đúng chuẩn Apple, tự có Liquid Glass trên iOS 26; bỏ Gluestack (nặng, từng gây lỗi `react-dom`) |
| Liquid Glass | **expo-glass-effect** cho nút nổi, thanh công cụ tuỳ chỉnh; **expo-blur** làm dự phòng trên iOS < 26 | Kính chỉ cho lớp điều khiển, không cho thẻ nội dung (HIG) |
| Biểu tượng & chữ | **expo-symbols** (SF Symbols); font hệ thống SF Pro / SF Pro Rounded cho số liệu, hỗ trợ Dynamic Type | SF Pro hiển thị tiếng Việt đầy đủ dấu; không cần tải font ngoài |
| Màu | Màu ngữ nghĩa của iOS (nền, chữ, đường kẻ) + **một màu nhấn thương hiệu** | Tự đổi sáng/tối, tương phản cao, đúng HIG |
| shadcn? | **Không dùng** – shadcn chỉ dành cho web (Radix + Tailwind). Bản React Native kiểu shadcn cho ra giao diện web, đi ngược HIG | – |
| Dữ liệu từ server | **TanStack Query** | Cache, retry, trạng thái tải; bản cũ tự gọi tay ở từng màn |
| Trạng thái cục bộ | **Zustand** (nhỏ, chỉ cho UI) | Đã dùng ở bản cũ |
| Lưu cục bộ | **expo-secure-store** (phiên đăng nhập), **MMKV** (cache, cài đặt) | Sửa lỗi bản cũ: không giữ phiên đăng nhập |
| Kiểm tra dữ liệu | **Zod** | Dùng chung cho form, API và Edge Function |
| Đa ngôn ngữ | **i18next + react-i18next + expo-localization** | Chuẩn phổ biến, file dịch JSON theo namespace, dễ thêm ngôn ngữ (D-009) |
| Backend | **Supabase**: Postgres + RLS, Auth, Storage, Edge Functions, pg_cron | Một dịch vụ đủ mọi thứ; bạn đã dùng |
| Đăng nhập | **Google + email OTP** cho beta; **Sign in with Apple** thêm trước khi lên App Store (D-029) | Supabase hỗ trợ sẵn cả ba. App Store yêu cầu Sign in with Apple (hoặc lựa chọn tương đương) khi app có đăng nhập Google |
| AI phân tích ảnh | **Edge Function** gọi mô hình AI có thị giác, trả về JSON có cấu trúc. **Mặc định: mô hình rẻ dòng Gemini Flash**; mô hình mạnh hơn chỉ dùng khi cần (D-022) | Khoá API nằm ở server; đổi nhà cung cấp không phải sửa app |
| Ảnh bữa ăn | **expo-camera / expo-image-picker** + **expo-image-manipulator** (nén trước khi gửi) → Supabase Storage (bucket riêng tư) | Ảnh nhỏ thì phân tích rẻ và nhanh hơn; ảnh là dữ liệu riêng tư |
| Thông báo | **expo-notifications** (thông báo cục bộ đặt lịch) | Rest timer, nhắc ăn/uống nước, vẫn báo khi app chạy nền |
| Apple Health | Thư viện HealthKit cho React Native (sau khi chốt Q2.8) | Đọc giấc ngủ, bước chân, cân nặng tự động |
| Biểu đồ | **victory-native** (vẽ bằng Skia) | Mượt, tuỳ biến tốt |
| Linh vật Auri | Beta: bộ hình tĩnh theo tâm trạng. v1.1: **Rive** (hoạt hình có trạng thái) | Rive điều khiển tâm trạng/màu bằng tham số; cần development build |
| Widget / Live Activity | v1.1: phần mở rộng iOS native gắn qua config plugin của Expo | Cần code Swift nhỏ; thiết kế dữ liệu sẵn từ đầu |
| Kiểm thử | **Jest** cho logic; **React Native Testing Library** cho component | Công thức TDEE, giáo án, điểm số phải có test |

## Kiến trúc tổng quát

```text
┌────────────── iOS app (Expo) ──────────────┐
│ Expo Router screens                         │
│ TanStack Query ── Supabase client           │
│ packages/core (logic thuần: TDEE, giáo án,  │
│                điểm số, i18n keys)          │
└──────────────┬──────────────────────────────┘
               │ HTTPS (JWT người dùng)
┌──────────────▼──────────── Supabase ───────┐
│ Auth · Postgres + RLS · Storage (ảnh)       │
│ Edge Functions:                             │
│   analyze-meal  → gọi AI, trả JSON          │
│   score-day     → tính chỉ số/streak        │
│ pg_cron: chốt ngày, sinh giáo án tuần mới   │
└─────────────────────────────────────────────┘
```

**Nguyên tắc quan trọng (rút từ lỗi bản cũ):**

1. **Điểm số, XP, streak tính ở server**, app không được tự ghi. Bản cũ cho phép người dùng tự sửa XP.
2. **Logic nghiệp vụ là hàm TypeScript thuần** trong `packages/core`, có test, dùng chung cho app và Edge Function. Không nhét logic vào component 1000+ dòng.
3. **Một nguồn thời gian**: lưu UTC, tính "ngày của người dùng" theo múi giờ của họ (mặc định Asia/Ho_Chi_Minh).
4. **RLS mặc định đóng**: bảng nào cũng chỉ chủ dữ liệu đọc/ghi; dữ liệu công khai (nếu có) để ở bảng/view riêng.
5. **Mọi chuỗi giao diện đi qua i18n**, kể cả thông báo lỗi.

## Chiến lược AI tối ưu chi phí (D-022)

```text
Ghi món
 ├─ Món của tôi / Gần đây / Mã vạch ─────────────► 0 lượt gọi AI
 ├─ Mô tả chữ ──► mô hình rẻ, chỉ gửi chữ ───────► rẻ nhất
 └─ Ảnh ──► nén ~1024px ──► mô hình rẻ (Flash)
                 ├─ độ tin cậy cao ──► xong (1 lượt gọi)
                 └─ thấp + người dùng bấm "Phân tích lại" ──► mô hình mạnh hơn
```

- **Một lớp `AiProvider`** trong Edge Function: `analyzeMealImage()`, `analyzeMealText()`. Đổi Gemini ↔ Claude ↔ mô hình khác chỉ là đổi cấu hình.
- **Câu hỏi làm rõ trả về cùng lượt gọi đầu** (D-014), nên không phát sinh lượt gọi thứ hai.
- **Hạn mức**: số ảnh/người/ngày (mặc định 15); ghi `ai_requests` để xem chi phí thật mỗi tuần.
- **Bộ đánh giá**: 30–50 ảnh món Việt có kcal tham chiếu, chạy lại mỗi khi đổi mô hình hoặc prompt (A6).

**Về MCP:** MCP là cách nối *agent khi phát triển* (Claude Code, Gemini CLI…) với công cụ – ví dụ để agent đọc database Supabase. App chạy thật thì gọi thẳng API của mô hình từ Edge Function, không đi qua MCP. Hai việc này độc lập: bạn vẫn có thể dùng Gemini rẻ cho app và dùng agent nào tuỳ thích để phát triển.

## Cấu trúc repo đề xuất

```text
aurafit/
├── apps/mobile/          # Expo app
├── packages/core/        # Logic thuần + test (TDEE, giáo án, điểm số)
├── supabase/             # migrations, edge functions, seed
└── docs/
```

Bỏ `web-3d/` khỏi giai đoạn này (3D để sau MVP).

## Chi phí cho beta (ước lượng, cần kiểm tra lại giá tại thời điểm đăng ký)

| Khoản | Ghi chú |
|---|---|
| **Apple Developer Program – 99 USD/năm** | **Bắt buộc** để đưa app lên TestFlight. Tài khoản Apple miễn phí không dùng được TestFlight. |
| Supabase | Gói miễn phí đủ cho 10 người. Lưu ý: dự án miễn phí bị tạm dừng nếu không có hoạt động một thời gian. |
| EAS Build | Gói miễn phí có giới hạn số lần build mỗi tháng; đủ cho beta nếu không build quá thường xuyên. |
| AI phân tích ảnh | Tính theo mỗi ảnh, ước tính ≈ 0,003–0,008 USD/ảnh; đặt **hạn mức ảnh/người/ngày**. Dùng **gói trả phí** của Gemini từ beta kín (D-047). Chi tiết: `launch-plan.md` §4. |

## Điểm cần xác nhận

- ✅ Chủ dự án giao toàn quyền (Q2.12) → áp dụng stack này.
- ✅ AI: Gemini rẻ trước (Q2.11).
- Lưu ý: HealthKit và MMKV cần **development build**, không chạy trên Expo Go. Giai đoạn đầu vẫn dùng Expo Go được cho các màn không cần chúng.
