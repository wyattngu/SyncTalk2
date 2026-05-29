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

### Chỉ chạy frontend (đơn giản nhất)

Không cần cài backend hay database — frontend tự trỏ vào server Render có sẵn:

```bash
git clone https://github.com/wyattngu/SyncTalk2.git
cd SyncTalk2/frontend
npm install
npm run dev
```

Mở trình duyệt vào **http://localhost:4000** — AI và data có sẵn luôn.

---

### Chạy đầy đủ (frontend + backend)

Yêu cầu: Node.js 20+, Python 3.12+, PostgreSQL đang chạy local.

```bash
git clone https://github.com/wyattngu/SyncTalk2.git
cd SyncTalk2
```

**1. Tạo database PostgreSQL**

Mở terminal, đăng nhập PostgreSQL rồi chạy:

```bash
psql -U postgres
```

```sql
CREATE DATABASE "SyncTalk";
\q
```

**2. Chạy backend**

```bash
cd backend
pip install -r requirements.txt
```

Tạo file `backend/.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=SyncTalk
DB_USER=postgres
DB_PASSWORD=your_password
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Khởi tạo bảng database (chỉ cần chạy một lần lần đầu):

```bash
python -c "from app import create_app, db; app=create_app(); app.app_context().push(); db.create_all()"
```

```bash
python run.py
```

**3. Chạy frontend** (mở terminal mới)

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt vào **http://localhost:4000**

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
