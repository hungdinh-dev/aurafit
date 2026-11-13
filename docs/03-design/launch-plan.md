# Kế hoạch ra mắt công khai (D-046)

Tiếp nối `mvp-roadmap.md` sau mốc M7 (beta kín). Cập nhật: 13/11/2026.

## 1. Các giai đoạn

| Giai đoạn | Nội dung | Điều kiện để sang bước tiếp |
|---|---|---|
| **Beta kín** (M7) | TestFlight cho 5–10 người bạn (người test nội bộ), 2–4 tuần | ≥ 70 % người test ghi ≥ 2 bữa/ngày · dùng ≥ 5 ngày/tuần sau 4 tuần · đo được chi phí AI thật mỗi người |
| **Beta mở rộng** | TestFlight bằng link công khai, 50–200 người. Lần đầu phải qua vòng duyệt beta của Apple | Gần như không còn lỗi nghiêm trọng · sai số AI với món Việt chấp nhận được · tỷ lệ giữ chân sau 4 tuần ổn định |
| **Chuẩn bị App Store** | Hoàn thành danh sách §2 | Apple duyệt bản phát hành |
| **v1.0 – ra mắt miễn phí** | iOS, tiếng Việt + tiếng Anh, chưa thu tiền | Có nhóm người dùng đều đặn, chi phí mỗi người nằm trong dự tính |
| **v1.x – bắt đầu thu tiền** | Gói miễn phí + Premium (§3) | Doanh thu bù chi phí AI + server |
| **Sau đó** | Android, bản đồ cơ 3D, cộng đồng mở rộng | – |

## 2. Danh sách bắt buộc trước khi lên App Store

- [ ] **Sign in with Apple** – bắt buộc vì app có đăng nhập Google (D-029).
- [ ] **Xoá tài khoản ngay trong app** – Apple yêu cầu với mọi app cho tạo tài khoản. Xoá cả dữ liệu trên Supabase (đã có `on delete cascade`).
- [ ] **Chính sách quyền riêng tư** công khai + khai báo dữ liệu (App Privacy) trên trang App Store, ghi rõ dữ liệu sức khoẻ.
- [ ] **Lời giải thích khi xin quyền** Apple Health, camera, thông báo.
- [ ] **Miễn trừ y tế**: app không thay thế tư vấn của bác sĩ / chuyên gia dinh dưỡng.
- [ ] **Media bài tập có giấy phép** đầy đủ (D-041).
- [ ] **Ảnh và mô tả App Store** tiếng Việt + tiếng Anh.
- [ ] **Hạ tầng sẵn sàng**: Supabase gói trả phí (gói miễn phí tự tạm dừng khi không hoạt động), sao lưu, theo dõi lỗi.
- [ ] **Gemini API gói trả phí** (§4, D-047).

## 3. Gói miễn phí / Premium (đề xuất, chốt ở v1.x)

| | Miễn phí | Premium |
|---|---|---|
| Ghi món từ Món của tôi, Gần đây, mã vạch | ✅ không giới hạn | ✅ |
| Ghi món bằng ảnh / mô tả AI | Vài lần mỗi ngày | Nhiều hơn (vẫn có hạn mức hợp lý) |
| Điểm ngày, streak, khiên, nhiệm vụ | ✅ | ✅ |
| Buổi tập, thư viện bài tập | ✅ | ✅ |
| Bản đồ cơ chi tiết + "Vì sao?" | Bản cơ bản | ✅ đầy đủ |
| Giáo án nâng cao, readiness | – | ✅ |
| AuraFit Wrapped, widget, Live Activity | – | ✅ |

- Thanh toán qua **mua trong app của Apple**.
- Apple thu **15 %** nếu doanh thu dưới 1 triệu USD/năm và đã đăng ký chương trình doanh nghiệp nhỏ; nếu không là 30 %.
- Giá bán quyết định sau khi có số liệu chi phí AI thật từ beta.

## 4. Chi phí AI và MCP (D-047)

**MCP không tốn tiền.**
- MCP là giao thức mở để nối trợ lý AI khi lập trình (Claude Code, Gemini CLI…) với công cụ, ví dụ database Supabase.
- Chỉ tốn tiền cho chính trợ lý AI bạn dùng.
- App chạy thật **không đi qua MCP**: Edge Function gọi thẳng Gemini API.

**Gemini API có tốn phí, nhưng rẻ** (theo bảng giá Google tra ngày 13/11/2026, cần kiểm tra lại khi đăng ký):

| | Ghi chú |
|---|---|
| **Gói miễn phí** | Có cho các model Flash, đủ cho spike AI và phát triển. Với Gemini 2.5 Flash, Google ghi rõ dữ liệu gửi lên **được dùng để cải thiện sản phẩm của họ**; với các model mới hơn bảng giá chưa ghi |
| **Gói trả phí** | Dữ liệu **không** bị dùng để cải thiện sản phẩm. Gemini 3 Flash Preview ≈ 0,50 USD / 1 triệu token vào, 3 USD / 1 triệu token ra. Gemini 3.8 Flash ưu đãi đến 31/12/2026, sau đó 1,50 / 7,50 USD |

**Quyết định:** dùng gói miễn phí cho phát triển và spike AI với **ảnh thử nghiệm**, không dùng ảnh của người dùng thật. **Chuyển sang gói trả phí trước khi có người dùng thật** (từ beta kín), vì ảnh bữa ăn là dữ liệu sức khoẻ.

**Ước tính chi phí** (chưa đo, sẽ đo ở spike AI):

| | Ước tính |
|---|---|
| Mỗi ảnh đã nén (~1024 px, prompt + JSON trả về) | ≈ 0,003–0,008 USD |
| Mỗi người dùng chụp 5 ảnh/ngày | ≈ 0,5–1,2 USD/tháng |
| Beta kín 10 người | ≈ 5–12 USD/tháng |

**Giữ chi phí thấp:**
- Ưu tiên các cách ghi món 0 AI.
- Hạn mức ảnh/ngày.
- Câu hỏi làm rõ trả về trong cùng một lượt gọi.
- Ghi `ai_requests` để xem chi phí thật mỗi tuần.

## 5. Chi phí cố định dự kiến (cần kiểm tra giá khi đăng ký)

| Khoản | Khi nào |
|---|---|
| Apple Developer Program – 99 USD/năm | Trước M7 |
| Supabase gói trả phí (theo tháng) | Trước beta mở rộng |
| Gemini API gói trả phí (theo lượng dùng) | Từ beta kín |
| EAS Build gói trả phí (nếu vượt hạn mức miễn phí) | Khi build thường xuyên |
| Theo dõi lỗi (Sentry…) – có gói miễn phí | Từ beta |

## Nguồn

- Gemini Developer API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API billing: https://ai.google.dev/gemini-api/docs/billing
