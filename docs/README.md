# AuraFit – Tài liệu dự án (bản xây lại)

AuraFit được xây lại từ đầu. Thư mục này là **nguồn sự thật duy nhất** về chức năng, database, thiết kế và quyết định.

## Bắt đầu từ đây

| Muốn xem | Mở file |
|---|---|
| ⭐ **Tổng hợp toàn bộ dự án trong một file** (chức năng chi tiết, giao diện, công nghệ, DB, lộ trình) | [TONG_HOP.md](TONG_HOP.md) |
| **Toàn bộ chức năng** dạng bảng (mã, ưu tiên, mốc, bảng DB) | [FEATURES.md](FEATURES.md) |
| **Tính năng mở rộng có nguồn khoa học** (rút từ SmartWorkout & openGym) | [02-features/feature-backlog.md](02-features/feature-backlog.md) |
| **Màn hình ↔ mã chức năng** (màn nào có, chức năng nào chưa có màn) | [03-design/screen-map.md](03-design/screen-map.md) |
| **Mã nguồn mockup 35 màn** | [03-design/ui-preview/](03-design/ui-preview/) |
| **Thiết kế database** theo từng chức năng, có phiên bản | [04-database/README.md](04-database/README.md) |
| **Kế hoạch triển khai** (repo, việc từng mốc) | [03-design/implementation-plan.md](03-design/implementation-plan.md) |
| Lộ trình M0 → M7 | [03-design/mvp-roadmap.md](03-design/mvp-roadmap.md) |
| **Kế hoạch ra mắt công khai**, gói Premium, chi phí AI / MCP | [03-design/launch-plan.md](03-design/launch-plan.md) |
| Ngôn ngữ thiết kế (HIG + Liquid Glass) | [03-design/design-language.md](03-design/design-language.md) |
| Mọi quyết định đã chốt | [01-discovery/decisions.md](01-discovery/decisions.md) |
| Xem trước giao diện | Artifact **AuraFit UI Preview** |

## Giai đoạn hiện tại

| Giai đoạn | Trạng thái |
|---|---|
| 0. Vision | 🟩 Xong – trọng tâm dinh dưỡng & sức khoẻ hằng ngày |
| 1. Discovery | 🟩 Xong 4 vòng hỏi đáp (D-001 → D-048) |
| 2. Features | 🟩 Đặc tả nháp cho mọi module MVP + danh mục `FEATURES.md` |
| 3. Design | 🟩 Tech stack, kế hoạch, ngôn ngữ thiết kế, bản xem trước giao diện |
| 4. Database | 🟩 Thiết kế v1 cho 7 module, chưa migrate |
| 5. Build | ⬜ Chưa bắt đầu – M0 tiếp theo |

## Cấu trúc

```text
docs/
├── README.md                     # File này – mục lục
├── FEATURES.md                   # ⭐ Danh mục TOÀN BỘ chức năng
├── 00-vision/
│   ├── product-vision.md         # Tầm nhìn, người dùng, vòng lặp cốt lõi
│   └── glossary.md               # Từ điển thuật ngữ
├── 01-discovery/
│   ├── open-questions.md         # Câu hỏi 4 vòng + câu trả lời
│   ├── decisions.md              # Nhật ký quyết định D-001 → D-048
│   └── assumptions-risks.md      # Giả định & rủi ro
├── 02-features/                  # Đặc tả chi tiết từng module
│   ├── feature-map.md            # Bản đồ module, phụ thuộc
│   ├── signature-features.md     # Tính năng chữ ký – điểm khác biệt
│   ├── onboarding-profile.md
│   ├── nutrition.md              # ⭐ Lõi
│   ├── lifestyle.md              # Sức khoẻ: ngủ, nước, cân nặng, vận động
│   ├── daily-tasks.md
│   ├── workout.md
│   ├── muscle-recovery.md        # Bản đồ hồi phục cơ 2D
│   ├── gamification.md           # Huấn luyện viên
│   ├── progress-insights.md
│   ├── anatomy-3d.md
│   └── social.md
├── 03-design/
│   ├── tech-stack.md
│   ├── design-language.md        # HIG + Liquid Glass
│   ├── mvp-roadmap.md
│   ├── implementation-plan.md
│   ├── screen-map.md             # 35 màn ↔ mã chức năng
│   ├── ui-preview/               # mã nguồn mockup (*.dc.html + canvas.json)
│   └── launch-plan.md            # Ra mắt công khai, Premium, chi phí AI / MCP
├── 04-database/                  # ⭐ Thiết kế DB theo module, có phiên bản
│   ├── README.md                 # Quy ước, RLS, quy trình phiên bản, sơ đồ quan hệ
│   ├── 01-profile.md … 07-friends.md
│   ├── seed/exercises_v1.csv     # 90 bài tập khởi tạo
│   └── CHANGELOG.md              # Lịch sử mọi phiên bản schema
└── legacy/                       # Tài liệu bản cũ – chỉ tham khảo
```

## Quy ước

- **Chức năng** có mã `NUT-02`, `COA-01`… (trong `FEATURES.md`). Commit, PR và migration ghi mã chức năng liên quan.
- **Câu hỏi** có mã `Q1.3`; **quyết định** có mã `D-007`.
- **Đổi schema database** ⇒ migration mới + cập nhật file module trong `04-database/` + một dòng `CHANGELOG.md`, trong cùng PR.
- **Trạng thái tính năng:** 📝 Đã đặc tả · 🔨 Đang làm · ✅ Xong · ⏸️ Sau MVP.
