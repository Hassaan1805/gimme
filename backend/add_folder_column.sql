-- Add folder column to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS folder VARCHAR(50);

-- Add folder column to texts table
ALTER TABLE texts ADD COLUMN IF NOT EXISTS folder VARCHAR(50);

-- Set all existing records to 'guest' folder (preserves existing data)
UPDATE files SET folder = 'guest' WHERE folder IS NULL;
UPDATE texts SET folder = 'guest' WHERE folder IS NULL;

-- Set default value for new records
ALTER TABLE files ALTER COLUMN folder SET DEFAULT 'guest';
ALTER TABLE texts ALTER COLUMN folder SET DEFAULT 'guest';

-- Add index for folder filtering
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_texts_folder ON texts(folder);
