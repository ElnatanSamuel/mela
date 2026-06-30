-- Add per-staff PIN for waiter authentication
ALTER TABLE hotel_users ADD COLUMN pin text;

-- Generate random 4-digit PINs for existing staff who don't have one
UPDATE hotel_users SET pin = LPAD(floor(random() * 10000)::text, 4, '0') WHERE pin IS NULL;
