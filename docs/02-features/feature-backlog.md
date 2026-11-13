# Tính năng mở rộng – rút từ SmartWorkout & openGym (có nguồn)

Cập nhật: 13/11/2026. Đây là **danh sách ứng viên**: chưa nằm trong `FEATURES.md` cho tới khi chủ dự án chốt. Mã đề xuất dạng `EXT-xx`.

## 0. Đầu vào và lưu ý

**Đầu vào**
- Đoạn chat Gemini "So sánh hai ứng dụng tập luyện": so sánh SmartWorkout và openGym. Đây là **bản tóm tắt do AI viết**, có thể sai chi tiết; chỉ dùng để lấy ý tưởng.
- Repo [openGym](https://github.com/DuarteSantos8/openGym): đọc README, LICENSE, NOTICE, ARCHITECTURE ngày 13/11/2026.

**Giấy phép – rất quan trọng**

| Thành phần trong openGym | Giấy phép | AuraFit dùng được không? |
|---|---|---|
| Mã nguồn và mô tả bài tập do openGym tự viết | **AGPL-3.0** | **Không chép vào AuraFit.** App đóng nguồn mà dùng code AGPL thì phải mở toàn bộ mã nguồn. Chỉ học **ý tưởng tính năng** (ý tưởng không có bản quyền) |
| Ảnh / animation bài tập (Gym visual) | Độc quyền, cấm dùng cho sản phẩm khác | **Không** (D-041) |
| Đường vẽ bản đồ cơ "MuscleMap" (Melih Colpan) | MIT | **Có thể**, kèm ghi công. Cần kiểm tra repo gốc trước khi dùng |
| Mô tả 1.324 bài từ ExerciseDB qua "exercises-dataset" (Hasan Emir Yıldırım) | MIT | **Có thể**, kèm ghi công. Cần kiểm tra repo gốc trước khi dùng |

**Giáo án mẫu của openGym** (PPL, Upper/Lower, Full Body, 5×5) nằm trong code AGPL và không đọc được trong các trang đã xem, nên **AuraFit tự soạn giáo án** theo nguyên tắc khoa học ở §6.

**Mức bằng chứng dùng trong file này**
- **A**: tổng quan hệ thống / phân tích gộp (meta-analysis), hoặc khuyến nghị chính thức.
- **B**: đồng thuận chuyên gia, nghiên cứu đơn lẻ.
- **C**: kinh nghiệm thực hành, chưa có bằng chứng khoa học mạnh.
- **UX**: tính năng trải nghiệm, không cần nguồn khoa học.

## 1. Lập trình tập khoa học

| Mã | Tính năng | Lấy ý từ | Liên quan | Bằng chứng | Đề xuất |
|---|---|---|---|---|---|
| EXT-01 | **Ngưỡng khối lượng theo nhóm cơ** trên bản đồ "Khối lượng tuần": đặt số set/tuần vào các vùng *dưới mức kích thích → hiệu quả → có nguy cơ quá tải*. Khởi điểm ~10–20 set/tuần/nhóm cơ, cá nhân hoá dần | SmartWorkout (MV/MEV/MAV/MRV) | WRK-12 | **A** cho quan hệ liều–đáp ứng [1][2]; tên MV/MEV/MAV/MRV là khung **C** [3] | **Beta** (chỉ thêm dải màu cho bản đồ đã có) |
| EXT-02 | **Ghi RIR / RPE** cho từng set (tuỳ chọn, 1 chạm) | Cả hai app | WRK-05 | **A/B** [4][5][6][7] | **Beta** – cần cho tự chỉnh tạ |
| EXT-03 | **Chọn luật tăng tiến**: tăng rep rồi tăng tạ (double), thêm cả set (triple), tăng tạ tuyến tính, tăng thời gian giữ. **Tự giảm tải khi chững** 2–3 buổi | openGym | WRK-03, WRK-05 | **A** [8][9]; giảm tải **B** [10] | Beta: double progression (đã có). v1.1: thêm lựa chọn khác + tự giảm tải |
| EXT-04 | **Trình sửa chu kỳ theo khối (mesocycle)** 2–12 tuần: khoảng rep, RIR mục tiêu giảm dần qua các tuần, tuần giảm tải | SmartWorkout | WRK-03 | **A** [11][8] | v1.1 (bộ sinh giáo án đã có khung 8–12 tuần; v1.1 cho người dùng tự chỉnh) |
| EXT-05 | **Lịch xoay vòng A/B/C** không phụ thuộc thứ trong tuần – lỡ một buổi thì buổi sau lùi theo | openGym | WRK-03, WRK-06 | **A**: tập mỗi nhóm cơ ≥ 2 lần/tuần tốt hơn 1 lần [12] | **Beta** (rẻ, rất hợp người bận) |
| EXT-06 | **Kỹ thuật nâng cao**: drop set, superset, rest-pause, pyramid, set khởi động tách riêng | Cả hai app | WRK-04 | **A**: drop set hiệu quả tương đương set thường, tiết kiệm ½–⅓ thời gian [13]; tổng quan kỹ thuật [14] | v1.1 |
| EXT-07 | **Thời gian nghỉ mặc định theo loại bài**: bài đa khớp ≥ 2 phút, bài đơn khớp 60–90 giây | – | WRK-04 | **A/B** [15][16] | **Beta** (chỉ là giá trị mặc định) |
| EXT-08 | **Nhịp độ động tác (tempo)** – tuỳ chọn | SmartWorkout | WRK-04 | **A**: thời lượng mỗi rep 0,5–8 giây cho kết quả tăng cơ tương đương ⇒ chỉ nên là **tuỳ chọn**, không bắt buộc [17] | Sau |
| EXT-09 | **1RM ước tính ngay trong buổi + báo PR**. Chỉ tính khi set ≤ 10 rep vì công thức kém chính xác ở rep cao | Cả hai app | WRK-07 | **B** [18] | **Beta** – thêm quy tắc ≤ 10 rep vào WRK-07 |
| EXT-10 | **Cân bằng cấu trúc**: tỷ lệ sức mạnh giữa các cơ đối kháng (đẩy/kéo, đùi trước/sau) | openGym (Poliquin, Thibaudeau, ATG) | WRK-07 | **C** – chưa có bằng chứng mạnh, chỉ hiện "để tham khảo" | Sau |
| EXT-11 | **Tiêu chuẩn sức mạnh / tạ theo % cân nặng** | Cả hai app | WRK-07 | **C** – dữ liệu cộng đồng | v1.2 |

## 2. Thực chiến tại phòng tập (UX)

| Mã | Tính năng | Lấy ý từ | Liên quan | Đề xuất |
|---|---|---|---|---|
| EXT-12 | **Bài dự phòng 1 chạm**: mỗi bài trong giáo án có sẵn bài thay thế; máy bận thì đổi ngay, giữ nguyên set/rep | openGym | WRK-04 | **Beta** |
| EXT-13 | **Hồ sơ phòng gym chi tiết**: bước tạ thật của từng máy, số bánh tạ có sẵn; **máy tính lắp bánh tạ** cho thanh đòn / EZ / máy Smith | openGym | WRK-02 | **Beta** (đã có `load_step_kg`, chỉ cần thêm cấu hình theo phòng) |
| EXT-14 | **Tạ đeo thêm** (đai nhún xà), **rep từng bên**, **dây kháng lực nhiều sợi** | Cả hai app | WRK-04 | **Beta** – cần cho calisthenics và tập ở nhà |
| EXT-15 | **Màn tập tối giản** + **nháy màn hình khi hết giờ nghỉ** (phòng gym ồn) | openGym | WRK-04 | v1.1 |
| EXT-16 | **Apple Watch**: đánh dấu set, rung khi hết nghỉ, nhịp tim | Cả hai app | LAT-01 | Sau |

## 3. Dữ liệu & AI

| Mã | Tính năng | Lấy ý từ | Đề xuất |
|---|---|---|---|
| EXT-17 | **Dán văn bản → giáo án**: dán giáo án từ ghi chú, ChatGPT, CSV; AI chuyển thành lịch tập. Chỉ gửi chữ nên rẻ | SmartWorkout | v1.1 |
| EXT-18 | **Nhập lịch sử** từ Strong / Hevy (CSV) và **xuất dữ liệu** JSON / CSV | openGym | v1.1 – tăng niềm tin, dễ chuyển app |
| EXT-19 | **Bật/tắt từng module**: "Chỉ ăn uống", "Chỉ tập", đầy đủ – tránh quá tải cho người mới | openGym | v1.1 |
| EXT-20 | **Đăng nhập bằng Passkey** (Face ID) | openGym | v1.1 – kiểm tra Supabase Auth có hỗ trợ không |
| EXT-21 | **AI coach dùng khoá riêng / MCP server cá nhân** cho người dùng rành công nghệ | openGym | Sau |

## 4. Cơ thể & tiến độ

| Mã | Tính năng | Liên quan | Bằng chứng | Đề xuất |
|---|---|---|---|---|
| EXT-22 | **Số đo vòng eo + tỷ lệ eo/chiều cao** (mục tiêu < 0,5) | HLT-02 | **A**: tỷ lệ eo/chiều cao sàng lọc nguy cơ tim mạch – chuyển hoá tốt hơn BMI [19] | v1.1 |
| EXT-23 | **Ảnh trước/sau có thanh kéo so sánh** | LAT-04 | UX | Gộp vào LAT-04 |

## 5. Động lực & cộng đồng

| Mã | Tính năng | Lấy ý từ | Đề xuất |
|---|---|---|---|
| EXT-24 | **Thử thách** (100 hít đất, 50 kéo xà, 300 squat…) – gắn với Boss / nhiệm vụ / bạn bè | SmartWorkout | v1.1 |
| EXT-25 | **Huấn luyện viên giao giáo án cho học viên** (mô hình B2B) | SmartWorkout | Sau – hướng kinh doanh |
| EXT-26 | **Thư viện giáo án mẫu** theo nhóm: người mới, tại nhà, calisthenics, nữ (§6) | Cả hai app | **Beta** – nội dung |

## 6. Giáo án mẫu AuraFit tự soạn (EXT-26)

Nguyên tắc chung (áp dụng cho mọi giáo án):
- Mỗi nhóm cơ **≥ 2 lần/tuần** [12].
- **~10–20 set hiệu quả/tuần/nhóm cơ**, người mới bắt đầu ở mức thấp [1][2].
- Rep **6–30 đều tăng cơ** nếu tập đủ gần thất bại; mặc định 6–12 cho bài đa khớp, 10–20 cho bài đơn khớp [20].
- **RIR 1–3** cho phần lớn set [6][7]; người mới RIR 2–3.
- Nghỉ ≥ 2 phút cho bài đa khớp [15][16].
- **Tăng tiến kép** [9]; giảm tải mỗi 4–6 tuần hoặc khi chững [10].

| Giáo án | Ai phù hợp | Buổi/tuần | Cách chia |
|---|---|---|---|
| Toàn thân A/B | Người mới, người bận | 3 | 2 buổi xoay vòng A/B; 2–3 set/bài; mỗi nhóm cơ 3 lần/tuần |
| Trên / Dưới | Đã tập 3–6 tháng | 4 | Mỗi nhóm cơ 2 lần/tuần, 10–16 set/tuần |
| Đẩy / Kéo / Chân | Trung cấp | 3 (xoay vòng) hoặc 6 | 6 buổi = mỗi nhóm cơ 2 lần/tuần |
| Sức mạnh 5×5 | Người mới muốn tăng sức mạnh | 3 | 3 bài đa khớp/buổi, 5 set × 5 rep, tăng tạ tuyến tính, giảm tải khi chững |
| Tại nhà tạ đơn + dây | Không đi gym | 3–4 | Toàn thân hoặc trên/dưới, dùng EXT-14 |
| Calisthenics theo bậc | Không dụng cụ | 3 | Đẩy / kéo / chân / core; lên bậc khi đạt 3×12 |
| Nữ – ưu tiên mông/chân | Nữ muốn ưu tiên thân dưới | 4 | Trên/dưới với thêm volume cho mông và đùi sau (cùng nguyên tắc khoa học, không khác về sinh lý tập luyện) |

## 7. Đã đưa vào bản beta (D-048, 13/11/2026)

| Mã đề xuất | Tính năng | Mã chính thức trong `FEATURES.md` |
|---|---|---|
| EXT-01 | Ngưỡng khối lượng | **WRK-13** |
| EXT-02 | RIR / RPE | **WRK-14** |
| EXT-05 | Lịch xoay vòng | **WRK-15** |
| EXT-07 | Thời gian nghỉ mặc định | **WRK-16** |
| EXT-09 | 1RM chỉ tính khi ≤ 10 rep | Gộp vào **WRK-07** |
| EXT-12 | Bài dự phòng | **WRK-17** |
| EXT-13 | Hồ sơ phòng gym + máy tính bánh tạ | **WRK-18** |
| EXT-14 | Tạ đeo, rep từng bên, dây kháng lực | **WRK-19** |
| EXT-26 | 7 giáo án mẫu | **WRK-20** |

Các mã còn lại xếp vào v1.1 / v1.2 / Sau như trong bảng.

## Nguồn

1. Schoenfeld BJ, Ogborn D, Krieger JW. *Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis.* J Sports Sci. 2017;35(11):1073–1082.
2. Pelland JC, et al. *The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains.* Sports Med. 2026;56(2):481–505. Bản preprint: https://sportrxiv.org/index.php/server/preprint/view/460
3. Israetel M, Hoffmann J, Smith CW. *Scientific Principles of Hypertrophy Training.* Renaissance Periodization, 2021. Khung thực hành, không phải nghiên cứu bình duyệt.
4. Zourdos MC, et al. *Novel resistance training-specific rating of perceived exertion scale measuring repetitions in reserve.* J Strength Cond Res. 2016;30(1):267–275.
5. Helms ER, et al. *Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training.* Strength Cond J. 2016;38(4):42–49.
6. Refalo MC, et al. *Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis.* Sports Med. 2023;53:649–665.
7. Robinson ZP, et al. *Exploring the dose–response relationship between estimated resistance training proximity to failure, strength gain, and muscle hypertrophy.* Sports Med. 2024.
8. American College of Sports Medicine. *Progression models in resistance training for healthy adults.* Med Sci Sports Exerc. 2009;41(3):687–708.
9. Plotkin D, et al. *Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations.* PeerJ. 2022;10:e14142.
10. Bell L, Strafford BW, Coleman M, Androulakis Korakakis P, Nolan D. *Integrating deloading into strength and physique sports training programmes: an international Delphi consensus approach.* Sports Med Open. 2023;9:87. https://doi.org/10.1186/s40798-023-00633-0
11. Williams TD, et al. *Comparison of periodized and non-periodized resistance training on maximal strength: a meta-analysis.* Sports Med. 2017;47(10):2083–2100.
12. Schoenfeld BJ, Ogborn D, Krieger JW. *Effects of resistance training frequency on measures of muscle hypertrophy: a systematic review and meta-analysis.* Sports Med. 2016;46(11):1689–1697.
13. Sødal LK, Kristiansen E, Larsen S, van den Tillaar R. *Effects of drop sets on skeletal muscle hypertrophy: a systematic review and meta-analysis.* Sports Med Open. 2023. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10390395/
14. Krzysztofik M, et al. *Maximizing muscle hypertrophy: a systematic review of advanced resistance training techniques and methods.* Int J Environ Res Public Health. 2019;16(24):4897.
15. Schoenfeld BJ, et al. *Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men.* J Strength Cond Res. 2016;30(7):1805–1812.
16. Grgic J, et al. *Effects of rest interval duration in resistance training on measures of muscular strength: a systematic review.* Sports Med. 2018;48(1):137–151.
17. Schoenfeld BJ, Ogborn DI, Krieger JW. *Effect of repetition duration during resistance training on muscle hypertrophy: a systematic review and meta-analysis.* Sports Med. 2015;45(4):577–585.
18. LeSuer DA, et al. *The accuracy of prediction equations for estimating 1-RM performance in the bench press, squat, and deadlift.* J Strength Cond Res. 1997;11(4):211–213.
19. Ashwell M, Gunn P, Gibson S. *Waist-to-height ratio is a better screening tool than waist circumference and BMI for adult cardiometabolic risk factors: systematic review and meta-analysis.* Obes Rev. 2012;13(3):275–286.
20. Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. *Strength and hypertrophy adaptations between low- vs. high-load resistance training: a systematic review and meta-analysis.* J Strength Cond Res. 2017;31(12):3508–3523.

**Mức độ kiểm tra nguồn:**
- [2], [10], [13]: đã tra lại trên web ngày 13/11/2026.
- Các nguồn còn lại: trích theo hiểu biết của Claude, **cần đối chiếu DOI** trước khi hiển thị trong app.
