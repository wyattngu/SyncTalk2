# SyncTalk

SyncTalk là ứng dụng mạng xã hội nội bộ được xây dựng theo mô hình full-stack, kết hợp diễn đàn thảo luận (Threads), nhắn tin trực tiếp (Direct Messages) và trợ lý AI (SyncBot) hoạt động thời gian thực.

**Demo:** https://synctalk-frontend-ky7f.onrender.com  
Tài khoản thử: `alice@synctalk.dev` / `Password123!`

---

## Tính năng chính

- Đăng thread với tag, markdown, hình ảnh — có thể like, react, reply và @mention
- Nhắn tin trực tiếp 1-1 thời gian thực, hỗ trợ gửi ảnh
- Chat với SyncBot (AI Assistant dùng Google Gemini) qua widget nổi hoặc tin nhắn trực tiếp
- Hệ thống bạn bè: gửi/chấp nhận/từ chối lời mời
- Thông báo realtime khi có reaction, reply, mention, lời mời kết bạn
- Hiển thị trạng thái online/offline theo thời gian thực
- Tìm kiếm thread bằng ngôn ngữ tự nhiên (Semantic Search với AI)

---

## Công nghệ sử dụng

**Backend:** Python 3.12, Flask, Flask-SocketIO, PostgreSQL, SQLAlchemy  
**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand  
**Khác:** Socket.IO (realtime), JWT (xác thực), Cloudinary (lưu ảnh), Google Gemini API (AI)

---

## Chạy local

Yêu cầu: **Node.js 20+**

Giải nén file ZIP, mở terminal trong thư mục vừa giải nén rồi chạy:

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt vào **http://localhost:4000**

> Frontend tự kết nối vào server backend có sẵn — không cần cài thêm gì, data và AI hoạt động ngay.

---

## Cấu trúc dự án

```
SyncTalk/
├── backend/
│   ├── app/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   ├── sockets/
│   │   ├── features/
│   │   └── utils/
│   ├── seed.py
│   ├── run.py
│   ├── start.sh
│   ├── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── lib/
│       ├── types/
│       └── constants/
└── render.yaml
```

---

## Deploy lên Render

Trong repo đã có sẵn file `render.yaml` cấu hình đầy đủ 3 services (backend, frontend, PostgreSQL).

1. Push code lên GitHub
2. Vào [render.com](https://render.com) → **New** → **Blueprint** → chọn repo
3. Điền 2 biến môi trường khi được yêu cầu: `GEMINI_API_KEY` và `CLOUDINARY_API_SECRET`
4. Nhấn **Apply**, Render sẽ tự build và deploy

---

## Biến môi trường backend

| Biến | Mô tả |
|------|-------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Thông tin kết nối PostgreSQL |
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | Dùng để ký JWT token |
| `JWT_ACCESS_TOKEN_EXPIRES` | Thời hạn token tính bằng giây, mặc định 3600 |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary để lưu ảnh |
| `FRONTEND_URL` | URL frontend, dùng cho cấu hình CORS |
