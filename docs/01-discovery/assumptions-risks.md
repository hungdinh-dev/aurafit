# Giả định & rủi ro

## Giả định chưa kiểm chứng

| Mã | Giả định | Kiểm chứng bằng | Trạng thái |
|---|---|---|---|
| A1 | Người dùng sẵn sàng nhập số rep sau **mỗi** set | Q1.3, thử nghiệm thực tế | ❓ |
| A2 | Game hoá RPG làm người dùng tập đều hơn | Q1.6 | ❓ |
| A3 | Gợi ý tạ theo % cân nặng đủ an toàn và hợp lý cho người mới | WO-1 | ❓ |
| A4 | Người dùng chịu ghi thêm thói quen (nước, ngủ, sách, MXH) mỗi ngày | LS-1 | ❓ |
| A5 | Một app gộp tập + ăn + thói quen tốt hơn nhiều app chuyên biệt | Q1.3 | 🟧 Chủ dự án tin là đúng (D-005); kiểm chứng ở beta |
| A6 | AI ước tính kcal từ ảnh **đủ chính xác với món Việt** (cơm, phở, bún, đồ chiên…) để người dùng tin | Thử nghiệm với 30–50 ảnh món Việt trước khi xây UI | ❓ |
| A7 | Người dùng chịu chụp **mọi bữa**, kể cả ăn vặt, đồ uống | Beta | ❓ |

## Rủi ro

| Mã | Rủi ro | Ảnh hưởng | Hướng giảm thiểu |
|---|---|---|---|
| R1 | **Phạm vi quá rộng** (8 module) cho một người làm | Không bao giờ ra được bản dùng được | Chốt MVP hẹp ở Q1.5 |
| R2 | **Nhập liệu quá nhiều** → người dùng bỏ | Tỷ lệ giữ chân thấp | Mặc định thông minh, 1 chạm để xác nhận set |
| R3 | **Gợi ý tạ sai** gây chấn thương | An toàn người dùng | Gợi ý bảo thủ, miễn trừ trách nhiệm, cho chỉnh tay |
| R4 | Phạt (decay, mất streak) gây **nản** | Người dùng bỏ app | Khiên, phạt nhẹ, cách quay lại dễ |
| R5 | **3D trên điện thoại** nặng, tốn công | Chậm tiến độ, giật lag | Để sau MVP hoặc làm bản 2D trước |
| R6 | **Thông báo/đếm giờ chạy nền** bị iOS/Android giới hạn | Rest timer không báo | Dùng thông báo cục bộ đặt lịch trước |
| R7 | **Đọc thời gian MXH tự động** bị iOS chặn | Tính năng không làm được | Cho người dùng tự khai báo |
| R8 | Dữ liệu sức khoẻ là **dữ liệu nhạy cảm** | Quyền riêng tư | Mặc định riêng tư, chỉ công khai khi người dùng chọn |
| R9 | **TestFlight không miễn phí**: cần Apple Developer Program 99 USD/năm | Không phát được bản beta nếu không đăng ký | Đăng ký trước khi tới mốc beta; trong lúc phát triển dùng Expo Go / development build trên máy mình |
| R10 | **AI ước tính sai** (khẩu phần, dầu mỡ, nước sốt) | Người dùng mất niềm tin, mục tiêu kcal vô nghĩa | Hiển thị độ tin cậy, cho sửa nhanh, hỏi thêm khi mơ hồ, học từ chỉnh sửa của người dùng |
| R11 | **Chi phí AI tăng** theo số ảnh | Không bền vững khi kinh doanh | Nén ảnh, hạn mức ảnh/ngày, cache món lặp lại, cho chọn lại "món hay ăn" |
| R12 | Đếm calo + "thúc ép" có thể **gây hại cho người có vấn đề ăn uống** | An toàn người dùng, đánh giá App Store | Sàn kcal an toàn, không phạt khi ăn ít quá mức, ngôn từ tích cực, miễn trừ y tế |
| R13 | App Store yêu cầu **Sign in with Apple** (khi có đăng nhập Google) và chính sách quyền riêng tư cho dữ liệu sức khoẻ | Bị từ chối khi lên store; có thể bị nhắc ở vòng duyệt beta cho người test bên ngoài | Beta dùng Google + email (D-029). Nếu bị nhắc, thêm người test làm **người test nội bộ** trong App Store Connect (không qua duyệt) hoặc thêm Apple sớm. Bắt buộc có Apple trước khi lên store |
| R14 | **Phạm vi phình to** (9 module + 12 tính năng chữ ký) | Beta trễ | Chỉ làm tính năng chữ ký được chọn ở Q4.6; phần còn lại vào v1.1+ |
| R15 | Giọng văn đùa **làm người dùng khó chịu** | Tắt thông báo, bỏ app | Có giọng Coach trung tính; luật viết (`gamification.md` §1b); thử với nhóm bạn trước |
| R20 | **Chép code / dữ liệu từ openGym** (AGPL-3.0) vào app đóng nguồn | Buộc phải mở toàn bộ mã nguồn AuraFit | Chỉ học ý tưởng; chỉ dùng phần MIT (MuscleMap, exercises-dataset) sau khi kiểm tra repo gốc và ghi công (`feature-backlog.md` §0) |
| R18 | Dùng **gói miễn phí Gemini** với ảnh của người dùng thật: dữ liệu có thể bị dùng để cải thiện sản phẩm của Google | Vi phạm quyền riêng tư, mất niềm tin | Gói miễn phí chỉ cho ảnh thử nghiệm; bật gói trả phí trước beta kín (D-047) |
| R19 | **Thiếu chức năng xoá tài khoản trong app** | App Store từ chối | Làm trước khi nộp (launch-plan §2) |
| R17 | **Bản quyền media bài tập**: GIF / video trên web khác không được phép dùng | Bị yêu cầu gỡ app, kiện tụng khi kinh doanh | Chỉ dùng nguồn có giấy phép, lưu nguồn + giấy phép từng file (D-041); beta có thể tạm dùng hình tĩnh |
| R16 | **Story bữa ăn** bị dùng chia sẻ ảnh không phù hợp | Trải nghiệm xấu | Chỉ bạn bè đã kết bạn; chặn / huỷ kết bạn; báo cáo ảnh (sau beta) |
