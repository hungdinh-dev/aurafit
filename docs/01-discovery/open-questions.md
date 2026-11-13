# Câu hỏi khai thác nghiệp vụ

Cách dùng: mỗi vòng hỏi 8–12 câu, đi từ tổng quan → chi tiết. Câu trả lời ghi ngay dưới câu hỏi. Khi một câu trả lời chốt được điều gì, ghi thêm vào `decisions.md`.

Trạng thái: `⏳ Chờ trả lời` · `✅ Đã trả lời` · `🔁 Cần hỏi thêm`

---

## Vòng 1 – Tầm nhìn & phạm vi

| Mã | Câu hỏi | Trạng thái |
|---|---|---|
| Q1.1 | Ai sẽ dùng AuraFit: chỉ bạn, nhóm bạn bè, hay phát hành công khai trên App Store / CH Play? | ✅ |
| Q1.2 | Mục tiêu của dự án: dùng cá nhân, học/portfolio, hay sản phẩm kinh doanh? Nếu kinh doanh thì kiếm tiền bằng cách nào? | ✅ |
| Q1.3 | Nếu chỉ được giữ **một** tính năng, đó là gì? Lý do lớn nhất khiến người dùng mở app mỗi ngày? | ✅ |
| Q1.4 | Người dùng mục tiêu: mới tập hay đã có kinh nghiệm? Tập ở gym có máy, ở nhà, hay cả hai? | ✅ |
| Q1.5 | Bản đầu tiên (MVP) **bắt buộc** phải có module nào? (Onboarding, Workout, Gamification, Progress, Lifestyle, Nutrition, 3D, Social) | 🔁 Q2.1 |
| Q1.6 | Phần "game" nặng đến đâu: nhân vật trông thế nào (avatar 2D, 3D, hay chỉ là thẻ chỉ số)? Bỏ tập thì bị phạt đến mức nào? | ✅ |
| Q1.7 | Giáo án do ai tạo: bạn soạn sẵn (như ví dụ Pull day), hay app tự sinh theo mục tiêu / số ngày / trình độ? Có lộ trình dài hạn (tăng tạ dần qua các tuần) không? | ✅ |
| Q1.8 | Nền tảng: iOS, Android, web? Bạn đang dùng điện thoại gì để thử? | ✅ |
| Q1.9 | Ngôn ngữ: chỉ tiếng Việt, hay cần cả tiếng Anh ngay từ đầu? | ✅ |
| Q1.10 | Ràng buộc: bạn làm một mình? Mỗi tuần bao nhiêu giờ? Muốn có bản dùng được khi nào? Giữ stack cũ (Expo + Supabase) hay sẵn sàng chọn lại? | ✅ (một phần) |

### Câu trả lời vòng 1 (2026-11-13)

- **Q1.1** Thử nghiệm qua **TestFlight** với khoảng **5–10 người bạn**.
- **Q1.2** **Dùng cá nhân trước**, định hướng **kinh doanh** nếu mọi thứ ổn.
- **Q1.3** Tính năng chính: **chụp ảnh để tính calo**, đảm bảo người dùng ăn đúng **TDEE**. Người dùng muốn theo dõi sức khoẻ **kể cả ngày không tập**: những gì họ nạp vào, chất lượng giấc ngủ, mọi thứ liên quan sức khoẻ.
- **Q1.4** Cho **tất cả** người dùng (mọi trình độ).
- **Q1.5** "Onboard, workout, …" → cần xác nhận danh sách đầy đủ ở **Q2.1**.
- **Q1.6** Game hoá = **tăng các chỉ số "cứng"** của người dùng. Claude được tự thiết kế. Mục đích: **tạo dopamine, hưng phấn, có thúc ép, có động lực**.
- **Q1.7** Claude được **phân tích và tự tạo giáo án**. Cần **cả lộ trình dài hạn và ngắn hạn**, **ưu tiên ngắn hạn nhưng phải đúng logic**.
- **Q1.8** **iOS trước**, qua TestFlight ("bản free" – xem ghi chú chi phí ở R9).
- **Q1.9** **Đa ngôn ngữ i18n**, làm **tiếng Việt + tiếng Anh** trước, thêm ngôn ngữ khác sau.
- **Q1.10** Nhờ Claude đề xuất công nghệ. Supabase vẫn là lựa chọn tốt, Expo hỗ trợ test trên iOS. Chưa trả lời: làm một mình?, số giờ/tuần, mốc thời gian (→ Q2.12).

---

## Vòng 2 – Trọng tâm dinh dưỡng & sức khoẻ, chốt MVP

| Mã | Câu hỏi | Trạng thái |
|---|---|---|
| Q2.1 | MVP đề xuất: **Onboarding + Nutrition (ảnh → kcal) + Sức khoẻ cơ bản (ngủ, nước, cân nặng) + Workout + Gamification bản nhẹ + Tổng quan hôm nay**. Để sau MVP: 3D, Social, đọc sách, giới hạn MXH. Bạn đồng ý không, muốn thêm/bớt gì? | ⏳ |
| Q2.2 | Người dùng chọn mục tiêu nào: giảm mỡ / tăng cơ / giữ cân / sức khoẻ chung? Muốn **người dùng chọn tốc độ** (ví dụ giảm 0,25 / 0,5 / 0,75 kg mỗi tuần) hay app tự quyết? | ⏳ |
| Q2.3 | Luồng ảnh: chụp → AI ước tính → **người dùng xác nhận/sửa**. Khi ảnh mơ hồ (bát phở không rõ size), AI nên **hỏi thêm 1–2 câu** hay **đoán luôn** cho nhanh? | ⏳ |
| Q2.4 | Chỉ số dinh dưỡng cần theo dõi: kcal, protein, carb, fat – có cần thêm chất xơ, đường, natri? | ⏳ |
| Q2.5 | Ngoài chụp ảnh, MVP cần cách nhập nào: gõ/nói mô tả ("2 trứng luộc, 1 bát cơm"), chọn lại món hay ăn, quét mã vạch? | ⏳ |
| Q2.6 | "Kiểu Locket" nghĩa là **chia sẻ ảnh bữa ăn với bạn bè** (như Locket thật), hay chỉ là **dòng thời gian ảnh riêng tư** của mình? | ⏳ |
| Q2.7 | Ngày người dùng tập hoặc đi bộ nhiều, **mục tiêu kcal có tăng theo** không? Có muốn lấy bước chân / năng lượng vận động từ **Apple Health** không? | ⏳ |
| Q2.8 | Sức khoẻ "mọi thứ" trong MVP gồm những gì: giấc ngủ, nước, cân nặng, bước chân, nhịp tim…? **Tự nhập hay lấy từ Apple Health / Apple Watch**? Nhóm bạn test có đeo Apple Watch không? | ⏳ |
| Q2.9 | Cân nặng: người dùng cân bao lâu một lần? Có muốn app **tự chỉnh TDEE theo xu hướng cân nặng thực tế** (adaptive TDEE) không? | ⏳ |
| Q2.10 | "Thúc ép" chấp nhận đến mức nào: thông báo nhắc, mất streak, chỉ số tụt, cảnh báo đỏ khi ăn vượt? Có giới hạn không (ví dụ không nhắc sau 22h)? | ⏳ |
| Q2.11 | Ngân sách giai đoạn beta: phí Apple Developer **99 USD/năm** (bắt buộc để dùng TestFlight) + chi phí AI cho mỗi ảnh. Bạn chấp nhận chi khoảng bao nhiêu mỗi tháng? | ⏳ |
| Q2.12 | Bạn làm một mình? Mỗi tuần dành được bao nhiêu giờ? Muốn nhóm bạn bắt đầu test vào khoảng khi nào? | ⏳ |

### Câu trả lời vòng 2 (2026-11-13)

- **Q2.1** Đồng ý MVP. Phần sức khoẻ phải **làm hoàn chỉnh**: giấc ngủ, nước, cân nặng, lượng nạp vào. Claude tự lên thiết kế.
- **Q2.2** Có **3 mục tiêu chính**; người dùng **tự chọn tốc độ** (kiểu mức "hard"), và có thêm lựa chọn **để app tự quyết**.
- **Q2.3** AI được hỏi thêm **1–2 câu, tối đa 3**, vì mỗi lần hỏi tốn token. → Thiết kế: hỏi trong **cùng một lần gọi**, trả lời tính ngay trên máy (xem `nutrition.md`).
- **Q2.4** **Đường là bắt buộc.** Chất xơ, natri là **tuỳ chọn** người dùng bật. (Hỏi lại: thêm chất có phải chụp nhiều ảnh hơn không? → Không, xem `nutrition.md`.)
- **Q2.5** Đồng ý cả 3 cách nhập thêm: **mô tả bằng chữ/giọng nói**, **chọn lại món**, **quét mã vạch**.
- **Q2.6** Hai ý:
  1. Có **chia sẻ món ăn theo ngày** với bạn bè.
  2. Cần **"bảng món của tôi"** để chọn lại món lặp lại. Ví dụ cà phê sáng: chụp thứ Hai, thứ Ba → thứ Năm chỉ cần chọn lại. **Phân tích UI theo hướng này.**
- **Q2.7** Có **giao diện tuyên dương** khi phá target ngày. Phân tích tổng thể theo **tuần / tháng / năm**, dữ liệu gốc lưu **theo ngày**.
- **Q2.8** Làm cả **nhập tay** và **Apple Watch**; có người đeo **Garmin Forerunner**. Cần **định dạng dữ liệu chuẩn** để nối nguồn ngoài. **Ưu tiên nhập tay trước.**
- **Q2.9** Chưa biết cân bao lâu; **app gợi ý tần suất và nhắc cân** để cập nhật TDEE. Hỏi: cập nhật ngắn hạn có lợi hơn không? → Trả lời ở `lifestyle.md` (theo dõi xu hướng hằng ngày, đổi mục tiêu hằng tuần).
- **Q2.10** Claude tự thiết kế. Có thúc ép và có thưởng: vượt chỉ tiêu ngày → tặng **khiên hoặc mảnh khiên** để đổi **ngày ăn tự do**. App đóng vai **PT chuyên nghiệp, khắc nghiệt tuỳ người dùng thiết lập**.
- **Q2.11** **Tối ưu chi phí là ưu tiên.** Dùng các gói rẻ như **Gemini** trước; Claude hoặc mô hình mạnh hơn để dành cho tác vụ khó.
- **Q2.12** Giao việc cho Claude, **làm càng sớm càng tốt**.

---

## Vòng 3 – Những điểm còn chặn thiết kế

| Mã | Câu hỏi | Trạng thái |
|---|---|---|
| Q3.1 | 3 mục tiêu chính là **giảm mỡ / giữ cân / tăng cơ** – đúng không? | ✅ |
| Q3.2 | Chia sẻ món ăn theo ngày có nằm trong **bản beta** không? Ai xem được: **bạn bè đã kết bạn**, hay **cả nhóm test**? Người dùng có thể ẩn từng bữa không? | ✅ |
| Q3.3 | **Ngày ăn tự do**: vẫn ghi món để có dữ liệu nhưng không bị trừ điểm – đúng ý bạn? Giới hạn tối đa mấy ngày/tháng? | ✅ |
| Q3.4 | 3 mức huấn luyện viên **Nhẹ nhàng / Tiêu chuẩn / Khắc nghiệt** (chi tiết ở `gamification.md`). Ở mức Khắc nghiệt, thông báo được phép **gắt đến đâu** (ví dụ "Hôm qua bạn trượt protein lần thứ 3 trong tuần.")? | ✅ |
| Q3.5 | Workout trong MVP: chỉ **tập ở gym**, hay cả **tại nhà / không dụng cụ**? | ✅ |
| Q3.6 | Đăng nhập: **Sign in with Apple + email** là đủ cho beta? | ✅ |
| Q3.7 | Bạn duyệt **bản thiết kế game hoá** trong `gamification.md` – có gì muốn đổi? | ✅ |

### Câu trả lời vòng 3 (2026-11-13)

- **Q3.1** Đúng 3 mục tiêu. Thêm hướng **cải thiện chất lượng cuộc sống**: khung thời gian làm việc, nước, đọc sách… dạng **daily task**.
- **Q3.2** Chỉ **những người đã kết bạn** xem được.
- **Q3.3** Cho phép cheat meal / ngày tự do, **số ngày do người dùng đặt** (ví dụ 2 ngày/tuần). App **báo cáo ảnh hưởng tới lộ trình**; ăn tự do quá số ngày đã đặt thì **điểm giảm**. Mức độ cụ thể để Claude thiết kế.
- **Q3.4** **Không quá gắt.** Giọng văn **gần gũi Gen Z**, kiểu Duolingo; Claude đưa ra các lựa chọn.
- **Q3.5** Có **tập tại nhà**, hỗ trợ cả **calisthenics**.
- **Q3.6** Dùng **Google**; **Apple tính sau**, vì Supabase hỗ trợ sẵn.
- **Q3.7** Claude tự lên **ý tưởng toàn diện**, phải **ấn tượng hơn các app khác**.

---

## Vòng 4 – Xác nhận cuối trước khi code

| Mã | Câu hỏi | Trạng thái |
|---|---|---|
| Q4.1 | Linh vật: một **linh vật gốc** tên tạm **"Auri"** (đốm sáng nhỏ, đổi màu theo Aura, đổi tâm trạng theo dữ liệu thật của bạn) – bạn thích hướng này, hay muốn **avatar giống chính người dùng**? Có ý tưởng tên khác không? | ⏳ |
| Q4.2 | Giọng văn mặc định: **Bestie** (Gen Z, đùa nhẹ), **Coach** (gọn, chuyên nghiệp), hay **Drama** (làm quá kiểu meme)? Ví dụ ở `gamification.md` §1. | ⏳ |
| Q4.3 | "Khung thời gian làm việc" nghĩa là: (a) **hẹn giờ làm việc tập trung** kiểu Pomodoro ngay trong app, (b) **đặt giờ làm việc** để app không làm phiền lúc đó, hay (c) **ghi số giờ đã làm** mỗi ngày? | ⏳ |
| Q4.4 | Ngày tự do: cho đặt **0–3 ngày/tuần** – đủ chưa? Mặc định **bù trong tuần** (các ngày khác ăn bớt chút, vẫn đúng lộ trình) hay **không bù** (chấp nhận về đích chậm hơn)? | ⏳ |
| Q4.5 | Kết bạn bằng cách nào: **username**, **mã QR**, **link mời** (có thể cả ba)? | ⏳ |
| Q4.6 | Trong `signature-features.md`, tính năng nào bạn **muốn có ngay trong beta**? | ⏳ |

### Câu trả lời vòng 4 (2026-11-13)

Chủ dự án giao Claude tự quyết cả vòng 4, chỉ yêu cầu thêm: **hỗ trợ nam và nữ bằng 2 nhân vật / 2 model khác nhau**. Kết quả ghi ở D-032 → D-038:

- **Q4.1** 2 nhân vật đại diện **Nam (Kai) / Nữ (Mira)**, người dùng chọn tự do và đổi được, hào quang theo Aura (D-032).
- **Q4.2** Giọng mặc định: **Bestie** (D-033).
- **Q4.3** Hẹn giờ làm việc tập trung trong Daily Tasks; giờ làm việc dùng làm khung "không làm phiền" (D-034).
- **Q4.4** 0–3 ngày tự do/tuần, mặc định **bù trong tuần** (D-035).
- **Q4.5** Tìm theo **username** + **link mời** (kèm mã QR của link) (D-036).
- **Q4.6** Beta gồm tính năng chữ ký **1–7**; 8–12 để sau (D-037).

---

## Backlog câu hỏi theo module (cho các vòng sau)

### Onboarding & Profile
- **OB-1** Khảo sát bắt buộc tối thiểu những gì? Phần nào hỏi dần sau?
- **OB-2** Đăng nhập: email/mật khẩu, Google, Apple, username? Có cho dùng không cần tài khoản (khách/offline)?
- **OB-3** Người dùng không biết % mỡ / % cơ thì xử lý thế nào?
- **OB-4** Có cập nhật cân nặng / số đo định kỳ không? Bao lâu một lần?
- **OB-5** Đơn vị: chỉ kg, hay cho chọn lbs?
- **OB-6** Có buổi "test" sức mạnh đầu tiên để gợi ý tạ chính xác hơn?

### Workout
- **WO-1** Tạ gợi ý ban đầu tính thế nào: % cân nặng (bản cũ), test set, hay người dùng tự nhập?
- **WO-2** Autoregulation: tăng/giảm bao nhiêu kg? Có phụ thuộc dụng cụ (máy bước 5 kg, tạ đơn bước 2 kg)? Áp dụng ngay set sau hay buổi sau?
- **WO-3** Giữa các buổi: khi nào app tự tăng tạ cho lần sau (progressive overload)?
- **WO-4** Swap: "tương đương" nghĩa là gì (cùng cơ chính? bạn tự gán cặp?). Swap có được nhớ cho các buổi sau?
- **WO-5** Bài extra: hệ thống gợi ý sẵn hay chọn tự do? Bớt bài/set có ảnh hưởng XP/streak không?
- **WO-6** Có được tập bù ngày khác, đổi lịch, tập 2 buổi/ngày? (mâu thuẫn C2)
- **WO-7** Rest timer: khi app chạy nền / khoá màn hình vẫn phải báo? Rung, âm thanh?
- **WO-8** Bài theo thời gian (plank), bodyweight, cardio máy trong buổi – cần ghi những gì?
- **WO-9** Thư viện bài tập: ai soạn, khoảng bao nhiêu bài, ảnh/video lấy từ đâu?
- **WO-10** Có ghi RPE / cảm nhận / ghi chú mỗi set? Có set khởi động tách riêng?

### Gamification
- **GA-1** XP đến từ đâu, mỗi hành động bao nhiêu? Tập và thói quen cái nào nặng hơn?
- **GA-2** Streak đếm theo ngày có lịch tập, hay theo tuần đạt mục tiêu? (mâu thuẫn C5)
- **GA-3** Khiên: 2/tuần cố định, theo độ khó, hay mua bằng XP? (mâu thuẫn C1)
- **GA-4** XP decay: sau bao lâu thì giảm, giảm bao nhiêu, có tụt level không?
- **GA-5** Chỉ số nhân vật: tự động theo hành vi hay người dùng phân bổ điểm? Chỉ số dùng để làm gì? (mâu thuẫn C4)
- **GA-6** Aura khác Level thế nào? Aura có giảm không?
- **GA-7** Nhiệm vụ hằng ngày / hằng tuần cụ thể là gì?
- **GA-8** Phần thưởng: huy hiệu, trang phục nhân vật, mở khoá tính năng?
- **GA-9** Chống gian lận XP có quan trọng không (nếu có bảng xếp hạng)?

### Nutrition
- **NU-1** Ảnh bắt buộc hay tuỳ chọn? Có cho nhập nhanh không cần ảnh?
- **NU-2** Chỉ kcal + protein, hay thêm carb / fat?
- **NU-3** Có cần thư viện món ăn Việt để chọn nhanh?
- **NU-4** Mục tiêu kcal/protein do app tính (TDEE) hay người dùng tự nhập?
- **NU-5** AI phân tích ảnh: muốn có lúc nào? Chấp nhận chi phí API?

### Lifestyle
- **LS-1** Danh sách thói quen cố định, hay người dùng tự thêm thói quen?
- **LS-2** Nhắc uống nước: tần suất thực tế, giờ yên lặng? (mâu thuẫn C3)
- **LS-3** Thời gian MXH: người dùng tự khai báo, hay muốn đọc tự động (iOS hạn chế)?
- **LS-4** Giấc ngủ: tự nhập hay lấy từ Apple Health / Google Fit?
- **LS-5** Ảnh sách làm "bằng chứng" – có cần xác minh gì không?
- **LS-6** Cardio ngoài gym: kcal tự nhập hay app ước tính?

### Progress & Insights
- **PI-1** Heatmap tô màu theo gì: có tập hay không, khối lượng tập, hay tổng điểm cả ngày (tập + thói quen)?
- **PI-2** Tuổi tim mạch chỉ là ước tính – chấp nhận và cần ghi chú miễn trừ?
- **PI-3** Cần theo dõi cân nặng / số đo / ảnh body theo thời gian?
- **PI-4** Báo cáo tuần/tháng có gửi thông báo không?

### 3D Anatomy
- **AN-1** 3D là điểm khác biệt cốt lõi hay chỉ "có thì tốt"?
- **AN-2** Mô hình 3D lấy từ đâu (mua, tự dựng, mã nguồn mở)?
- **AN-3** Chia cơ chi tiết đến mức nào (khoảng bao nhiêu nhóm cơ)?
- **AN-4** Nhân vật RPG và mô hình giải phẫu là một hay hai thứ khác nhau?

### Social
- **SO-1** Social có nằm trong tầm nhìn 1 năm không?
- **SO-2** Có làm việc với phòng gym thật (đối tác) không?
- **SO-3** Dữ liệu nào được công khai, dữ liệu nào riêng tư?
