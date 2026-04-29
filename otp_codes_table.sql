-- Create otp_codes table
CREATE TABLE public.otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    used BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Create policy for users to insert their own OTP codes
CREATE POLICY "Users can insert their own OTP codes" ON public.otp_codes
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

-- Create policy for users can view their own OTP codes
CREATE POLICY "Users can view their own OTP codes" ON public.otp_codes
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Create policy for users to update their own OTP codes (mark as used)
CREATE POLICY "Users can update their own OTP codes" ON public.otp_codes
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Create index on email for faster lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);

-- Create index on expires_at for cleanup
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- Optional: Create a function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_codes
    WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;