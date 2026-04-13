-- Add room_name column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_name TEXT;

-- Backfill existing rooms while preserving default room labels
UPDATE rooms
SET room_name = CASE
	WHEN LOWER(pin) IN ('guest', '1234') THEN 'guest'
	WHEN LOWER(pin) IN ('hassaan', '2345') THEN 'hassaan'
	WHEN LOWER(pin) IN ('zaid', '3456') THEN 'zaid'
	ELSE pin
END
WHERE room_name IS NULL
	 OR TRIM(room_name) = ''
	 OR room_name = CONCAT('Room ', pin);

-- Helpful index for room list rendering
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at);
