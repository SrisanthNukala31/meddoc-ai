# 🔥 CODES & LOCATIONS - QUICK REFERENCE

---

## 📍 CODE 1: SUPABASE SQL - Create All Tables

**WHERE TO RUN:** Supabase Dashboard → SQL Editor → New Query → Paste & Run

```sql
-- =====================================================================
-- COMPLETE MEDDOC AI DATABASE SETUP
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

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

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

ALTER TABLE public.user_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medicines" ON public.user_medicines
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medicines" ON public.user_medicines
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicines" ON public.user_medicines
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicines" ON public.user_medicines
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_medicines_user_id ON public.user_medicines(user_id);
CREATE INDEX idx_user_medicines_is_active ON public.user_medicines(is_active);
CREATE INDEX idx_user_medicines_start_date ON public.user_medicines(start_date);
CREATE INDEX idx_user_medicines_email_notifications ON public.user_medicines(email_notifications);

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

ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their health logs" ON public.health_logs
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_health_logs_user_id ON public.health_logs(user_id);
CREATE INDEX idx_health_logs_date ON public.health_logs(date);

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

ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their diagnoses" ON public.diagnoses
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_diagnoses_user_id ON public.diagnoses(user_id);
CREATE INDEX idx_diagnoses_date ON public.diagnoses(date);
CREATE INDEX idx_diagnoses_severity ON public.diagnoses(severity);

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

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their medical records" ON public.medical_records
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_medical_records_user_id ON public.medical_records(user_id);
CREATE INDEX idx_medical_records_record_type ON public.medical_records(record_type);

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

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their appointments" ON public.appointments
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_appointment_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- 7. OTP CODES TABLE
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes'),
    used BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own OTP codes" ON public.otp_codes
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can view their own OTP codes" ON public.otp_codes
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update their own OTP codes" ON public.otp_codes
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX idx_otp_codes_used ON public.otp_codes(used);

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

ALTER TABLE public.lifestyle_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their lifestyle profile" ON public.lifestyle_profiles
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_lifestyle_profiles_user_id ON public.lifestyle_profiles(user_id);

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

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);

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
```

---

## 📍 CODE 2: CREATE .env FILE

**WHERE TO RUN:** Project root folder

**File name:** `.env`

**Content:**

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
VITE_OPENAI_API_KEY=sk-...
```

**How to get values:**
1. `VITE_SUPABASE_URL` → Supabase Dashboard → Settings → API → Project URL
2. `SUPABASE_SERVICE_ROLE_KEY` → Supabase Dashboard → Settings → API → Service Role Secret
3. `SMTP_PASSWORD` → Gmail → https://myaccount.google.com/apppasswords (App Password, not account password)

---

## 📍 CODE 3: BACKEND - START SERVER

**WHERE TO RUN:** PowerShell Terminal 1

```bash
cd backend
python main.py
```

**Wait for:**
```
INFO:xray-api:Medicine reminder scheduler started.
Uvicorn running on http://127.0.0.1:8000
```

---

## 📍 CODE 4: TEST EMAIL

**WHERE TO RUN:** PowerShell Terminal 2 (while backend running)

```bash
curl "http://localhost:8000/api/test-email?email=your_email@gmail.com"
```

**Expected response:**
```json
{"status": "success", "message": "Test email sent to your_email@gmail.com"}
```

---

## 📍 CODE 5: FRONTEND - START DEVELOPMENT

**WHERE TO RUN:** PowerShell Terminal 3

```bash
npm run dev
```

**Go to:** http://localhost:5173

---

## 📍 CODE 6: VERIFY DATABASE (Optional)

**WHERE TO RUN:** Supabase Dashboard → SQL Editor

**Check all tables created:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

**Check user_medicines columns:**
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_medicines' ORDER BY ordinal_position;
```

---

## 📋 SUMMARY - RUN IN ORDER

| Step | What | Where | Command |
|------|------|-------|---------|
| 1 | Create database | Supabase SQL Editor | Paste CODE 1 & Run |
| 2 | Create .env file | Project root | Create file with CODE 2 |
| 3 | Start backend | Terminal 1 | `cd backend && python main.py` |
| 4 | Test email | Terminal 2 | `curl "http://localhost:8000/api/test-email?email=your@email.com"` |
| 5 | Start frontend | Terminal 3 | `npm run dev` |
| 6 | Verify | http://localhost:5173 | Log in and create medicine reminder |

---

## ✅ DONE!

All setup is complete when:
- ✓ Backend running and showing "scheduler started"
- ✓ Test email arrives in inbox
- ✓ Frontend running at localhost:5173
- ✓ Can create and save medicine reminder

---

**THAT'S IT! 🎉**
