# 🎧 ETS 2026 — Web Luyện Thi TOEIC Online/Offline

Ứng dụng web tĩnh (SPA) luyện thi TOEIC theo bộ đề **ETS 2026**, được xây dựng bằng **React 19**, **TypeScript** và **Vite 6**.

Mô phỏng thi thật với đếm ngược thời gian, phiếu làm bài (Answer Sheet), trình phát audio, tự động quy đổi điểm chuẩn TOEIC (10-990) và xem lại transcript kèm giải thích tiếng Việt.

---

## ✨ Tính năng chính

- 🎯 **3 Chế độ thi linh hoạt**: Full Test (200 câu/120 phút), Luyện theo Part (Part 1–7) và Luyện theo Skill (Listening / Reading).
- ⏱ **Áp lực phòng thi**: Đồng hồ đếm ngược tự động nộp bài khi hết giờ, tự động lưu tiến độ làm bài vào `localStorage`.
- 📊 **Chấm điểm & Quy đổi**: Tự động tính điểm thô và quy đổi sang điểm TOEIC (5–495 từng kỹ năng, tổng tối đa 990).
- 📝 **Review & Transcript**: Xem lại đáp án đúng/sai, transcript nghe và lời giải tiếng Việt chi tiết cho từng câu.
- 📦 **Tải Media Offline**: Công cụ tự động tải audio & ảnh về local, giúp app chạy mượt mà 100% không cần Internet.
- 🌓 **Giao diện Light/Dark**: Responsive trên mọi thiết bị, hỗ trợ chuyển đổi giao diện sáng/tối với Tailwind CSS v4.

---

## 🛠 Công nghệ Sử dụng

- **Frontend Core**: React 19, TypeScript 5.8, Vite 6
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Routing**: React Router DOM v7 (`HashRouter` hỗ trợ chạy tĩnh không cần server)

---

## 🚀 Chạy nhanh (Quick Start)

```bash
# 1. Di chuyển vào thư mục ets-web
cd ets-web

# 2. Cài đặt phụ thuộc
npm install

# 3. Chạy môi trường dev (truy cập http://localhost:5173)
npm run dev
```

---

## 📚 Tài liệu Chi tiết

| File Tài liệu | Mục đích & Nội dung chính |
|---|---|
| 📖 [**GUIDE.md**](file:///c:/Users/phuc0/Downloads/EBEST%20-%20ETS%202026-20260714T025504Z-1-001/EBEST%20-%20ETS%202026/code/ets-web/GUIDE.md) | **Hướng dẫn các bước đơn giản dễ hiểu**: Cài đặt, hướng dẫn thi thử, tải media offline, thêm đề mới & build/deploy. |
| 📐 [**SPECIFICATION.md**](file:///c:/Users/phuc0/Downloads/EBEST%20-%20ETS%202026-20260714T025504Z-1-001/EBEST%20-%20ETS%202026/code/ets-web/SPECIFICATION.md) | **Đặc tả kĩ thuật & Quy chuẩn logic**: Chi tiết data schema, thuật toán chấm điểm, quy tắc chia màn hình và lưu trữ để không sửa đổi logic cốt lõi về sau. |
