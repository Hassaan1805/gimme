# 🏗️ Gimme Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           React Frontend (Vercel)                        │  │
│  │                                                          │  │
│  │  - LandingPage.jsx  (Create/Join room)                  │  │
│  │  - RoleSelector.jsx (Choose Uploader/Receiver)          │  │
│  │  - RoomDashboard.jsx (Main UI)                          │  │
│  │  - RoomContext.jsx  (API calls & Socket.io)             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            ↕                                    │
│                     [HTTPS + WebSocket]                         │
└─────────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────────┐
│                  Node.js Backend (Render)                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js Server                                       │  │
│  │                                                          │  │
│  │  REST API:                                               │  │
│  │  - GET  /api/rooms/:pin                                  │  │
│  │  - POST /api/rooms                                       │  │
│  │  - GET  /api/rooms/:pin/contents                         │  │
│  │  - POST /api/rooms/:pin/files                            │  │
│  │  - POST /api/rooms/:pin/texts                            │  │
│  │  - DELETE /api/files/:fileId                             │  │
│  │  - DELETE /api/texts/:textId                             │  │
│  │                                                          │  │
│  │  Socket.io Events:                                       │  │
│  │  - join-room / leave-room                                │  │
│  │  - file-added / file-deleted                             │  │
│  │  - text-added / text-deleted                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             ↕
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (Cloud)                            │
│                                                                 │
│  ┌────────────────────┐      ┌──────────────────────────────┐  │
│  │  PostgreSQL DB     │      │  Storage Bucket (uploads)    │  │
│  │                    │      │                              │  │
│  │  Tables:           │      │  Files stored here:          │  │
│  │  - rooms           │      │  - {pin}/{uuid}.{ext}        │  │
│  │  - files           │      │                              │  │
│  │  - texts           │      │  Public bucket for           │  │
│  │                    │      │  file downloads              │  │
│  └────────────────────┘      └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 📡 Data Flow

### Creating a Room
```
Browser → POST /api/rooms {pin} → Backend → Supabase DB → INSERT room
                                           ↓
Browser ← {success: true} ← Backend ← rooms table updated
```

### Uploading a File
```
Browser → POST /api/rooms/:pin/files (multipart/form-data)
           ↓
        Backend receives file in memory (multer)
           ↓
        Upload to Supabase Storage: uploads/{pin}/{uuid}.ext
           ↓
        Save metadata to DB: files table
           ↓
        Emit Socket.io: file-added → All connected clients
           ↓
Browser ← File appears in real-time for all users in room
```

### Real-time Updates
```
User A uploads file
        ↓
Backend emits: socket.to(pin).emit('file-added', fileData)
        ↓
User B's browser receives event → Updates UI automatically
User C's browser receives event → Updates UI automatically
```

## 🔑 Environment Variables Flow

### Frontend (Vercel)
```
VITE_API_URL → Embedded in build → Used by RoomContext.jsx
```

**Important:** Must start with `VITE_` for Vite to include it!

### Backend (Render)
```
SUPABASE_URL  → Used by supabase.js client
SUPABASE_KEY  → Used by supabase.js client
CORS_ORIGIN   → Used by CORS middleware
PORT          → Server listen port
```

## 🔐 Security Notes

1. **Supabase Key:** Using `anon` public key (safe for client-side)
2. **Row Level Security (RLS):** Enabled with policies for anon access
3. **CORS:** Restricts API access to your frontend domain
4. **File Upload:** Limited to 50MB per file
5. **Storage:** Public bucket for easy file downloads

## 📊 Database Schema

```sql
-- Rooms table
rooms
├── pin (TEXT, PRIMARY KEY)
└── created_at (TIMESTAMPTZ)

-- Files table
files
├── id (UUID, PRIMARY KEY)
├── room_pin (TEXT, FOREIGN KEY → rooms.pin)
├── original_name (TEXT)
├── file_type (TEXT)
├── size (INTEGER)
├── storage_path (TEXT)
├── uploaded_by (TEXT)
└── uploaded_at (TIMESTAMPTZ)

-- Texts table
texts
├── id (UUID, PRIMARY KEY)
├── room_pin (TEXT, FOREIGN KEY → rooms.pin)
├── content (TEXT)
├── uploaded_by (TEXT)
└── uploaded_at (TIMESTAMPTZ)
```

## 🎯 Key Fixes Applied

### Before (Broken):
```javascript
// Frontend
fetch('/api/rooms/check') ❌
fetch('/api/files/${roomPin}') ❌
socket.emit('joinRoom') ❌
socket.on('filesUpdated') ❌
```

### After (Fixed):
```javascript
// Frontend
fetch('/api/rooms/${pin}') ✅
fetch('/api/rooms/${roomPin}/contents') ✅
socket.emit('join-room') ✅
socket.on('file-added') ✅
```

Now frontend and backend speak the same language! 🎉
