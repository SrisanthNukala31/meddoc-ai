-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions" ON public.push_subscriptions 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access" ON public.push_subscriptions 
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
