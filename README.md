# TOEIC ETS 2026 — trang luyện đề

Trang web tĩnh bằng React để làm đề TOEIC theo bộ **ETS 2026**. Chế độ thi thử: tính giờ, phiếu
trả lời, chấm điểm quy đổi, xem lại kèm transcript và giải thích tiếng Việt.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + build ra dist/
npm run preview  # xem thử bản build
```

Site dùng `HashRouter` và `base: './'` nên `dist/` chạy được ở bất kỳ thư mục nào, kể cả mở trực
tiếp `dist/index.html`.

## Cấu trúc

| Đường dẫn | Vai trò |
|---|---|
| `src/types/toeic.ts` | Model chuẩn hoá + kiểu của JSON gốc |
| `src/lib/normalizeTest.ts` | Chuyển JSON gốc sang model, parse số câu, kiểm tra dữ liệu |
| `src/lib/screens.ts` | Chia đề thành từng màn hình (Part 5 gộp 5 câu/màn) |
| `src/lib/scoring.ts` | Chấm điểm + bảng quy đổi raw → scaled |
| `src/lib/storage.ts` | Bài đang làm và lịch sử trong `localStorage` |
| `src/data/registry.ts` | Danh sách đề của bộ ETS 2026 |
| `public/data/` | File JSON đề thi |

## Thêm một đề mới

1. Chép file JSON (cùng schema với `test3_ets2026.json`) vào `public/data/`.
2. Sửa dòng tương ứng trong `src/data/registry.ts`:

```ts
{ id: 'test-4', label: 'Test 4', file: 'data/test4_ets2026.json', available: true },
```

Không cần sửa component nào khác.

## Dữ liệu còn thiếu

`test3_ets2026.json` hiện có đủ câu hỏi, đáp án, audio và giải thích, nhưng trường `content` rỗng ở
toàn bộ 200 câu. Nghĩa là:

- **Part 1** chưa có ảnh
- **Part 6, 7** chưa có đoạn văn

Những chỗ đó hiện khung placeholder; câu vẫn chọn được và vẫn được chấm. Khi bổ sung dữ liệu,
`normalizeTest` đọc sẵn các trường sau nên nội dung tự hiện mà không phải sửa code:

- đoạn văn: `content` hoặc `passage` trong mỗi question
- ảnh: `image_url` trong mỗi question

## Ghi chú về điểm

Bảng quy đổi trong `src/lib/scoring.ts` là bảng tham chiếu của đề luyện, **không phải bảng chính
thức của ETS**. Sửa hai mảng `LISTENING_SCALE` / `READING_SCALE` nếu bạn muốn dùng bảng khác — mỗi
mảng đúng 101 phần tử, index là số câu đúng (0..100).
