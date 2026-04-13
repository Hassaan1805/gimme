# 🎯 Gimme - Real-time File & Text Sharing

Share files and text snippets instantly in temporary rooms with real-time synchronization.

## 📖 Project Summary

**Gimme** is a lightweight, real-time sharing platform designed for quick collaboration without account setup.  
Users create or join a room using a PIN, choose a role (Uploader or Receiver), and immediately share files or text snippets with everyone connected to that room.

The project follows a modern client-server architecture:
- The **frontend** (React + Vite) provides the room workflow and real-time UI updates.
- The **backend** (Node.js + Express + Socket.io) handles room management, uploads, content APIs, and event broadcasting.
- **Supabase** powers persistent storage through PostgreSQL tables (`rooms`, `files`, `texts`) and an `uploads` storage bucket for file objects.

### How it works end-to-end
1. A user creates or joins a PIN-based room.
2. Clients connect to the backend and subscribe to that room via Socket.io.
3. File uploads are sent to backend APIs, stored in Supabase Storage, and indexed in the database.
4. Text snippets are stored in the database and tied to the same room.
5. The backend emits events like `file-added`, `file-deleted`, `text-added`, and `text-deleted`.
6. All connected clients update instantly without refresh.

### Why this project exists
- Fast temporary sharing between devices/users
- No heavy onboarding flow
- Real-time collaborative visibility
- Simple deployment model (Frontend + Backend + Supabase)

### Current state
- Core room, file, text, and real-time sync flows are implemented.
- API and Socket.io event naming is aligned between frontend and backend.
- Deployment and troubleshooting docs are included (`DEPLOYMENT.md`, `DEPLOYMENT_CHECKLIST.md`, `DEBUG_GUIDE.md`).

## ✨ Features

- 🔐 **PIN-based Rooms** - Create or join rooms with custom PINs
- 📁 **File Uploads** - Upload and share files up to 50MB
- 📝 **Text Snippets** - Share text content instantly
- ⚡ **Real-time Sync** - See updates immediately across all connected devices
- 👥 **Role-based Access** - Uploader or Receiver roles
- 🔄 **Live Updates** - Socket.io powered real-time communication
- 🗑️ **Easy Management** - Delete files and texts with one click

## 🚀 Tech Stack

**Frontend:**
- React 19 + Vite
- Socket.io Client
- CSS3

**Backend:**
- Node.js + Express
- Socket.io
- Multer (file uploads)
- Supabase (database + storage)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Supabase account
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/Hassaan1805/gimme.git
cd gimme
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

3. **Setup Frontend** (in new terminal)
```bash
# From project root
npm install
cp .env.example .env
# Edit .env with backend URL (http://localhost:3001)
npm run dev
```

4. **Setup Supabase**
- Follow instructions in `DEPLOYMENT.md` Steps 1-4
- Create database tables
- Create storage bucket

## 🌐 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed deployment instructions to:
- Vercel (Frontend)
- Render/Railway (Backend)
- Supabase (Database + Storage)

See **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** for troubleshooting deployed apps.

## 🐛 Debugging

See **[DEBUG_GUIDE.md](./DEBUG_GUIDE.md)** for common issues and solutions.

## 📝 Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

### Backend (backend/.env)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your-anon-key
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

## 🔧 API Endpoints

### Rooms
- `GET /api/rooms/:pin` - Check if room exists
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:pin/contents` - Get room files & texts

### Files
- `POST /api/rooms/:pin/files` - Upload file
- `GET /api/files/:fileId` - Get file info
- `GET /api/files/:fileId/download` - Download file
- `DELETE /api/files/:fileId` - Delete file

### Texts
- `POST /api/rooms/:pin/texts` - Add text
- `DELETE /api/texts/:textId` - Delete text

### Socket.io Events
- `join-room` / `leave-room` - Join/leave room
- `file-added` / `file-deleted` - File updates
- `text-added` / `text-deleted` - Text updates

## 📄 License

MIT

## 👤 Author

**Hassaan**
- GitHub: [@Hassaan1805](https://github.com/Hassaan1805)
