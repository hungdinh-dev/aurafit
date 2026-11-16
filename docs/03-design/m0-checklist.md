# M0 – Việc còn lại để đóng mốc

Cập nhật 16/11/2026, nhánh `feat/m0-finish`. Tiêu chí của M0 (implementation-plan.md §4): **đăng nhập Google trên iPhone thật, đổi được vi/en, CI xanh.**

## Trạng thái

| Tiêu chí | Trạng thái |
|---|---|
| Đăng nhập Google trên iPhone thật | Code xong. Còn chờ bạn bật Google trên Supabase (bước 1) và chạy thử trên máy (bước 3) |
| Đổi được vi/en | Có trong Cài đặt → Ngôn ngữ. Cần thử trên máy |
| CI xanh | Các bước của CI (typecheck, lint, 417 test) chạy trên máy đều qua. GitHub Actions đang bị khoá do vấn đề thanh toán của tài khoản GitHub |

Đã xong, bạn không cần làm gì thêm:

- Supabase `aurafit`:
  - đã áp 13 migration và seed;
  - đã bật RLS cho cả 49/49 bảng;
  - type `@aurafit/db` được sinh từ chính project này.
- Edge Function:
  - 4 function đã deploy: `analyze-meal`, `analyze-text`, `close-day`, `weekly-review`;
  - đã thử gọi thật: không có phiên đăng nhập thì bị từ chối, mã cron đúng thì chạy được.
- Lịch chạy (pg_cron):
  - `close-day` chạy mỗi giờ;
  - `weekly-review` chạy tối Chủ nhật;
  - mã bí mật cho cron được sinh và lưu trong Vault của database, không ai phải chép tay.

## Việc của bạn (đều miễn phí)

### 1. Bật đăng nhập Google (~10 phút)

1. Vào [Google Cloud Console](https://console.cloud.google.com), tạo project "AuraFit" hoặc dùng project có sẵn.
2. Mở **Google Auth Platform** (OAuth consent screen) và điền:
   - User type: **External**;
   - tên app: AuraFit, kèm email hỗ trợ;
   - để ở chế độ **Testing** và thêm Gmail của bạn vào **Test users**.
3. Vào **Clients → Create client**:
   - Application type: **Web application**;
   - Authorized redirect URIs: `https://xtqdgpwgeifjvwcudtom.supabase.co/auth/v1/callback`.

   Tạo xong bạn có **Client ID** và **Client secret**.
4. Vào Supabase Dashboard → **Authentication → Sign In / Providers → Google**:
   - bật lên;
   - dán Client ID và Client secret, rồi bấm Save.

   Không gửi secret qua chat và không đưa vào git.
5. Vào **Authentication → URL Configuration**:
   - Site URL: `aurafit://`;
   - Redirect URLs: thêm `aurafit://auth/callback` (bản build) và `exp://**` (Expo Go).

App mở trang đăng nhập Google trong trình duyệt, nên chỉ cần client loại **Web**. Client iOS chỉ cần khi chuyển sang đăng nhập Google native.

### 2. Bật mã OTP qua email (~2 phút)

1. Vào **Authentication → Emails → Templates → Magic Link**.
2. Thêm `{{ .Token }}` vào nội dung email để người dùng nhận mã 6 số.

Máy gửi mail mặc định của Supabase chỉ gửi được rất ít email mỗi giờ: đủ để thử, chưa đủ cho người dùng thật.

### 3. Chạy app trên iPhone bằng Expo Go (không cần Mac)

1. Cài **Expo Go** từ App Store.
2. Cần file `apps/mobile/.env` với `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY`:
   - copy từ `apps/mobile/.env.example`;
   - key lấy ở Supabase → Project Settings → API Keys, dùng **publishable key**.
3. Trên máy Windows, ở thư mục repo (nhánh `dev`, sau khi merge PR này), chạy:
   ```bash
   npm install
   npm start -w @aurafit/mobile
   ```
   iPhone và máy tính phải dùng chung Wi-Fi. Nếu iPhone không kết nối được, chạy `npx expo start --tunnel` trong `apps/mobile`.
4. Mở Camera trên iPhone, quét mã QR rồi mở trong Expo Go.
5. Thử lần lượt:
   - đăng nhập Google;
   - đăng xuất, rồi đăng nhập bằng email + mã OTP;
   - vào Cài đặt → Ngôn ngữ, đổi vi ↔ en.

Mọi thư viện của app hiện có sẵn trong Expo Go. Chỉ khi thêm HealthKit (M3) mới cần development build.

### 4. Gemini key (cho ghi món bằng ảnh hoặc mô tả chữ – thuộc M2, không bắt buộc cho M0)

1. Vào Google AI Studio → **Get API key**.
2. Thêm key vào Supabase → **Edge Functions → Secrets** với tên `GEMINI_API_KEY`.

Gói miễn phí giới hạn số lần gọi, và Google có thể dùng dữ liệu gửi lên để cải thiện sản phẩm. Kế hoạch (launch-plan.md §4) là chuyển sang key trả phí trước khi có người dùng thật; việc này do bạn quyết.

## Cần bạn quyết (liên quan thanh toán – mình không làm)

- **GitHub Actions:** tài khoản GitHub đang bị khoá vì vấn đề thanh toán, nên CI trên PR luôn đỏ, dù code không lỗi.
- **Development build / TestFlight:**
  - cần Apple Developer Program, 99 USD/năm;
  - với M0, Expo Go là đủ;
  - development build chỉ cần từ M3 (HealthKit).
