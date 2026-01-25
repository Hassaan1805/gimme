# 🐛 Quick Debug Guide

## Test Your APIs Manually

### 1. Test Backend is Running
```bash
# Replace with your Render URL
curl https://your-backend.onrender.com/api/rooms/test123
```

Expected response:
```json
{"exists": false}
```

### 2. Test Room Creation
```bash
curl -X POST https://your-backend.onrender.com/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"pin":"test123"}'
```

Expected response:
```json
{"success": true, "pin": "test123"}
```

### 3. Test Room Check
```bash
curl https://your-backend.onrender.com/api/rooms/test123
```

Expected response:
```json
{"exists": true}
```

---

## Environment Variables Quick Check

### Backend (Render) - Required:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### Frontend (Vercel) - Required:
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Common Error Messages

### "Failed to fetch"
- Backend is not running or wrong URL
- Check VITE_API_URL in Vercel
- Check if Render backend is sleeping (free tier)

### "CORS policy: No 'Access-Control-Allow-Origin' header"
- CORS_ORIGIN not set correctly on backend
- Must match your Vercel URL exactly
- Don't forget https://

### "Room not found"
- Database connection issue
- Check SUPABASE_URL and SUPABASE_KEY
- Verify tables exist in Supabase

### "Failed to upload file"
- Storage bucket not created
- Storage bucket not public
- Missing storage policies
- Check Supabase Storage settings

---

## Browser Console Debugging

Open browser console (F12) and run:

```javascript
// Check API URL
console.log('API URL:', import.meta.env.VITE_API_URL);

// Test API connection
fetch('https://your-backend.onrender.com/api/rooms/test')
  .then(r => r.json())
  .then(d => console.log('API works:', d))
  .catch(e => console.error('API failed:', e));
```

---

## Render Backend Debug

Add this to the top of `backend/server.js` after imports:

```javascript
// Debug logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

This will log all requests in Render logs.

---

## Force Redeploy

### Backend (Render):
1. Dashboard → Your service
2. "Manual Deploy" → "Deploy latest commit"
3. OR push empty commit: `git commit --allow-empty -m "redeploy" && git push`

### Frontend (Vercel):
1. Dashboard → Your project → Deployments
2. Latest deployment → "..." → "Redeploy"
3. OR push any change to trigger rebuild
