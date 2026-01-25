# 🚀 Deployment Checklist - GIMME

## ✅ Code Fixes Applied
- [x] Fixed API endpoint mismatches between frontend and backend
- [x] Fixed Socket.io event names (`join-room`, `leave-room` vs `joinRoom`, `leaveRoom`)
- [x] Fixed Socket.io listeners to match backend events (`file-added`, `text-added`, etc.)
- [x] Updated file upload to handle single file uploads properly
- [x] Fixed all API URLs to match backend routes

---

## 📋 Deployment Steps

### 1. Backend (Render) Setup

#### Check Your Environment Variables on Render:
Go to your Render dashboard → Your service → Environment

**Required variables:**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CORS_ORIGIN=https://your-vercel-app.vercel.app
PORT=3001
```

**IMPORTANT:** 
- `CORS_ORIGIN` MUST be your Vercel frontend URL (e.g., `https://gimme-hassaan.vercel.app`)
- If you want multiple origins, separate with commas: `https://gimme.vercel.app,http://localhost:5173`

#### Verify Render Deployment Settings:
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `npm start` (or `node server.js`)
- **Branch:** `main`

---

### 2. Frontend (Vercel) Setup

#### Check Your Environment Variables on Vercel:
Go to Vercel dashboard → Your project → Settings → Environment Variables

**Required variable:**
```
VITE_API_URL=https://your-render-backend.onrender.com
```

**IMPORTANT:**
- Do NOT include trailing slash
- Must be your Render backend URL (e.g., `https://gimme-backend.onrender.com`)
- This variable MUST start with `VITE_` to work with Vite

#### Redeploy Frontend:
After adding/updating environment variables, you MUST redeploy:
1. Go to Deployments tab
2. Click "..." on latest deployment → "Redeploy"
3. OR push new code to trigger automatic deployment

---

### 3. Supabase Setup

#### Verify Database Tables Exist:
Go to Supabase → SQL Editor → Run this query to check:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rooms', 'files', 'texts');
```

You should see 3 tables. If not, run the SQL from DEPLOYMENT.md Step 3.

#### Verify Storage Bucket:
1. Go to Storage
2. Check `uploads` bucket exists
3. Make sure it's **PUBLIC**
4. Verify policies exist (Allow uploads, downloads, deletes for `anon` role)

---

## 🔧 Testing Your Deployment

### Test Backend API:
Open these URLs in your browser (replace with your Render URL):

```
https://your-backend.onrender.com/api/rooms/test123
```
Should return: `{"exists": false}`

### Test Frontend:
1. Visit your Vercel URL
2. Open browser console (F12)
3. Check for errors
4. Try creating a room
5. Try uploading a file

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Error:** "Access to fetch blocked by CORS policy"

**Solution:**
- Make sure `CORS_ORIGIN` on Render includes your Vercel URL
- Format: `https://your-app.vercel.app` (no trailing slash)
- After changing, Render will auto-redeploy (wait ~2 minutes)

### Issue 2: 404 Errors
**Error:** "404 Not Found" when calling API

**Solution:**
- Check `VITE_API_URL` on Vercel is correct
- Verify it points to your Render backend URL
- Make sure to redeploy Vercel after changing env vars

### Issue 3: Socket.io Connection Failed
**Error:** Socket connection errors in console

**Solution:**
- Socket.io uses the same URL as API_URL
- Make sure Render backend is running (not sleeping)
- Free Render instances sleep after 15 min - first request wakes it up

### Issue 4: Files Not Uploading
**Error:** Upload fails or returns errors

**Solution:**
- Check Supabase Storage bucket is public
- Verify storage policies allow INSERT/SELECT/DELETE for `anon` role
- Check backend logs on Render for specific errors

### Issue 5: Render Backend Sleeping
**Problem:** First request takes 30+ seconds

**Solution:**
- Free Render instances sleep after inactivity
- First request wakes it up (slow)
- Consider upgrading to paid plan or use cron-job.org to ping every 10 minutes

---

## 📝 Quick Fix Commands

### Update Backend CORS (if you have Render CLI):
```bash
render env set CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### Test Backend Locally:
```bash
cd backend
npm install
node server.js
```

### Test Frontend Locally:
```bash
npm install
npm run dev
```

---

## ✨ Post-Deployment

After deploying:
1. ✅ Test room creation
2. ✅ Test file upload
3. ✅ Test text upload
4. ✅ Test real-time updates (open 2 browsers)
5. ✅ Test file download
6. ✅ Test delete functionality

---

## 🆘 Still Not Working?

### Check Render Logs:
1. Go to Render dashboard
2. Click your service
3. Click "Logs" tab
4. Look for errors

### Check Vercel Logs:
1. Go to Vercel dashboard
2. Click your project
3. Go to "Deployments"
4. Click latest deployment → "Functions" (if using functions) or check browser console

### Check Browser Console:
1. Open your Vercel app
2. Press F12 → Console tab
3. Look for red errors
4. Share errors if you need help

---

## 🎉 Success Checklist

- [ ] Backend responds to API calls
- [ ] Frontend loads without errors
- [ ] Can create a room
- [ ] Can join a room
- [ ] Can upload files
- [ ] Can see uploaded files
- [ ] Can delete files
- [ ] Real-time updates work
- [ ] Downloads work

---

**Need more help?** 
Check Render logs, Vercel logs, and browser console for specific error messages!
