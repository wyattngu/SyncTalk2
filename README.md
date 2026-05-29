# SyncTalk

SyncTalk is a full-stack internal social platform combining a discussion forum (Threads), real-time direct messaging, and an AI assistant (SyncBot).

**Live Demo:** https://synctalk-frontend-ky7f.onrender.com  
Demo account: `alice@synctalk.dev` / `Password123!`

---

## Features

- Post threads with tags, markdown, and images — supports likes, reactions, replies, and @mentions
- Real-time 1-on-1 direct messaging with image support
- Chat with SyncBot (AI Assistant powered by Google Gemini) via floating widget or direct message
- Friend system: send, accept, and decline friend requests
- Real-time notifications for reactions, replies, mentions, and friend requests
- Live online/offline presence indicators
- Natural language thread search (Semantic Search with AI)

---

## Tech Stack

**Backend:** Python 3.12, Flask, Flask-SocketIO, PostgreSQL, SQLAlchemy  
**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Zustand  
**Other:** Socket.IO (real-time), JWT (auth), Cloudinary (image storage), Google Gemini API (AI)

---

## Running Locally

**Requirement:** Node.js 20+

Extract the ZIP file, open a terminal in the extracted folder, then run:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **http://localhost:4000**

> The frontend automatically connects to the hosted backend — no additional setup needed. Data and AI are available immediately.

---

## Project Structure

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
│   └── requirements.txt
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

## Deploying to Render

The repo includes a `render.yaml` file that configures all 3 services (backend, frontend, PostgreSQL).

1. Push code to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint** → select your repo
3. Fill in 2 environment variables when prompted: `GEMINI_API_KEY` and `CLOUDINARY_API_SECRET`
4. Click **Apply** — Render will build and deploy automatically

---

## Backend Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection details |
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | Used to sign JWT tokens |
| `JWT_ACCESS_TOKEN_EXPIRES` | Token expiry in seconds, default 3600 |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary for image storage |
| `FRONTEND_URL` | Frontend URL used for CORS configuration |
