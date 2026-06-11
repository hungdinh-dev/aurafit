# AuraFit - Gamified 3D Fitness Application Context

Tài liệu này lưu trữ toàn bộ ý tưởng, danh sách tính năng và lộ trình phát triển của dự án AuraFit. Người dùng hoặc Agent có thể chỉnh sửa trực tiếp tệp này để bổ sung ý tưởng mới.

---

## 💡 Ý Tưởng Cốt Lõi (Core Idea)
AuraFit là ứng dụng theo dõi tập luyện được game hóa (Gamified). Người dùng xây dựng nhân vật đại diện, tích lũy điểm kinh nghiệm (XP), cấp độ (Level) và tăng cường luồng "Hào quang" (Aura) trực quan thông qua sự kiên trì trong tập luyện, chế độ dinh dưỡng và lối sống lành mạnh.

---

## 🛠️ Danh Sách Tính Năng (Checklist & Features)

### 1. Tập Luyện Solo (Solo Workout)
- [x] **Giáo án & Bài tập theo ngày/tuần:** Hỗ trợ giáo án hệ thống (Pull, Push, Legs) hoặc người dùng tự thiết kế cho từng ngày.
- [x] **Theo dõi set tập thời gian thực:** Ghi nhận tự động số hiệp, số reps, mức tạ thực tế.
- [x] **Đếm ngược thời gian nghỉ (Rest Timer):** Tự động đếm ngược nghỉ ngơi sau mỗi set tập thành công và thông báo chuyển sang set tiếp theo.
- [x] **Hệ thống điều tiết thông minh (Autoregulation Feedback):** Đưa ra cảnh báo tăng/giảm tạ dựa trên số reps thực tế người dùng vừa hoàn thành (ví dụ: dưới 8 reps khuyên giảm tạ, trên 15 reps khuyên tăng tạ).
- [x] **Swap & Extra Exercises:** Cho phép đổi bài tập linh hoạt trong buổi tập và thêm/bớt các bài tập phụ (Extra).
- [x] **Kỷ lục cá nhân (Personal Record - PR):** Tự động theo dõi mức tạ nặng nhất và tính toán chỉ số 1RM.
- [ ] **Ước tính tuổi tim mạch (Cardiovascular Age):** Dựa trên nghiên cứu Nes (2014) của NTNU sử dụng chỉ số VO2max ước tính từ giới tính, tuổi, BMI và thói quen vận động.

### 2. Dinh Dưỡng & Lối Sống (Nutrition & Lifestyle)
- [ ] **Nhật ký Dinh dưỡng kiểu Locket:** Chụp ảnh món ăn và lưu trữ kèm thời gian thực tế, hỗ trợ nhập tay Calo & Protein (hoặc AI tự phân tích trong tương lai).
- [ ] **Theo dõi lối sống hàng ngày:**
  - [ ] Lượng nước uống ( Drink water) nhắc nhở định kỳ mỗi 10-15 phút.
  - [ ] Đọc sách (Read books) ghi số trang đã đọc, tên sách và ảnh chụp sách.
  - [ ] Giới hạn thời gian mạng xã hội (Social Media hours limit).
  - [ ] Giờ thức dậy & chất lượng giấc ngủ (Wake-up time & sleep quality).
  - [ ] Tập luyện Cardio ngoài gym (chạy bộ, đi bộ dốc, đá bóng, cầu lông...).
- [ ] **Sơ đồ đóng góp thói quen (GitHub-style Contribution Map):** Tô màu độ đậm nhạt tương ứng mức độ hoàn thành nhiệm vụ trong ngày, bấm vào để xem chi tiết lịch sử.

### 3. Game Hóa RPG (RPG Gamification)
- [x] **Chỉ số thuộc tính nhân vật:** Phân bổ điểm thuộc tính RPG (Wisdom, Confidence, Strength, Discipline, Focus) dựa trên thói quen và chỉ số sinh học.
- [x] **Điểm kinh nghiệm & Cấp độ:** Tăng XP khi tập luyện và hoàn thành thói quen. Giảm XP hoặc mất chuỗi nếu bỏ tập liên tục.
- [ ] **Chuỗi tập luyện (Streak) & Khiên bảo vệ (Shield):**
  - Cấp số lượng khiên (Aura Shields) hàng tuần đóng vai trò ngày nghỉ (Day off) để bảo toàn chuỗi tập (Streak) mà không bị áp lực:
    - **Easy** (Mục tiêu 3 ngày tập/tuần) &rarr; Tặng **4 Shields**.
    - **Medium** (Mục tiêu 4-5 ngày tập/tuần) &rarr; Tặng **3 Shields**.
    - **Hard** (Mục tiêu 6 ngày tập/tuần) &rarr; Tặng **2 Shields**.

### 4. Giao Diện 3D (ThreeJS / WebGL UI)
- [ ] **Mô hình giải phẫu cơ bắp 3D (3D Muscle Map):** Hiển thị trên UI để tô màu mức độ mỏi cơ thực tế dựa trên các bài tập đã hoàn thành, hiển thị tiến trình hồi phục cơ theo thời gian thực (đỏ sang xanh).
- [ ] **Hoạt cảnh động tác 3D:** Hướng dẫn trực quan kỹ thuật tập.

### 5. Tính Năng Xã Hội (Social)
- [ ] Diễn đàn chia sẻ giáo án tập luyện, giao lưu, lập hội bạn bè tập chung (Gym Buddies) tại cùng chi nhánh/phòng tập.
- [ ] Chatting và trang cá nhân (Profiles) công khai.

---

## 🚀 Các Tính Năng Đề Xuất Cải Tiến Của Bạn

1. **AI Nutrition Coach:** Tích hợp trực tiếp API Vision vào mục Dinh dưỡng để tự động phân tích kcal và protein từ ảnh món ăn chụp kiểu Locket, thay vì người dùng phải nhập tay.
2. **Dynamic Rest Timer:** Tự động điều chỉnh thời gian nghỉ giữa hiệp dựa trên mức độ mỏi (RPE) người dùng tự đánh giá ở set trước đó.
3. **Guilds / Gym Alliances:** Tạo nhóm/bang hội trên mạng xã hội tập luyện để cùng tích lũy điểm XP, tranh tài trên bảng xếp hạng (Leaderboard) theo phòng tập thực tế.
4. **Offline Sync Queue:** Cơ chế hàng đợi đồng bộ offline thông minh để khi không có mạng, người dùng vẫn thực hiện đầy đủ các nhiệm vụ và khi có mạng lại, hệ thống sẽ tự động đồng bộ lên Supabase.
