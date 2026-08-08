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
| `public/media/` | Audio/ảnh đã tải về, mỗi đề một thư mục |
| `scripts/fetch-media.mjs` | Tải media từ xa về `public/media/` và trỏ JSON sang bản local |

## Lưu media về máy (quan trọng)

JSON gốc trỏ audio thẳng sang `zenlishtoeic.vn`. Nếu trang đó đóng cửa hoặc đổi đường dẫn thì toàn
bộ phần Listening mất theo. Script này chép media về repo để đề vẫn chạy được offline:

```bash
npm run fetch-media                              # tải cho mọi đề trong public/data/
npm run fetch-media -- public/data/test4.json    # chỉ một đề
npm run fetch-media -- --dry-run                 # xem sẽ tải gì, chưa tải
npm run fetch-media -- --force                   # tải lại kể cả đã có
npm run verify-media                             # đối chiếu sha256, phát hiện file hỏng
```

Script làm ba việc, chạy lại nhiều lần vẫn an toàn:

1. Tải mọi trường `*_url` trỏ tới media (`.mp3`, `.mp4`, `.jpg`, …) vào `public/media/<tên-đề>/`.
2. Ghi đè trường đó thành đường dẫn local (`media/test3_ets2026/clip.mp3`) và **giữ URL gốc** ở
   `<trường>_source` để sau này còn biết file đến từ đâu.
3. Sinh `public/media/<tên-đề>/manifest.json` (kích thước + sha256 từng file) cho `verify-media`.

Bản JSON trước khi sửa được giữ nguyên ở `<tên-đề>.json.remote.bak`. File nào tải lỗi thì giữ
nguyên URL từ xa chứ không bị trỏ vào đường dẫn hỏng.

`normalizeTest` tự thêm tiền tố `BASE_URL` cho đường dẫn tương đối, nên JSON đã mirror và JSON còn
trỏ ra ngoài đều dùng được lẫn lộn.

**Lưu ý về Git:** audio của Test 3 là 42.3 MB. Commit vào repo thì dữ liệu được sao lưu luôn trên
GitHub (đúng mục đích), đổi lại repo phình ra và không xoá bớt được về sau. Nếu chỉ muốn giữ ở máy,
thêm `public/media/` vào `.gitignore` — nhưng khi đó phải tự backup thư mục đó chỗ khác.

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
