-- Move legacy folder-based content from shared room into dedicated rooms.
-- Safe to run multiple times.

BEGIN;

-- Ensure default rooms exist.
INSERT INTO rooms (pin, room_name)
SELECT '1234', 'guest'
WHERE NOT EXISTS (
  SELECT 1 FROM rooms WHERE pin = '1234'
);

INSERT INTO rooms (pin, room_name)
SELECT '2345', 'hassaan'
WHERE NOT EXISTS (
  SELECT 1 FROM rooms WHERE pin = '2345'
);

INSERT INTO rooms (pin, room_name)
SELECT '3456', 'zaid'
WHERE NOT EXISTS (
  SELECT 1 FROM rooms WHERE pin = '3456'
);

-- Normalize default room labels.
UPDATE rooms
SET room_name = 'guest'
WHERE LOWER(pin) IN ('guest', '1234');

UPDATE rooms
SET room_name = 'hassaan'
WHERE LOWER(pin) IN ('hassaan', '2345');

UPDATE rooms
SET room_name = 'zaid'
WHERE LOWER(pin) IN ('zaid', '3456');

-- Move legacy records created under the old shared room model.
UPDATE files
SET room_pin = '2345'
WHERE room_pin IN ('1234', 'guest')
  AND LOWER(COALESCE(folder, '')) = 'hassaan';

UPDATE texts
SET room_pin = '2345'
WHERE room_pin IN ('1234', 'guest')
  AND LOWER(COALESCE(folder, '')) = 'hassaan';

UPDATE files
SET room_pin = '3456'
WHERE room_pin IN ('1234', 'guest')
  AND LOWER(COALESCE(folder, '')) = 'zaid';

UPDATE texts
SET room_pin = '3456'
WHERE room_pin IN ('1234', 'guest')
  AND LOWER(COALESCE(folder, '')) = 'zaid';

COMMIT;
