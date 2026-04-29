-- ========================================
-- MIGRATION: Add email_notifications to user_medicines
-- ========================================
-- Run this query if you already have user_medicines table
-- This adds the missing email_notifications field

-- Step 1: Add the email_notifications column if it doesn't exist
ALTER TABLE public.user_medicines 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;

-- Step 2: Create index for the new column
CREATE INDEX IF NOT EXISTS idx_user_medicines_email_notifications 
ON public.user_medicines(email_notifications);

-- Step 3: Set all existing records to have email notifications enabled
UPDATE public.user_medicines 
SET email_notifications = TRUE 
WHERE email_notifications IS NULL;

-- Step 4: Update all existing NULLs to have the value
ALTER TABLE public.user_medicines 
ALTER COLUMN email_notifications SET NOT NULL;

-- Step 5: Verify the migration
SELECT COUNT(*) as total_medicines,
       COUNT(CASE WHEN email_notifications = TRUE THEN 1 END) as with_notifications,
       COUNT(CASE WHEN email_notifications = FALSE THEN 1 END) as without_notifications
FROM public.user_medicines;

-- Done! The user_medicines table now has email_notifications column
