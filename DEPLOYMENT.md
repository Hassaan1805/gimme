# Gimme Deployment Guide 🚀

Complete step-by-step guide to deploy gimme with Supabase.

---

## Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** → Sign up with GitHub/email
3. Click **"New Project"**
4. Fill in:
   - **Name:** `gimme` (or any name)
   - **Database Password:** Generate a strong one (save it!)
   - **Region:** Choose closest to your users
5. Click **"Create new project"** (wait ~2 min for setup)

---

## Step 2: Get Your API Credentials

1. In your project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these values (you'll need them later):
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOiJI...` (long string)

---

## Step 3: Create Database Tables

1. Go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Paste this SQL and click **"Run"**:

```sql
-- Create rooms table
CREATE TABLE rooms (
  pin TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_pin TEXT REFERENCES rooms(pin) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  file_type TEXT,
  size INTEGER,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT DEFAULT 'Anonymous',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create texts table
CREATE TABLE texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_pin TEXT REFERENCES rooms(pin) ON DELETE CASCADE,
  content TEXT NOT NULL,
  uploaded_by TEXT DEFAULT 'Anonymous',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - allow all for now
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (anonymous access)
CREATE POLICY "Allow all on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on files" ON files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on texts" ON texts FOR ALL USING (true) WITH CHECK (true);
```

4. You should see "Success" message

---

## Step 4: Create Storage Bucket

1. Go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Name it: `uploads`
4. Toggle **"Public bucket"** ON (so files can be downloaded)
5. Click **"Create bucket"**
6. Click on the `uploads` bucket → **Policies** tab
7. Click **"New policy"** → **"For full customization"**
8. Create these policies:

**Policy 1 - Allow uploads:**
- Name: `Allow uploads`
- Allowed operations: `INSERT`
- Target roles: `anon`
- Policy: `true`

**Policy 2 - Allow downloads:**
- Name: `Allow downloads`  
- Allowed operations: `SELECT`
- Target roles: `anon`
- Policy: `true`

**Policy 3 - Allow deletes:**
- Name: `Allow deletes`
- Allowed operations: `DELETE`
- Target roles: `anon`
- Policy: `true`

---

## Step 5: Update Your Code

Once you have your Supabase URL and key, tell me and I'll update the backend code to use Supabase!

---

## Step 6: Deploy Backend (Railway)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → Sign in with GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Select your gimme repo, choose the `backend` folder
5. Go to **Variables** tab and add:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_KEY` = your anon key
   - `CORS_ORIGIN` = your frontend URL (add after deploying frontend)
6. Railway will auto-deploy and give you a URL like `gimme-backend.up.railway.app`

---

## Step 7: Deploy Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. **"Add New"** → **"Project"**
3. Import your gimme repo
4. Set **Root Directory** to `.` (root, not backend)
5. Add **Environment Variable:**
   - `VITE_API_URL` = your Railway backend URL
6. Click **"Deploy"**
7. Copy your Vercel URL and add it to Railway's `CORS_ORIGIN` variable

---

## You're Live! 🎉

Your app is now deployed:
- **Frontend:** `https://gimme.vercel.app` (or similar)
- **Backend:** `https://gimme-backend.up.railway.app`
- **Database + Storage:** Supabase

