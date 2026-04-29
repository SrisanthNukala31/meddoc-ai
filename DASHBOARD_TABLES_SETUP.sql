-- =====================================================================
-- DASHBOARD & HEALTH METRICS TABLES
-- Run in Supabase SQL Editor
-- =====================================================================

-- =====================================================================
-- 1. ENHANCE user_profiles WITH HEALTH METRICS
-- =====================================================================
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS dietary_preference TEXT CHECK (dietary_preference IN ('vegetarian', 'vegan', 'non-vegetarian', 'eggterian'));
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- =====================================================================
-- 2. ALLERGIC FOODS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_allergies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    food_name TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')) DEFAULT 'moderate',
    symptoms TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own allergies" ON public.user_allergies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own allergies" ON public.user_allergies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own allergies" ON public.user_allergies
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own allergies" ON public.user_allergies
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON public.user_allergies(user_id);

-- =====================================================================
-- 3. HEALTH METRICS TABLE (Daily tracking)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    heart_rate INTEGER,
    temperature DECIMAL(4,2),
    blood_glucose INTEGER,
    weight_kg DECIMAL(5,2),
    sleep_hours DECIMAL(3,1),
    water_intake_liters DECIMAL(3,1),
    exercise_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health metrics" ON public.health_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics" ON public.health_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics" ON public.health_metrics
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics" ON public.health_metrics
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON public.health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_metric_date ON public.health_metrics(metric_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_health_metrics_unique_per_day ON public.health_metrics(user_id, metric_date);

-- =====================================================================
-- 4. MEDICAL REPORTS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.medical_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    report_type TEXT NOT NULL,
    report_title TEXT NOT NULL,
    report_date DATE NOT NULL,
    file_path TEXT,
    analysis TEXT,
    findings TEXT,
    doctor_name TEXT,
    clinic_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.medical_reports
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON public.medical_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.medical_reports
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON public.medical_reports
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_medical_reports_user_id ON public.medical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_reports_report_date ON public.medical_reports(report_date);

-- =====================================================================
-- 5. APPOINTMENTS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    doctor_name TEXT NOT NULL,
    specialization TEXT,
    clinic_name TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason TEXT,
    notes TEXT,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments" ON public.appointments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" ON public.appointments
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON public.appointments(appointment_date);

-- =====================================================================
-- 6. MEDICAL INSIGHTS TABLE
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.medical_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT CHECK (severity IN ('info', 'warning', 'alert')) DEFAULT 'info',
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.medical_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insights" ON public.medical_insights
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights" ON public.medical_insights
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" ON public.medical_insights
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" ON public.medical_insights
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_medical_insights_user_id ON public.medical_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_insights_created_at ON public.medical_insights(created_at);

-- =====================================================================
-- GRANT PERMISSIONS TO AUTHENTICATED USERS
-- =====================================================================
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_allergies TO authenticated;
GRANT ALL ON TABLE public.health_metrics TO authenticated;
GRANT ALL ON TABLE public.medical_reports TO authenticated;
GRANT ALL ON TABLE public.appointments TO authenticated;
GRANT ALL ON TABLE public.medical_insights TO authenticated;

-- =====================================================================
-- GRANT PERMISSIONS TO SEQUENCES
-- =====================================================================
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
