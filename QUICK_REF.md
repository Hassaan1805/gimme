# ⚡ DEPLOYMENT QUICK REFERENCE

## Your Configuration At A Glance

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                              │
│  URL: https://gimme-fawn.vercel.app             │
│                                                 │
│  Environment Variable Needed:                   │
│  VITE_API_URL = [Your Render URL]              │
└─────────────────────────────────────────────────┘
                    ↕ HTTPS
┌─────────────────────────────────────────────────┐
│  BACKEND (Render)                               │
│  URL: [Get from Render dashboard]              │
│                                                 │
│  Environment Variables Needed:                  │
│  SUPABASE_URL = https://pdobp...supabase.co    │
│  SUPABASE_KEY = eyJhbGciOiJ...                 │
│  CORS_ORIGIN = https://gimme-fawn.vercel.app   │
└─────────────────────────────────────────────────┘
                    ↕ API
┌─────────────────────────────────────────────────┐
│  SUPABASE                                       │
│  URL: https://pdobpagdgoeogtdgxpra.supabase.co│
│                                                 │
│  Database Tables: rooms, files, texts           │
│  Storage Bucket: uploads (PUBLIC)               │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Copy-Paste Ready Values

### For Render (Backend):

```
SUPABASE_URL
```
```
https://pdobpagdgoeogtdgxpra.supabase.co
```

```
SUPABASE_KEY
```
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkb2JwYWdkZ29lb2d0ZGd4cHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzg1ODIsImV4cCI6MjA4NDgxNDU4Mn0.2oB7zxJYNwYoEAYZW-Dh5WphlPVH5WRuyBYdHxdKl5E
```

```
CORS_ORIGIN
```
```
https://gimme-fawn.vercel.app
```

### For Vercel (Frontend):

```
VITE_API_URL
```
```
https://your-backend.onrender.com
```
*(Replace with your actual Render URL after deployment)*

---

## ✅ 6-Step Deployment

1. **Push Code** → `git push origin main`
2. **Render Env Vars** → Add 3 variables above
3. **Wait for Render** → 2-5 minutes
4. **Copy Render URL** → Save for next step
5. **Vercel Env Var** → Add VITE_API_URL
6. **Redeploy Vercel** → Deployments → Redeploy

---

## 🧪 Quick Tests

### Backend Test:
```
https://[YOUR-RENDER-URL]/api/rooms/test123
```
✅ Returns: `{"exists": false}`

### Frontend Test:
```
https://gimme-fawn.vercel.app
```
✅ Loads landing page, no errors in console

---

## 📋 Deployment Status

Track your progress:

**Code:**
- [ ] Pushed to GitHub

**Backend (Render):**
- [ ] SUPABASE_URL set
- [ ] SUPABASE_KEY set
- [ ] CORS_ORIGIN set
- [ ] Deployment complete
- [ ] Backend URL copied

**Frontend (Vercel):**
- [ ] VITE_API_URL set
- [ ] Redeployed after env var
- [ ] Deployment complete

**Testing:**
- [ ] Backend API responds
- [ ] Frontend loads
- [ ] Can create room
- [ ] Can upload file
- [ ] Real-time updates work

---

## 🆘 Emergency Fixes

| Problem | Solution |
|---------|----------|
| CORS Error | Check CORS_ORIGIN = `https://gimme-fawn.vercel.app` (exact!) |
| 404 Error | Redeploy Vercel after setting VITE_API_URL |
| Slow Backend | Render free tier sleeps - wait 30s on first request |
| Upload Fails | Check Supabase Storage bucket `uploads` is PUBLIC |

---

## 📞 Support Files

- **DEPLOY_READY.md** - Detailed step-by-step guide
- **MY_CREDENTIALS.md** - All credentials in one place
- **DEPLOY_NOW.md** - Complete deployment instructions
- **DEPLOYMENT_CHECKLIST.md** - Troubleshooting guide

---

**🚀 Ready? Open DEPLOY_READY.md and follow Steps 1-6!**
