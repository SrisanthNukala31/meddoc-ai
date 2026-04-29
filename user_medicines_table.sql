-- Create user_medicines table for medicine reminders
CREATE TABLE public.user_medicines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT NOT NULL DEFAULT 'morning',
    times TEXT[] NOT NULL DEFAULT ARRAY['09:00'],
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_days INTEGER,
    notes TEXT,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_medicines ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own medicines" ON public.user_medicines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medicines" ON public.user_medicines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicines" ON public.user_medicines
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicines" ON public.user_medicines
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_medicines_user_id ON public.user_medicines(user_id);
CREATE INDEX idx_user_medicines_is_active ON public.user_medicines(is_active);
CREATE INDEX idx_user_medicines_start_date ON public.user_medicines(start_date);
CREATE INDEX idx_user_medicines_email_notifications ON public.user_medicines(email_notifications);