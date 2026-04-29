# 🔧 CORRECTED SQL - Safe to Run Multiple Times

## 📍 USE THIS INSTEAD - Fixed SQL Code

**WHERE TO RUN:** Supabase Dashboard → SQL Editor → New Query

```sql
-- =====================================================================
-- COMPLETE MEDDOC AI DATABASE SETUP (SAFE VERSION)
-- This can be run multiple times without errors
-- =====================================================================

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    blood_type TEXT CHECK (blood_type IN ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 2. MEDICINE REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.user_medicines (
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

ALTER TABLE IF EXISTS public.user_medicines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own medicines" ON public.user_medicines;
DROP POLICY IF EXISTS "Users can insert their own medicines" ON public.user_medicines;
DROP POLICY IF EXISTS "Users can update their own medicines" ON public.user_medicines;
DROP POLICY IF EXISTS "Users can delete their own medicines" ON public.user_medicines;

CREATE POLICY "Users can view their own medicines" ON public.user_medicines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medicines" ON public.user_medicines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicines" ON public.user_medicines
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicines" ON public.user_medicines
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_medicines_user_id ON public.user_medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medicines_is_active ON public.user_medicines(is_active);
CREATE INDEX IF NOT EXISTS idx_user_medicines_start_date ON public.user_medicines(start_date);
CREATE INDEX IF NOT EXISTS idx_user_medicines_email_notifications ON public.user_medicines(email_notifications);

-- 3. HEALTH LOGS TABLE
CREATE TABLE IF NOT EXISTS public.health_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    bmi DECIMAL(5, 2),
    heart_rate INTEGER CHECK (heart_rate > 0 AND heart_rate < 250),
    blood_pressure TEXT,
    weight DECIMAL(6, 2),
    diet_score INTEGER CHECK (diet_score BETWEEN 0 AND 10),
    exercise_score INTEGER CHECK (exercise_score BETWEEN 0 AND 10),
    sleep_hours DECIMAL(4, 2),
    mood TEXT CHECK (mood IN ('very_bad', 'bad', 'neutral', 'good', 'very_good')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.health_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their health logs" ON public.health_logs;

CREATE POLICY "Users own their health logs" ON public.health_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON public.health_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_health_logs_date ON public.health_logs(date);

-- 4. DIAGNOSES TABLE
CREATE TABLE IF NOT EXISTS public.diagnoses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
    conditions JSONB,
    symptoms JSONB,
    recommendations JSONB,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.diagnoses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their diagnoses" ON public.diagnoses;

CREATE POLICY "Users own their diagnoses" ON public.diagnoses
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user_id ON public.diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_date ON public.diagnoses(date);
CREATE INDEX IF NOT EXISTS idx_diagnoses_severity ON public.diagnoses(severity);

-- 5. MEDICAL RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    record_type TEXT CHECK (record_type IN ('xray', 'bloodtest', 'prescription', 'report', 'other')) NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT,
    analysis_result JSONB,
    notes TEXT,
    record_date DATE DEFAULT CURRENT_DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their medical records" ON public.medical_records;

CREATE POLICY "Users own their medical records" ON public.medical_records
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON public.medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_record_type ON public.medical_records(record_type);

-- 6. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    doctor_name TEXT,
    hospital_clinic TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their appointments" ON public.appointments;

CREATE POLICY "Users own their appointments" ON public.appointments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- 7. OTP CODES TABLE - FIXED WITH DROP POLICY
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    used BOOLEAN DEFAULT FALSE
);

ALTER TABLE IF EXISTS public.otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Users can view their own OTP codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Users can update their own OTP codes" ON public.otp_codes;

CREATE POLICY "Users can insert their own OTP codes" ON public.otp_codes
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can view their own OTP codes" ON public.otp_codes
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update their own OTP codes" ON public.otp_codes
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_used ON public.otp_codes(used);

CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_codes
    WHERE (expires_at < NOW() AND used = FALSE) OR (used = TRUE AND created_at < NOW() - INTERVAL '1 day');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. LIFESTYLE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.lifestyle_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    age INTEGER CHECK (age > 0 AND age < 150),
    height_cm INTEGER CHECK (height_cm > 0),
    weight_kg DECIMAL(6, 2) CHECK (weight_kg > 0),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    goal TEXT CHECK (goal IN ('lose_weight', 'gain_weight', 'maintain_weight', 'build_muscle', 'improve_fitness')),
    sleep_hours DECIMAL(4, 2),
    diet_type TEXT CHECK (diet_type IN ('vegetarian', 'vegan', 'non-vegetarian', 'keto', 'paleo')) DEFAULT 'non-vegetarian',
    allergies TEXT[],
    chronic_conditions JSONB,
    current_medications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.lifestyle_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their lifestyle profile" ON public.lifestyle_profiles;

CREATE POLICY "Users own their lifestyle profile" ON public.lifestyle_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lifestyle_profiles_user_id ON public.lifestyle_profiles(user_id);

-- 9. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- 10. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UPDATE TIMESTAMP FUNCTION & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_medicines_updated_at ON public.user_medicines;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_health_logs_updated_at ON public.health_logs;
DROP TRIGGER IF EXISTS update_diagnoses_updated_at ON public.diagnoses;
DROP TRIGGER IF EXISTS update_medical_records_updated_at ON public.medical_records;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_lifestyle_profiles_updated_at ON public.lifestyle_profiles;
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;

CREATE TRIGGER update_user_medicines_updated_at BEFORE UPDATE ON public.user_medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_logs_updated_at BEFORE UPDATE ON public.health_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnoses_updated_at BEFORE UPDATE ON public.diagnoses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON public.medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lifestyle_profiles_updated_at BEFORE UPDATE ON public.lifestyle_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- SETUP COMPLETE - Can be run multiple times safely!
-- =====================================================================
```

---

## ✅ WHAT'S FIXED

✓ Added `CREATE TABLE IF NOT EXISTS` - safe to run again
✓ Added `CREATE INDEX IF NOT EXISTS` - won't error on re-run
✓ Added `DROP POLICY IF EXISTS` before creating policies - removes old ones first
✓ Added `DROP TRIGGER IF EXISTS` before creating triggers - removes old ones first
✓ Changed `ALTER TABLE` to `ALTER TABLE IF EXISTS` - safe if table already exists

---

## 🎯 HOW TO USE

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. **Delete the old SQL** that gave you the error
4. Paste **this corrected SQL** above
5. Click "Run"
6. ✓ No errors, all done!

---

This can now be run as many times as you want without errors! 🎉
