# Roadmap MVP

Cập nhật 2026-11-13 sau vòng 3. Thứ tự đi theo trọng tâm (D-005): **dinh dưỡng trước, workout sau**. Mỗi mốc kết thúc bằng một bản chạy được trên iPhone.

| Mốc | Nội dung | Kết quả kiểm tra được |
|---|---|---|
| **M0 – Nền móng** | Repo mới (`apps/mobile`, `packages/core`, `supabase`); Expo + Router + TypeScript strict + NativeWind + i18n (vi/en); Supabase với Auth **Google + email OTP**, RLS mặc định đóng; test & typecheck tự động; EAS development build | Đăng nhập Google được trên iPhone, đổi ngôn ngữ được |
| **Spike AI** (song song M0) | 30–50 ảnh món Việt qua mô hình Gemini rẻ; đo sai số kcal, thời gian, chi phí/ảnh; thử câu hỏi làm rõ trong một lượt gọi | Số liệu để chốt prompt và mô hình (A6, R10, R11) |
| **M1 – Onboarding & mục tiêu** | Onboarding ngắn + hỏi dần; BMR/TDEE/macro, ngân sách tuần, dự báo về đích trong `packages/core` có test; chọn mức khắt khe + giọng văn | Ra đúng mục tiêu cho các hồ sơ mẫu |
| **M2 – Nutrition lõi** | Màn Hôm nay (thẻ dinh dưỡng); 5 cách ghi món; Món của tôi; xác nhận & câu hỏi làm rõ; nhật ký ngày; ngày tự do + báo giá; "Ăn gì bây giờ?" | Ghi đủ một ngày ăn thật bằng cả 5 cách |
| **M3 – Sức khoẻ & Daily Tasks** | Nước (1 chạm + nhắc thông minh); cân nặng (xu hướng + nhắc + chỉnh TDEE hằng tuần); giấc ngủ nhập tay; mô hình dữ liệu chuẩn; adapter Apple Health; daily task 4 loại + hẹn giờ tập trung | Dữ liệu từ Apple Watch / Garmin (qua Apple Health) hiện lên, không trùng |
| **M4 – Huấn luyện viên** | Điểm ngày chốt bằng pg_cron; streak, mảnh khiên, khiên, ngày tự do; Level/XP, Aura, chỉ số cứng; nhiệm vụ huấn luyện viên, Boss tuần; Auri (hình tĩnh theo tâm trạng); 3 bộ giọng văn vi/en; màn tuyên dương; nhắc theo ngữ cảnh | Một tuần dữ liệu mẫu ra đúng điểm, streak, khiên, boss |
| **M5 – Workout** | Hồ sơ dụng cụ (gym / nhà / calisthenics); sinh giáo án dài + ngắn hạn; readiness; buổi tập: ghi set, autoregulation, đồng hồ nghỉ có thông báo; PR/1RM; bậc calisthenics | Tập trọn một buổi thật ở gym và ở nhà; tuần sau được tăng tải đúng |
| **M6 – Progress & Bạn bè** | Biểu đồ tuần/tháng/năm; heatmap; tổng kết tuần; kết bạn; story bữa ăn; streak đôi | Hai tài khoản thấy story và streak đôi của nhau |
| **M7 – Beta** | Đăng ký Apple Developer Program; TestFlight; chính sách quyền riêng tư; kênh phản hồi; theo dõi lỗi | 5–10 người bạn cài được và dùng |

## Sau beta

| Phiên bản | Nội dung |
|---|---|
| **Trước khi lên App Store** | **Sign in with Apple** (D-029), rà soát hướng dẫn của App Store, chính sách dữ liệu sức khoẻ |
| v1.1 | Cây kỹ năng calisthenics đầy đủ; widget màn hình khoá; Live Activity cho đồng hồ nghỉ; Auri hoạt hình (Rive) + skin |
| v1.2 | AuraFit Wrapped; ảnh tiến độ có bóng mờ; tuổi tim mạch |
| Sau | 3D anatomy; Android; social mở rộng; gói trả phí |

## Nguyên tắc làm việc

- Logic nghiệp vụ (TDEE, ngân sách tuần, điểm, giáo án, readiness) viết trong `packages/core` **trước**, có test, rồi mới làm giao diện.
- Mỗi mốc là một nhánh và PR riêng; cập nhật `docs/` khi quyết định thay đổi.
- Không mang code cũ sang; chỉ tham khảo `docs/legacy/` và mã nguồn cũ khi cần.
