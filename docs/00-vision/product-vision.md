# Tầm nhìn sản phẩm

> Cập nhật 2026-11-13 sau vòng 1 (D-005: đổi trọng tâm). Chỗ có `❓` còn chờ xác nhận.

## Một câu

AuraFit là **app sức khoẻ hằng ngày được game hoá**: người dùng chụp ảnh bữa ăn để biết mình đã nạp bao nhiêu so với **TDEE**, theo dõi giấc ngủ và các chỉ số sức khoẻ, tập luyện theo giáo án app tự sinh – và thấy **các chỉ số của chính mình tăng lên** mỗi ngày, kể cả ngày không tập.

## Vấn đề cần giải quyết

1. **Không biết mình ăn bao nhiêu**: đếm calo thủ công mất thời gian nên người dùng bỏ.
2. **Không biết nên ăn bao nhiêu**: không ai tính TDEE và mục tiêu theo cơ thể và mục tiêu riêng.
3. **Sức khoẻ không chỉ là tập**: ăn, ngủ, uống nước, cân nặng nằm rải rác ở nhiều app hoặc không ai theo dõi.
4. **Thiếu động lực và kỷ luật**: không thấy tiến bộ, không có gì thúc ép.
5. **Không biết tập gì, tập bao nhiêu**: đặc biệt người mới (D-006).

## Người dùng

- **Beta:** chủ dự án + 5–10 người bạn, iOS, qua TestFlight (D-003).
- **Sau này:** mọi trình độ, cả người không tập gym nhưng muốn ăn uống và sống khoẻ (D-006).

## Vòng lặp cốt lõi

```text
Sáng: mở app → "Hôm nay": mục tiêu kcal/macro, giấc ngủ đêm qua, buổi tập hôm nay (nếu có)
Mỗi bữa: chụp ảnh → AI ước tính → xác nhận 1 chạm → thanh kcal/protein còn lại cập nhật
Buổi tập (nếu có): tập theo giáo án, ghi set/rep → app điều chỉnh tạ lần sau
Tối: xem ngày của mình đạt bao nhiêu → chỉ số tăng/giảm, streak, nhắc nhở cho ngày mai
Tuần: tổng kết, giáo án tuần sau được điều chỉnh, TDEE được hiệu chỉnh ❓ (Q2.9)
```

## Trụ cột giá trị (theo thứ tự ưu tiên)

| # | Trụ cột | Nội dung |
|---|---|---|
| 1 | **Dinh dưỡng thông minh** | Chụp ảnh → kcal/macro, so với TDEE và mục tiêu |
| 2 | **Sức khoẻ & chất lượng sống** | Giấc ngủ, nước, cân nặng xu hướng, vận động; daily task (đọc sách, làm việc tập trung…) (D-012, D-024) |
| 3 | **Huấn luyện viên & động lực** | Điểm ngày, Level/Aura, linh vật Auri, Boss tuần, ngày tự do minh bạch, giọng văn Gen Z (D-021, D-026, D-027) |
| 4 | **Tập luyện có hướng dẫn** | Gym, tại nhà, calisthenics; giáo án tự sinh; readiness (D-008, D-028) |
| 5 | **Thấy tiến bộ & bạn bè** | Thống kê ngày → năm, "Về đích ngày…", story bữa ăn, streak đôi (D-018, D-025) |
| – | Sau MVP | 3D anatomy, social mở rộng, widget/Live Activity, Wrapped |

## Nguyên tắc sản phẩm

1. **Nhập liệu gần như bằng không**: chụp ảnh thay vì gõ; xác nhận 1 chạm; mặc định thông minh.
2. **AI gợi ý, người dùng quyết định** (D-011): mọi con số AI đưa ra đều sửa được.
3. **Có thúc ép nhưng không làm người dùng bỏ cuộc**: phạt có giới hạn, luôn có đường quay lại.
4. **Mọi con số đều giải thích được**: TDEE, tạ gợi ý, điểm chỉ số – bấm vào là thấy cách tính.
5. **Song ngữ Việt – Anh từ đầu** (D-009); món ăn Việt phải được nhận diện tốt.
6. **Dữ liệu sức khoẻ là riêng tư mặc định** (D-004).

## Ngoài phạm vi

- Tư vấn y tế, chẩn đoán; chế độ ăn cho người có bệnh lý.
- Android, web (sau beta iOS).
- Thanh toán / gói trả phí (sau khi sản phẩm ổn, D-004).

## Chỉ số thành công cho beta (đề xuất)

- ≥ 70 % người test **ghi ít nhất 2 bữa/ngày** trong 2 tuần đầu.
- Người test dùng app **≥ 5 ngày/tuần** sau 4 tuần.
- Sai số kcal của AI mà người dùng chấp nhận được (đo bằng tỷ lệ người dùng phải sửa nhiều).
