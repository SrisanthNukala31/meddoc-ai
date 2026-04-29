-- Update RLS policies for otp_codes table
-- Allow anyone to insert OTP codes (for signup/reset password flows)
DROP POLICY IF EXISTS "Users can insert their own OTP codes" ON public.otp_codes;
CREATE POLICY "Anyone can insert OTP codes" ON public.otp_codes
    FOR INSERT WITH CHECK (true);

-- Allow anyone to view OTP codes by email (for verification)
DROP POLICY IF EXISTS "Users can view their own OTP codes" ON public.otp_codes;
CREATE POLICY "Anyone can view OTP codes by email" ON public.otp_codes
    FOR SELECT USING (true);

-- Allow anyone to update OTP codes by email (for marking as used)
DROP POLICY IF EXISTS "Users can update their own OTP codes" ON public.otp_codes;
CREATE POLICY "Anyone can update OTP codes by email" ON public.otp_codes
    FOR UPDATE USING (true);

-- Keep other policies for authenticated users
-- (These should already exist from the previous script)