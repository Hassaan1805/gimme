# New Features Added

## 1. Clipboard Image Paste in Text Section

You can now paste images directly from your clipboard into the text uploader section!

**How it works:**
- Click inside the text area
- Press `Ctrl+V` (or `Cmd+V` on Mac) when you have an image in your clipboard
- The image will automatically upload
- A small preview appears briefly to confirm the upload

## 2. Password-Protected Folders

Two private folders have been added: **hassaan** and **zaid**

**Features:**
- Each folder is password-protected
- The folder name IS the password (e.g., "hassaan" folder requires "hassaan" as password)
- All files and texts are organized by folder
- Real-time updates only show content from your current folder
- Switch between folders using the "Switch Role/Folder" button

**How it works:**
1. After selecting your role (Uploader/Viewer), you'll see a folder selection screen
2. Click on a folder (hassaan or zaid)
3. Enter the password (same as folder name)
4. Access your private, organized content

## Database Changes Required

Run the SQL migration in [backend/add_folder_column.sql](backend/add_folder_column.sql) on your Supabase database:

```sql
-- Add folder column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS folder VARCHAR(50);

-- Add folder column to texts table
ALTER TABLE texts ADD COLUMN IF NOT EXISTS folder VARCHAR(50);

-- Add index for folder filtering
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_texts_folder ON texts(folder);
```

## Technical Details

### Frontend Changes:
- **TextUploader.jsx**: Added paste event handler for clipboard images
- **FolderSelector.jsx**: New component for folder authentication
- **RoomContext.jsx**: Added folder state management and filtering
- **RoomDashboard.jsx**: Integrated folder selector and display
- **index.css**: Added folder UI styles

### Backend Changes:
- **server.js**: 
  - Updated GET `/api/rooms/:pin/contents` to filter by folder
  - Updated POST `/api/rooms/:pin/files` to include folder metadata
  - Updated POST `/api/rooms/:pin/texts` to include folder metadata
  - Socket events now include folder information

### Database Schema:
- Added `folder` column to `files` table
- Added `folder` column to `texts` table
- Added indexes for performance

## Usage

1. Start your backend server
2. Run the database migration
3. Navigate to the app
4. Select your role (Uploader/Viewer)
5. Choose a folder and authenticate
6. Upload files/texts or paste images - they'll be organized in your folder
7. Switch folders anytime using the "Switch Role/Folder" button
