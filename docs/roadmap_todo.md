# AuraFit Project Roadmap & TODO List

Tài liệu này dùng để theo dõi tiến độ phát triển các tính năng của ứng dụng AuraFit. Các tác vụ được chia theo nhóm mô-đun và sắp xếp theo trình tự triển khai hợp lý.

---

## 🚀 Trạng thái Dự án (Project Status Summary)
- **Thiết lập Môi trường**: 🟩 Hoàn thành (Expo SDK 54, Vite 3D, NativeWind v4, Gluestack UI v3).
- **Cơ sở dữ liệu & API**: 🟩 Hoàn thành thiết kế & tạo bảng (Onboarding & Workout Hub).
- **Tính năng Solo (Tập luyện & Sức khỏe)**: 🟧 Đang tiến hành (Onboarding & Profile Hub hoàn thành).
- **Tương tác 3D (Anatomy & Fatigue)**: ⬜ Chưa bắt đầu.
- **Game hóa (EXP & Aura)**: ⬜ Chưa bắt đầu.
- **Social (Chat, Địa điểm, Diễn đàn)**: ⬜ Chưa bắt đầu.

---

## 📌 Bảng theo dõi Chi tiết (Detailed TODO List)

### 1. Cơ sở dữ liệu & API (Supabase Backend)
- [x] Thiết kế và tạo bảng `users` (lưu profile, EXP, level, tuổi, giới tính, BMI, PAI, chiều cao, cân nặng, số đo các vòng).
- [x] Thiết kế bảng `exercises` và `workout_templates` (danh mục bài tập gốc & bài tập mẫu, hỗ trợ các biến thể để swap bài).
- [x] Thiết kế bảng `workout_logs` & `set_logs` (lịch sử tập chi tiết từng set, trọng lượng, số rep đạt được, trạng thái mệt mỏi).
- [ ] Thiết kế bảng `food_logs` (lưu thông tin calo nạp, protein nạp, ảnh chụp món ăn locket-style, thời gian chụp).
- [x] Thiết kế bảng `lifestyle_metrics` (giới hạn thời gian MXH, trang sách đã đọc + ảnh sách, lượng nước uống, giờ dậy + chất lượng ngủ, các môn cardio ngoài lề như cầu lông/đá bóng).
- [ ] Thiết kế bảng `muscle_fatigue` (lưu chỉ số mỏi cơ từng vùng & thời gian cập nhật).
- [ ] Thiết kế các bảng Social: `friendships`, `gym_facilities`, `chats`, `forum_posts`.
- [x] Cấu hình Supabase Row Level Security (RLS) để bảo mật dữ liệu cá nhân.

### 2. Trình theo dõi Tập luyện & Sức khỏe (Solo Mode)

#### A. Trình Quản lý & Thực thi Buổi tập (Active Workout & Gym Session)
- [ ] **Cấu hình Ban đầu & Gợi ý (Weight Recommendation)**:
  - Cho phép người dùng nhập chiều cao, cân nặng, số đo cơ thể ban đầu.
  - Sử dụng công thức để khuyến nghị số tạ (kg) ban đầu cho từng bài tập (ví dụ: bài Lat Pulldown đầu tiên).
- [ ] **Hướng dẫn Form & Khởi động (Pre-setup)**:
  - Giao diện hướng dẫn chỉnh form đúng và thiết lập máy/tạ trước khi bước vào set tập chính.
- [ ] **Tự động điều chỉnh mức tạ theo reps (Auto-Regulation / Feedback Loop)**:
  - Set tiêu chuẩn (ví dụ Lat Pulldown: 8-10 reps).
  - Nếu người dùng nhập số reps hoàn thành < 8 (ví dụ 5-6 reps) -> Cảnh báo tạ quá nặng, gợi ý giảm tạ (ví dụ giảm X kg).
  - Nếu người dùng nhập số reps hoàn thành từ 15-20 -> Cảnh báo tạ quá nhẹ, gợi ý tăng tạ (ví dụ tăng Y kg).
- [ ] **Đồng hồ đếm ngược nghỉ giữa hiệp (Rest Timer)**:
  - Sau khi xong 1 set, tự động kích hoạt đếm ngược nghỉ (60s, 90s, 120s tuỳ bài).
  - Sử dụng thông báo (Local Notifications) trên React Native để nhắc nhở người dùng bước vào set tiếp theo khi hết thời gian nghỉ.
- [ ] **Cơ chế buổi tập linh hoạt (Flexible Session)**:
  - Phân loại bài tập trong một buổi thành bài tập mặc định (Default) và bài tập tùy chọn thêm (Extra).
  - **Tráo đổi bài tập (Swap Exercises)**: Cho phép chuyển đổi bài tập tương đương (ví dụ hôm nay tập Lat Pulldown thanh đòn, hôm khác đổi sang Lat Pulldown bằng máy kéo xô dọc).
  - **Điều chỉnh khối lượng tập**: Cho phép giảm bài hoặc giảm set khi quá mệt để hoàn thành buổi tập sớm; hoặc thêm bài/set nếu sung sức.

#### B. Nhật ký Dinh dưỡng & Thống kê trực quan
- [ ] **Nhật ký Calo & Protein kiểu Locket (Locket-style Nutrition Tracker)**:
  - Tính năng chụp ảnh món ăn/nước uống nạp vào trong ngày, lưu kèm mốc thời gian cụ thể.
  - Hiển thị dòng thời gian ảnh chụp món ăn trực quan như giao diện Locket.
  - Tạm thời: Cho phép nhập tay lượng calo + protein nạp vào.
  - Nâng cấp tương lai: Tích hợp AI Vision tự động nhận diện món ăn và phân tích tính toán calo/protein từ ảnh chụp.
- [ ] **Biểu đồ đóng góp tập luyện kiểu GitHub (GitHub-style Workout Contribution Grid)**:
  - Sơ đồ lịch sử tập luyện hiển thị theo ngày dạng ô vuông (Contribution Heatmap).
  - Màu sắc ô vuông đậm nhạt (từ xanh nhạt đến xanh đậm) phản ánh tần suất và cường độ tập luyện.
  - Nhấp vào từng ô ngày để xem chi tiết lịch sử ngày hôm đó đã tập bài gì, mức tạ, reps như thế nào.

#### C. Theo dõi Chỉ số Phong cách sống & Hệ thống nhắc nhở (Lifestyle & Reminders)
- [ ] **Giới hạn thời gian Mạng xã hội (Social Media Limiter)**:
  - Hỏi/nhắc nhở người dùng về thời gian lướt MXH và đưa ra khuyến nghị giới hạn thời gian.
- [ ] **Đọc sách (Reading Tracker)**:
  - Log số trang sách đã đọc trong tuần, tên cuốn sách và hỗ trợ chụp ảnh trang sách/bìa sách làm minh chứng.
- [ ] **Theo dõi giấc ngủ (Sleep Tracker)**:
  - Ghi nhận thời gian thức dậy mỗi sáng và tự đánh giá chất lượng giấc ngủ mỗi đêm.
- [ ] **Nhắc nhở uống nước (Water Intake Reminder)**:
  - Đếm số lít nước đã uống trong ngày.
  - Cấu hình gửi thông báo nhắc nhở uống nước định kỳ mỗi 10-15 phút trên ứng dụng.
- [ ] **Theo dõi Cardio mở rộng (Extended Cardio Tracker)**:
  - Hỗ trợ đi bộ dốc trên máy (20 phút, độ dốc 10-12%, tốc độ 4.2-4.5 km/h, không vịnh tay).
  - Log các môn thể thao ngoài lề khác (Cầu lông, đá bóng, chạy bộ...), lượng calo tiêu thụ và thức ăn nạp thêm sau khi vận động dã ngoại.

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
