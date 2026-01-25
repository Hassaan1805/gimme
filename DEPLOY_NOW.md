# 🚀 Deploy Your Fixes

## Quick Deploy Commands

Run these commands in order to deploy your fixed code:

### 1. Check Current Status
```powershell
git status
```

You should see:
- Modified: `src/context/RoomContext.jsx`
- Modified: `package.json`
- Modified: `README.md`
- New files: `DEPLOYMENT_CHECKLIST.md`, `DEBUG_GUIDE.md`, etc.

### 2. Stage All Changes
```powershell
git add .
```

### 3. Commit Changes
```powershell
git commit -m "fix: correct API endpoints and socket events for deployment

- Fixed all API routes in RoomContext to match backend
- Updated socket.io event names (join-room, leave-room)
- Fixed socket listeners (file-added, text-added, etc.)
- Updated file upload to handle single file uploads
- Fixed delete endpoints
- Added deployment documentation and verification script
"
```

### 4. Push to GitHub
```powershell
git push origin main
```

**This will trigger automatic deployment on both Vercel and Render!**

---

## ⚡ After Pushing

### Wait for Deployments
- **Vercel**: Usually 1-3 minutes
- **Render**: Usually 2-5 minutes (free tier can be slower)

### Check Deployment Status

#### Vercel:
1. Go to https://vercel.com/dashboard
2. Click your project
3. Check "Deployments" tab
4. Wait for green checkmark ✅

#### Render:
1. Go to https://dashboard.render.com
2. Click your service
3. Check "Events" or "Logs" tab
4. Wait for "Deploy live" message

---

## 🔧 Set Environment Variables

### Backend (Render)

**Your credentials (use these exactly!):**

1. Go to Render Dashboard
2. Click your backend service
3. Go to "Environment" tab
4. Add these variables:

```
SUPABASE_URL=https://pdobpagdgoeogtdgxpra.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkb2JwYWdkZ29lb2d0ZGd4cHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzg1ODIsImV4cCI6MjA4NDgxNDU4Mn0.2oB7zxJYNwYoEAYZW-Dh5WphlPVH5WRuyBYdHxdKl5E
CORS_ORIGIN=https://gimme-fawn.vercel.app
```

5. Click "Save Changes" (will trigger auto-redeploy)

**⚠️ Important Notes:**
- No trailing slash on CORS_ORIGIN!
- These are your actual production credentials
- SUPABASE_KEY is the "anon public" key (safe for client-side)

### Frontend (Vercel)

**You need to set (get your Render backend URL first!):**

1. Go to Vercel Dashboard
2. Click your project
3. Go to "Settings" → "Environment Variables"
4. Add:

```
Name: VITE_API_URL
Value: https://your-backend.onrender.com
```

5. Click "Save"

**To get your Render URL:**
- Go to Render Dashboard → Your service
- Copy the URL (e.g., `gimme-backend.onrender.com`)
- Use full URL: `https://gimme-backend.onrender.com`

6. **IMPORTANT:** Redeploy after adding env vars!
   - Go to "Deployments" tab
   - Click latest deployment → "..." menu → "Redeploy"

---

## ✅ Test Your Deployment

### 1. Test Backend API

Open in browser (replace with your actual Render URL):
```
https://your-backend.onrender.com/api/rooms/test123
```

Expected response:
```json
{"exists": false}
```

If you get this, backend is working! ✅

### 2. Test Frontend

1. Open: **https://gimme-fawn.vercel.app**
2. Press F12 to open browser console
3. Look for any errors (should be none)
4. Try creating a room
5. Try uploading a file

### 3. Test Real-time Updates

1. Open your app in two different browser windows
2. Create/join the same room in both
3. Upload a file in one window
4. Should appear instantly in the other window! ✅

---

## 🐛 If Something Doesn't Work

### CORS Error?
```
Access to fetch blocked by CORS policy
```

**Fix:**
- Check `CORS_ORIGIN` on Render
- Must be exactly: `https://gimme-fawn.vercel.app`
- No trailing slash!
- Save and wait for redeploy

### 404 Error?
```
POST https://your-backend.onrender.com/api/... 404
```

**Fix:**
- Check `VITE_API_URL` on Vercel
- Must be: `https://your-backend.onrender.com`
- No trailing slash!
- **Must redeploy Vercel** after changing env vars

### Connection Failed?
```
WebSocket connection to 'wss://...' failed
```

**Fix:**
- Render free tier sleeps after 15 min
- First request wakes it up (30+ seconds)
- Try refreshing after 30 seconds
- Should work on second try

### Upload Error?
```
Failed to upload file
```

**Fix:**
- Check Supabase Storage bucket exists
- Make sure it's named `uploads`
- Make sure it's PUBLIC
- Check storage policies are set
- See DEPLOYMENT.md Step 4

---

## 📋 Final Checklist

Before considering deployment complete:

- [ ] Code pushed to GitHub
- [ ] Vercel deployed successfully (green checkmark)
- [ ] Render deployed successfully ("Deploy live" in logs)
- [ ] Backend env vars set (SUPABASE_URL, SUPABASE_KEY, CORS_ORIGIN)
- [ ] Frontend env vars set (VITE_API_URL)
- [ ] Frontend redeployed after env vars added
- [ ] Backend API responds (test with /api/rooms/test123)
- [ ] Frontend loads without console errors
- [ ] Can create a room
- [ ] Can upload files
- [ ] Real-time updates work (test with 2 windows)
- [ ] Can download files
- [ ] Can delete files

---

## 🎉 Success!

Once all checkboxes are checked, your app is live! 🚀

Your URLs:
- **Frontend:** https://gimme-fawn.vercel.app
- **Backend:** https://your-backend.onrender.com (get this from Render dashboard)

---

## 📚 Need More Help?

See these files:
- **START_HERE.md** - Quick start guide
- **DEPLOYMENT_CHECKLIST.md** - Detailed troubleshooting
- **DEBUG_GUIDE.md** - Debugging commands
- **ARCHITECTURE.md** - System architecture

Or check:
- Render logs (Dashboard → Service → Logs)
- Vercel logs (Dashboard → Project → Deployments → Click deployment)
- Browser console (F12 → Console tab)
