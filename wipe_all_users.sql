-- =====================================================================
-- DANGER: DATA WIPE SCRIPT
-- Run this in the Supabase SQL Editor
-- =====================================================================

-- This will permanently delete ALL users signed up in the system.
-- Because all your tables (user_medicines, user_profiles, push_subscriptions)
-- use "ON DELETE CASCADE", deleting the users here will automatically
-- wipe all their associated medicines and data, giving you a 100% clean slate.

DELETE FROM auth.users;
