-- Run this in Supabase Dashboard > SQL Editor
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- All existing hotels are already 'approved'
-- New hotels registered via onboarding will be 'pending' until an admin approves them
