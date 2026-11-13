# Tóm Tắt Hệ Thống Cơ Sở Dữ Liệu AuraFit: Hiện Tại & Đề Xuất

Tài liệu này tổng hợp cấu trúc các bảng hiện có trong hệ thống và định nghĩa thiết kế các bảng đề xuất mới nhằm hoàn thiện nghiệp vụ của Workout Hub, Nhật ký Dinh dưỡng (Locket-style), Theo dõi phong cách sống (Lifestyle), và tính năng Cộng đồng (Social).

---

## 1. Các Bảng Hiện Có Trong Hệ Thống (Existing Tables)

### A. Bảng `profiles` (Thông tin người dùng & Chỉ số sinh học, RPG)
* **Mục đích:** Lưu trữ hồ sơ người dùng, các chỉ số hình thể ban đầu và điểm kinh nghiệm RPG.
* **Các trường:**
  - `id` (uuid, khóa chính) — Tham chiếu tới `auth.users(id)`
  - `username` (text, duy nhất) — Tên đăng nhập
  - `full_name` (text) — Tên đầy đủ
  - `avatar_url` (text) — Link ảnh đại diện
  - `level` (integer, mặc định 1)
  - `xp` (integer, mặc định 0)
  - `streak_days` (integer, mặc định 0)
  - `aura_shields` (integer, mặc định 0)
  - `gender` (text) — Giới tính
  - `age` (integer) — Tuổi
  - `weight` (numeric) — Cân nặng (dùng để tính tạ gợi ý)
  - `height` (numeric) — Chiều cao
  - `body_fat` (numeric) — Tỉ lệ mỡ
  - `muscle_percent` (numeric) — Tỉ lệ cơ
  - **RPG Attributes:** `wisdom`, `confidence`, `strength`, `discipline`, `focus` (integer)
  - **Mục tiêu Onboarding:** `calories_target`, `protein_target`, `water_target`, `train_days` (numeric/integer)
  - **Thói quen sinh hoạt:** `social_hours` (giờ lướt MXH), `book_pages` (trang sách đã đọc), `book_title` (tên sách đang đọc), `wake_time` (giờ dậy), `sleep_quality` (chất lượng ngủ: good/medium/bad)
  - **Trường nâng cấp:**
    - `cardio_age` (integer) — Tuổi tim mạch
    - `preferred_unit` (text, mặc định 'kg') — Đơn vị cân nặng ('kg' hoặc 'lbs')

### B. Bảng `exercises` (Thư viện bài tập gốc)
* **Mục đích:** Lưu trữ danh mục bài tập chuẩn của hệ thống.
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `name` (text, duy nhất) — Ví dụ: Bench Press (Đẩy Ngực Ngang)
  - `primary_muscle` (text) — Cơ chính tác động (Chest, Lats, Quads...)
  - `secondary_muscles` (text[]) — Các nhóm cơ phụ tham gia
  - `equipment` (text) — Dụng cụ (Barbell, Dumbbell, Cable...)
  - `instructions` (text) — Hướng dẫn cách tập
  - `image_url` (text) — Ảnh động hướng dẫn
  - `default_reps_min`, `default_reps_max` (integer) — Số reps tiêu chuẩn (mặc định 8-12)
  - `xp_per_set` (integer, mặc định 10) — XP nhận được sau mỗi set
  - **Trường nâng cấp:**
    - `video_url` (text) — Link video hướng dẫn động tác thực tế
    - `is_compound` (boolean, mặc định true) — Xác định bài phức hợp hay biệt lập

### C. Bảng `workout_plans` (Giáo trình tập luyện theo ngày/tuần)
* **Mục đích:** Lưu các buổi tập mẫu theo ngày (Pull day, Push day, Legs...).
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `user_id` (uuid, liên kết profiles, nullable) — NULL biểu thị đây là giáo án mặc định hệ thống
  - `name` (text) — Tên buổi tập
  - `description` (text)
  - `day_of_week` (integer) — Ngày trong tuần (1: Thứ Hai, ..., 7: Chủ Nhật)
  - `difficulty` (text, mặc định 'Beginner')
  - `created_by` (text, mặc định 'system')
  - **Trường nâng cấp:**
    - `is_active` (boolean, mặc định true) — Kích hoạt sử dụng giáo trình

### D. Bảng `workout_plan_exercises` (Bảng trung gian liên kết bài tập vào giáo trình)
* **Mục đích:** Định nghĩa buổi tập mẫu gồm những bài tập nào, bao nhiêu set/reps và tỷ lệ tạ gợi ý.
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `plan_id` (uuid, liên kết `workout_plans`)
  - `exercise_id` (uuid, liên kết `exercises`)
  - `sequence_order` (integer) — Thứ tự bài tập
  - `default_sets` (integer, mặc định 3) — Số hiệp mặc định
  - `default_reps_min`, `default_reps_max` (integer)
  - `default_weight_ratio` (numeric) — Tỷ lệ tạ gợi ý so với cân nặng cơ thể (ví dụ: 0.50 tương đương 50% cân nặng)
  - **Trường nâng cấp:**
    - `rest_duration_seconds` (integer, mặc định 90) — Thời gian nghỉ mặc định

### E. Bảng `workouts` (Nhật ký phiên tập của người dùng)
* **Mục đích:** Ghi lại kết quả sau khi người dùng bấm "Hoàn thành" buổi tập thực tế.
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `user_id` (uuid, liên kết profiles)
  - `title` (text) — Tên buổi tập
  - `duration_minutes` (integer) — Thời gian tập thực tế
  - `calories_burned` (integer) — Lượng calo tiêu thụ
  - `xp_gained` (integer) — Tổng XP đạt được
  - `plan_id` (uuid, liên kết `workout_plans`, nullable)
  - `created_at` (timestamp)
  - **Trường nâng cấp:**
    - `status` (text, mặc định 'Completed') — Trạng thái (Completed / Cancelled)
    - `feeling_rating` (integer) — Mức độ hài lòng sau buổi tập (1 - 5)

### F. Bảng `exercise_set_logs` (Nhật ký chi tiết của từng set tập)
* **Mục đích:** Lưu trữ số cân nặng nâng được và số reps hoàn thành của từng set.
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `workout_id` (uuid, liên kết `workouts`)
  - `exercise_id` (uuid, liên kết `exercises`)
  - `set_number` (integer) — Số thứ tự hiệp
  - `weight_kg` (numeric) — Số cân tạ thực nâng
  - `reps_completed` (integer) — Số reps thực tế nâng
  - `is_completed` (boolean)
  - `xp_gained` (integer)
  - `created_at` (timestamp)
  - **Trường nâng cấp:**
    - `rpe` (integer) — Chỉ số RPE tự đánh giá lực nỗ lực (1 - 10)

---

## 2. Các Bảng Đề Xuất Thêm Mới (Recommended Tables)

### G. Bảng `personal_records` (Theo dõi kỷ lục nâng tạ - PR)
* **Mục đích:** Lưu lại mức tạ nặng nhất người dùng từng nâng của từng bài tập để làm chỉ số 1RM.
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `user_id` (uuid, liên kết `profiles`, not null)
  - `exercise_id` (uuid, liên kết `exercises`, not null)
  - `max_weight_kg` (numeric, not null) — Cân tạ kỷ lục
  - `reps` (integer, not null) — Số reps hoàn thành tương ứng
  - `calculated_1rm` (numeric) — Chỉ số 1RM ước tính
  - `achieved_at` (timestamp, mặc định now())

### H. Bảng `food_logs` (Nhật ký dinh dưỡng kiểu Locket-style)
* **Mục đích:** Lưu thông tin bữa ăn kèm ảnh chụp hiển thị dạng timeline Locket.
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `user_id` (uuid, liên kết `profiles`, not null)
  - `meal_type` (text) — Breakfast, Lunch, Dinner, Snack
  - `food_name` (text) — Tên món
  - `calories_kcal` (integer, not null) — Calo nạp vào
  - `protein_g` (integer, mặc định 0) — Số protein
  - `image_url` (text) — Link ảnh chụp thực tế món ăn
  - `created_at` (timestamp, mặc định now())

### I. Bảng `lifestyle_metrics` (Nhật ký chỉ số lối sống hàng ngày)
* **Mục đích:** Lưu thông tin nước uống, đọc sách, giấc ngủ, MXH.
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `user_id` (uuid, liên kết `profiles`, not null)
  - `log_date` (date, mặc định current_date, duy nhất theo user_id)
  - `water_intake_liters` (numeric, mặc định 0.0) — Số lít nước đã uống
  - `social_media_minutes` (integer, mặc định 0) — Số phút MXH
  - `sleep_hours` (numeric) — Số giờ ngủ đêm qua
  - `sleep_quality` (text) — Đánh giá ngủ (good/medium/bad)
  - `books_read_pages` (integer, mặc định 0) — Số trang sách đã đọc
  - `book_title` (text) — Cuốn sách đọc
  - `book_page_image_url` (text) — Link ảnh chụp làm minh chứng
  - `created_at` (timestamp, mặc định now())

### J. Bảng `cardio_logs` (Nhật ký Cardio ngoài nâng tạ)
* **Mục đích:** Ghi lại đi bộ dốc máy, cầu lông, đá bóng...
* **Các trường:**
  - `id` (uuid, khóa chính)
  - `user_id` (uuid, liên kết `profiles`, not null)
  - `activity_type` (text, not null) — Loại (Đi bộ dốc, Cầu lông, Chạy bộ...)
  - `duration_minutes` (integer, not null) — Thời gian tập
  - `calories_burned` (integer, not null) — Số calo đốt
  - `incline_percent` (numeric) — Độ dốc máy (%)
  - `speed_kmh` (numeric) — Tốc độ trung bình
  - `notes` (text) — Ghi chú
  - `created_at` (timestamp, mặc định now())
