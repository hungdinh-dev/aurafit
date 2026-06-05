# AuraFit Project Roadmap & TODO List

Tài liệu này dùng để theo dõi tiến độ phát triển các tính năng của ứng dụng AuraFit. Các tác vụ được chia theo nhóm mô-đun và sắp xếp theo trình tự triển khai hợp lý.

---

## 🚀 Trạng thái Dự án (Project Status Summary)
- **Thiết lập Môi trường**: 🟩 Hoàn thành (Expo SDK 54, Vite 3D, NativeWind v4, Gluestack UI v3).
- **Cơ sở dữ liệu & API**: ⬜ Chưa bắt đầu.
- **Tính năng Solo (Tập luyện & Sức khỏe)**: ⬜ Chưa bắt đầu.
- **Tương tác 3D (Anatomy & Fatigue)**: ⬜ Chưa bắt đầu.
- **Game hóa (EXP & Aura)**: ⬜ Chưa bắt đầu.
- **Social (Chat, Địa điểm, Diễn đàn)**: ⬜ Chưa bắt đầu.

---

## 📌 Bảng theo dõi Chi tiết (Detailed TODO List)

### 1. Cơ sở dữ liệu & API (Supabase Backend)
- [ ] Thiết kế và tạo bảng `users` (lưu profile, EXP, level, tuổi, giới tính, BMI, PAI).
- [ ] Thiết kế bảng `exercises` và `workout_templates` (danh mục bài tập gốc & bài tập mẫu).
- [ ] Thiết kế bảng `workout_logs` & `set_logs` (lịch sử tập chi tiết của từng buổi).
- [ ] Thiết kế bảng `muscle_fatigue` (lưu chỉ số mỏi cơ từng vùng & thời gian cập nhật).
- [ ] Thiết kế các bảng Social: `friendships`, `gym_facilities`, `chats`, `forum_posts`.
- [ ] Cấu hình Supabase Row Level Security (RLS) để bảo mật dữ liệu cá nhân.

### 2. Trình theo dõi Tập luyện & Sức khỏe (Solo Mode)
- [ ] **Workout Planner**: Tạo giáo án tập luyện theo ngày.
- [ ] **Active Workout Screen**: Giao diện thực thi buổi tập (nhập sets/reps/weight, đồng hồ đếm ngược nghỉ giữa set, nút "Done set").
- [ ] **Lịch sử & Kỷ lục (PR)**: Màn hình thống kê lịch sử tạ nâng và tự động hiển thị PR (Personal Record) cho từng bài tập.
- [ ] **Cardiovascular Age Estimator**: 
  - Khảo sát các thông số đầu vào (Tuổi, Giới tính, BMI, tần suất tập).
  - Thuật toán ước tính VO2max và tính toán Tuổi tim mạch theo nghiên cứu NTNU 2014 (Nes et al.).
- [ ] **Dinh dưỡng & Giấc ngủ**: Log cân nặng, calo/protein nạp vào, chất lượng giấc ngủ và thời gian nghỉ ngơi.

### 3. Tương tác 3D Anatomy & Fatigue (3D UI)
- [ ] **Vite WebGL Setup**: Load model giải phẫu cơ thể người `.glb` vào Canvas React Three Fiber.
- [ ] **Muscle Mapping**: Ánh xạ các vùng cơ (mesh) thành các nhóm cơ tương ứng trên model.
- [ ] **Fatigue Color-Mapping**: Code logic đổi màu các cơ dựa trên chỉ số mỏi (Xanh -> Vàng -> Đỏ).
- [ ] **Fatigue Decay Algorithm**: Viết hàm phân rã mỏi cơ tự động theo thời gian trôi qua.
- [ ] **WebView Bridge Protocol**: Thiết lập giao tiếp 2 chiều:
  - App gửi chỉ số mỏi cơ xuống 3D WebView.
  - 3D WebView gửi sự kiện "Chạm nhóm cơ" (SELECT_MUSCLE) lên App Native.
- [ ] **Exercise Animation**: Tích hợp các animation 3D động hướng dẫn thực hiện động tác đúng form.

### 4. Hệ thống Game hóa (Gamification)
- [ ] **Cơ chế EXP**: Tính toán EXP nhận được sau mỗi set, bài tập và chuỗi tập luyện (streak).
- [ ] **Cơ chế XP Decay**: PostgreSQL Trigger/Cron job giảm XP khi bỏ tập quá thời gian quy định.
- [ ] **Lá chắn Aura (Rest Day/Aura Shield)**: Tạo cơ chế mua lá chắn bằng EXP tích lũy để bảo vệ streak khi nghỉ ngơi.
- [ ] **Aura Visual Glow**: Thiết lập Shader WebGL phát sáng (glow effect) bao quanh nhân vật 3D tương ứng với cấp độ Aura.

### 5. Tính năng Cộng đồng (Social Mode)
- [ ] **Gym Locations**: Tìm kiếm và check-in các cơ sở phòng gym đối tác.
- [ ] **Gym Buddies**: Xem danh sách bạn bè đang tập chung tại cùng một cơ sở.
- [ ] **Real-time Chat**: Nhắn tin 1-1 và group chat bằng Supabase Realtime WebSockets.
- [ ] **Community Forum**: Diễn đàn thảo luận và chia sẻ kết quả tập luyện, nâng tạ.

---

## 🔗 Liên kết tài liệu bổ trợ (Additional Documentation Links)
- [Gemini.md](file:///c:/Projects/Personal/Gemini.md) - Đặc tả vai trò, tech stack và quy chuẩn chung.
- *Database Schema* (Sẽ tạo sau) - Thiết kế các bảng PostgreSQL chi tiết.
- *WebView Bridge Protocol* (Sẽ tạo sau) - Đặc tả giao tiếp JSON giữa React Native và WebGL.
