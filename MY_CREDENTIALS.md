# 🔑 Your Deployment Credentials

**⚠️ IMPORTANT: This file contains your actual credentials!**

---

## 🗄️ Supabase Configuration

**Project URL:**
```
https://pdobpagdgoeogtdgxpra.supabase.co
```

**Anon Public Key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkb2JwYWdkZ29lb2d0ZGd4cHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzg1ODIsImV4cCI6MjA4NDgxNDU4Mn0.2oB7zxJYNwYoEAYZW-Dh5WphlPVH5WRuyBYdHxdKl5E
```

---

## 🌐 Deployment URLs

**Frontend (Vercel):**
```
https://gimme-fawn.vercel.app
```

**Backend (Render):**
```
https://your-backend.onrender.com
```
*Note: Replace with your actual Render URL after deployment*

---

## 🔧 Environment Variables to Set

### On Render (Backend):

Copy and paste these exactly:

```
SUPABASE_URL=https://pdobpagdgoeogtdgxpra.supabase.co
```

```
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkb2JwYWdkZ29lb2d0ZGd4cHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMzg1ODIsImV4cCI6MjA4NDgxNDU4Mn0.2oB7zxJYNwYoEAYZW-Dh5WphlPVH5WRuyBYdHxdKl5E
```

```
CORS_ORIGIN=https://gimme-fawn.vercel.app
```

### On Vercel (Frontend):

```
VITE_API_URL=https://your-backend.onrender.com
```
*Note: Use your actual Render backend URL*

---

## ✅ Quick Setup Steps

1. **Push your code:**
   ```powershell
   git add .
   git commit -m "fix: deployment configuration"
   git push origin main
   ```

2. **Set Render environment variables:**
   - Go to Render dashboard
   - Select your backend service
   - Environment tab
   - Add the 3 variables above
   - Save (triggers auto-redeploy)

3. **Get your Render URL:**
   - Wait for deployment to finish
   - Copy the URL (e.g., `https://gimme-backend.onrender.com`)

4. **Set Vercel environment variable:**
   - Go to Vercel dashboard
   - Your project → Settings → Environment Variables
   - Add `VITE_API_URL` with your Render URL
   - Save

5. **Redeploy Vercel:**
   - Deployments tab
   - Latest deployment → "..." → "Redeploy"

6. **Test:**
   - Open https://gimme-fawn.vercel.app
   - Create a room
   - Upload a file

---

## 🔒 Security Note

The `SUPABASE_KEY` shown here is the **anon public key**, which is safe to use in client-facing applications. It's designed to be public and works with Row Level Security (RLS) policies in Supabase.

**Never share:**
- Your Supabase service_role key
- Your database password
- Your Supabase dashboard login

---

## 📱 Quick Test URLs

After deployment, test these:

**Backend health check:**
```
https://your-backend.onrender.com/api/rooms/test123
```
Should return: `{"exists": false}`

**Frontend:**
```
https://gimme-fawn.vercel.app
```
Should load the landing page

---

## 🆘 If You See Errors

### CORS Error
- Double-check `CORS_ORIGIN` on Render is exactly: `https://gimme-fawn.vercel.app`
- No trailing slash!

### 404 Errors
- Make sure `VITE_API_URL` on Vercel points to your Render URL
- Must redeploy Vercel after setting env vars

### Upload Errors
- Check Supabase Storage bucket `uploads` exists
- Make sure it's PUBLIC
- Verify storage policies are set (see DEPLOYMENT.md)

---

**Ready to deploy? Follow DEPLOY_NOW.md step by step!** 🚀
