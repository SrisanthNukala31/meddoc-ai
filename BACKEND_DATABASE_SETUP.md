## COMPLETE MEDDOC AI BACKEND & DATABASE SETUP GUIDE

### 🗄️ REQUIRED ENVIRONMENT VARIABLES

Add these to your `.env` file in the project root:

```
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # Get from Supabase Settings > API

# SMTP Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_specific_password  # Use App Passwords if 2FA enabled

# Optional: Other API Keys
VITE_OPENAI_API_KEY=your_openai_key
VITE_GEMINI_API_KEY=your_gemini_key
```

⚠️ **CRITICAL FOR RLS**: The `SUPABASE_SERVICE_ROLE_KEY` is needed even for the backend to bypass RLS policies and insert records into `user_medicines`. This is intentional and secure since it's server-side only.

---

### 🗄️ DATABASE SETUP STEPS

1. **Copy all SQL from `COMPLETE_DATABASE_SETUP.sql`**
   - Go to Supabase Dashboard → SQL Editor
   - Create a new query
   - Paste the entire COMPLETE_DATABASE_SETUP.sql content
   - Run the query
   - This creates all tables with proper RLS policies

2. **Optional: Run Individual Table Migrations**
   - For just medicine reminders: Use `user_medicines_table.sql`
   - For OTP: Use `otp_codes_table.sql`
   - For health tracking: Use `TODO-DB.sql`

3. **Verify Tables Created**
   - Check Supabase → Table Editor
   - You should see these tables:
     - `auth.users` (default)
     - `user_profiles`
     - `user_medicines` ✓ (with email_notifications field)
     - `health_logs`
     - `diagnoses`
     - `medical_records`
     - `appointments`
     - `otp_codes`
     - `lifestyle_profiles`
     - `audit_logs`
     - `admin_settings`

---

### 📋 TABLE SCHEMA OVERVIEW

#### `user_medicines` (Medicine Reminders)
```
Fields:
- id (UUID) - Primary key
- user_id (UUID) - References auth.users
- name (TEXT) - Medicine name
- dosage (TEXT) - e.g., "1 tablet", "5mg"
- frequency (TEXT) - morning/afternoon/evening/bedtime
- times (TEXT[]) - Array of times e.g., ['09:00', '21:00']
- start_date (DATE) - When to start taking
- duration_days (INTEGER) - Optional duration
- notes (TEXT) - Special instructions (e.g., "take after food")
- email_notifications (BOOLEAN) - Enable/disable email reminders
- is_active (BOOLEAN) - Soft delete flag
- created_at, updated_at (TIMESTAMP)
```

#### `user_profiles` (User Information)
```
Fields:
- id (UUID) - References auth.users
- email (TEXT) - User's email
- full_name (TEXT)
- phone (TEXT)
- date_of_birth (DATE)
- gender (TEXT)
- blood_type (TEXT)
- created_at, updated_at (TIMESTAMP)
```

#### `health_logs` (Daily Health Tracking)
```
Fields:
- user_id (UUID)
- date (DATE)
- bmi (DECIMAL)
- heart_rate (INTEGER)
- blood_pressure (TEXT)
- weight (DECIMAL)
- diet_score (0-10)
- exercise_score (0-10)
- sleep_hours (DECIMAL)
- mood (TEXT)
- notes (TEXT)
```

#### `diagnoses` (Medical Diagnoses)
```
Fields:
- user_id (UUID)
- date (DATE)
- summary (TEXT)
- severity (low/medium/high)
- conditions (JSONB)
- symptoms (JSONB)
- recommendations (JSONB)
```

#### `medical_records` (X-rays, Reports, etc.)
```
Fields:
- user_id (UUID)
- record_type (xray/bloodtest/prescription/report/other)
- title (TEXT)
- file_url (TEXT)
- analysis_result (JSONB)
- notes (TEXT)
```

#### `appointments` (Doctor Appointments)
```
Fields:
- user_id (UUID)
- title (TEXT)
- doctor_name (TEXT)
- hospital_clinic (TEXT)
- appointment_date (TIMESTAMP)
- notes (TEXT)
- status (scheduled/completed/cancelled)
```

---

### ⚙️ BACKEND CONFIGURATION

#### Python Requirements
```bash
cd backend
pip install -r requirements.txt
```

**Key Dependencies:**
- `fastapi` - API framework
- `supabase` - Database client (uses SERVICE_ROLE_KEY)
- `apscheduler` - Background job scheduler for reminders
- `torch` & `torchvision` - ML models
- `opencv-python` - Image processing
- `python-dotenv` - Environment variables

#### Medicine Reminder Scheduler
The backend automatically checks for medicine reminders **every minute**:

```python
# In main.py lifespan()
scheduler.add_job(check_medicine_reminders, 'cron', minute='*')
```

**How it works:**
1. Runs every minute at server startup
2. Queries `user_medicines` table for active reminders
3. Matches current time (HH:MM) with times in `times` array
4. Joins with `user_profiles` to get email addresses
5. Sends HTML email with medicine details

#### Running the Backend
```bash
cd backend
python main.py
# Runs on http://localhost:8000
# Docs at http://localhost:8000/docs
```

---

### 🔐 ROW LEVEL SECURITY (RLS) POLICIES

All tables have RLS enabled with these policies:

```sql
-- Example for user_medicines:
- SELECT: Users can see only their own medicines (auth.uid() = user_id)
- INSERT: Users can only insert for themselves
- UPDATE: Users can only update their own records
- DELETE: Users can only delete their own records
```

**Backend Access:**
- The backend uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- This is secure because it's server-side only
- Never expose the service role key to the frontend

---

### 💌 EMAIL REMINDER SETUP

1. **For Gmail:**
   - Enable 2-Factor Authentication
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the generated 16-character password
   - Use this as `SMTP_PASSWORD` (NOT your regular password)

2. **For Other Email Providers:**
   - Check provider documentation for SMTP details
   - Some providers require enabling SMTP in settings

3. **Test Email Endpoint:**
   ```bash
   curl "http://localhost:8000/api/test-email?email=your_email@gmail.com"
   ```

---

### 🐛 COMMON ISSUES & FIXES

#### Issue 1: "Row-level security policy violation"
**Cause:** Missing `user_id` in insert payload or RLS policy mismatch
**Fix:** Ensure frontend sends `user_id: user.id` in payload

#### Issue 2: "user_email field not found"
**Fixed:** Updated to get email from `user_profiles` via JOIN
**Migration:** Clear old `user_email` attempts, use updated code

#### Issue 3: Email not sending
**Check:**
- `SMTP_USER` and `SMTP_PASSWORD` are correct
- Gmail: Using App Password, not account password
- SMTP server is accessible from your network
- Test with `/api/test-email` endpoint

#### Issue 4: Reminders not triggered
**Check:**
- Backend is running: `http://localhost:8000/docs`
- Medicine `times` format is HH:MM (e.g., "09:00")
- `email_notifications` is TRUE
- `is_active` is TRUE
- Scheduler is running (check backend logs)

#### Issue 5: Medicine not showing in UI after save
**Check:**
- Save was successful (no RLS error)
- Fetch logic queries `is_active = true`
- User is logged in (valid JWT token)
- No browser cache issues (hard refresh)

---

### ✅ VERIFICATION CHECKLIST

- [ ] All SQL tables created in Supabase
- [ ] `user_medicines` table has `email_notifications` field
- [ ] `user_profiles` table exists
- [ ] Environment variables set in `.env`
- [ ] Backend starts without errors
- [ ] Medicine reminder scheduler is active
- [ ] Test email sends successfully
- [ ] Medicine saves to database without RLS error
- [ ] Medicine appears in "My Reminders" list
- [ ] Email arrives for scheduled time
- [ ] Email contains: medicine name, dosage, and notes

---

### 📊 DATABASE INDEXES

All performance-critical queries have indexes:
- `user_medicines`: user_id, is_active, start_date
- `health_logs`: user_id, date
- `diagnoses`: user_id, severity, date
- `appointments`: user_id, appointment_date
- `otp_codes`: email, expires_at

---

### 🔄 MAINTENANCE TASKS

1. **Clean up expired OTP codes:**
   ```sql
   SELECT cleanup_expired_otp_codes();
   ```

2. **Archive old records:**
   ```sql
   UPDATE diagnoses SET is_archived = TRUE WHERE date < NOW() - INTERVAL '1 year';
   ```

3. **Monitor reminder job:**
   - Check backend logs for `check_medicine_reminders` messages
   - Verify scheduler is active in lifespan

---

### 📚 HELPFUL ENDPOINTS

```
GET /api/test-email?email=user@example.com
  - Test SMTP configuration

POST /api/predict-disease
  - Predict disease from symptoms

GET /api/docs
  - OpenAPI documentation
```

---

### 🎯 NEXT STEPS

1. ✅ Run `COMPLETE_DATABASE_SETUP.sql`
2. ✅ Set environment variables in `.env`
3. ✅ Start backend: `python backend/main.py`
4. ✅ Test email: `curl http://localhost:8000/api/test-email?email=your_email@gmail.com`
5. ✅ Create a medicine reminder in the UI
6. ✅ Verify:
   - Database record created
   - Email sent
   - Reminder visible in UI

---

**Need Help?**
- Check backend logs for detailed error messages
- Verify all environment variables are set
- Test API endpoints using Swagger: `http://localhost:8000/docs`
- Check Supabase dashboard for data verification
