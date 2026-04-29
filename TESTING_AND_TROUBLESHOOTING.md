# 🔧 TROUBLESHOOTING & TESTING GUIDE

## Quick Health Check

Run this checklist to verify everything is working:

### 1️⃣ Database Tables Verification
**Go to Supabase Dashboard > SQL Editor**

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected output:
```
user_profiles
user_medicines ✓ (must have email_notifications field)
health_logs
diagnoses
medical_records
appointments
otp_codes
lifestyle_profiles
audit_logs
admin_settings
```

### 2️⃣ Medicine Reminders Table Check
**Verify the correct schema:**

```sql
-- Check user_medicines columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_medicines'
ORDER BY ordinal_position;
```

Should show:
- ✓ `id` (UUID)
- ✓ `user_id` (UUID)
- ✓ `name` (TEXT)
- ✓ `dosage` (TEXT)
- ✓ `frequency` (TEXT)
- ✓ `times` (TEXT[])
- ✓ `start_date` (DATE)
- ✓ `duration_days` (INTEGER)
- ✓ `notes` (TEXT)
- ✓ `email_notifications` (BOOLEAN) **← CRITICAL**
- ✓ `is_active` (BOOLEAN)

### 3️⃣ Backend Environment Check
**File: `.env` in project root**

```bash
# Check file exists
cat .env

# Should contain:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
```

### 4️⃣ Backend Startup Test
**Terminal 1: Start Backend**

```bash
cd backend
python main.py
```

Expected output:
```
INFO:xray-api:Device: cpu
INFO:xray-api:torchxrayvision DenseNet121 loaded
INFO:xray-api:Local Disease ML Model loaded
INFO:xray-api:Medicine reminder scheduler started. ✓
Uvicorn running on http://127.0.0.1:8000
```

### 5️⃣ Email Configuration Test
**Test via API:**

```bash
curl "http://localhost:8000/api/test-email?email=your_email@gmail.com"
```

Expected response:
```json
{
  "status": "success",
  "message": "Test email sent to your_email@gmail.com"
}
```

Check your email for the test message with:
- Subject: "Medicine Reminder: Time for Test Medicine"
- Body contains: Medicine name, Dosage, Notes, formatted HTML

**If email doesn't arrive:**
- Check SPAM folder
- Verify SMTP credentials
- Try generating new App Password for Gmail
- Check backend logs for errors

### 6️⃣ Frontend Setup Test
**Terminal 2: Start Frontend**

```bash
npm run dev
```

Expected output:
```
VITE v... dev server running at:
➜  Local:   http://localhost:5173/
```

### 7️⃣ Medicine Reminder Save Test

**Steps:**
1. Go to http://localhost:5173/
2. Login with test account
3. Navigate to "Medicine Reminder"
4. Click "Add Medicine Manually"
5. Fill form:
   - Name: "Test Medicine"
   - Dosage: "1 tablet"
   - Time: Current hour + 1 minute (e.g., if 2:30 PM, set 15:31)
   - Notes: "Take after food"
6. Click "Save Medicine"

**Expected:**
- ✓ No error message appears
- ✓ Record appears in "My Reminders" list
- ✓ Dosage and notes visible
- ✓ Next dose time shows correctly

**If error appears:**
```
Failed to save medication reminder: new row violates row-level security policy
```

**Fixes:**
1. Verify user is logged in (valid JWT)
2. Check user.id is being sent
3. Verify RLS policy: `auth.uid() = user_id`
4. Check user exists in auth.users table

### 8️⃣ Database Record Verification
**After saving medicine, run in Supabase SQL:**

```sql
-- Find the medicine you just created
SELECT id, user_id, name, dosage, notes, email_notifications, is_active, created_at
FROM public.user_medicines
WHERE name = 'Test Medicine'
ORDER BY created_at DESC
LIMIT 1;
```

Should return:
```
id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
user_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
name: Test Medicine
dosage: 1 tablet
notes: Take after food
email_notifications: true
is_active: true
created_at: 2024-01-15 14:30:45+00
```

### 9️⃣ User Profile Verification
**Check if user profile exists:**

```sql
SELECT id, email, full_name, created_at
FROM public.user_profiles
WHERE email = 'your_test_email@gmail.com';
```

If empty, create one:
```sql
INSERT INTO public.user_profiles (id, email)
VALUES ('your-user-uuid', 'your_test_email@gmail.com')
ON CONFLICT DO NOTHING;
```

### 🔟 Scheduled Reminder Test

**Step 1:** Create medicine reminder with current time + 1 minute
**Step 2:** Wait for that time
**Step 3:** Check if email arrives (check SPAM folder)
**Step 4:** Check backend logs for:

```
INFO:xray-api:Checking medicine reminders at HH:MM
INFO:xray-api:Sending reminder for Test Medicine to your_email@gmail.com
INFO:xray-api:Email sent to your_email@gmail.com for Test Medicine
```

---

## 🐛 Common Errors & Solutions

### Error: "PGRST116: No rows found"
**Cause:** User profile doesn't exist
**Solution:**
```sql
INSERT INTO public.user_profiles (id, email)
VALUES ('your-user-id', 'your-email@example.com');
```

### Error: "42501 - Row-level security policy violation"
**Cause:** RLS policy prevents insert
**Solution:**
1. Verify user.id matches auth.uid()
2. Check policy: SELECT * FROM pg_policies WHERE tablename = 'user_medicines';
3. Make sure user_id is sent in payload

### Error: "Email field does not exist"
**Cause:** Old code still sends user_email
**Solution:** Update code to NOT send user_email, use email_notifications instead

### Error: Reminder is not showing in UI
**Cause:** Not fetching properly
**Solution:**
1. Check browser console for JS errors
2. Verify fetchMedicines() queries is_active = true
3. Check RLS policy for SELECT

### Error: Backend scheduler not working
**Cause:** Scheduler not started or crashed
**Solution:**
1. Check backend logs for scheduler start message
2. Restart backend: `python main.py`
3. Verify APScheduler is installed: `pip install apscheduler`

---

## 📊 Data Inspection Queries

**View all medicines for a user:**
```sql
SELECT user_id, name, dosage, frequency, times, notes, email_notifications, is_active
FROM public.user_medicines
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

**View all active reminders with notifications:**
```sql
SELECT um.name, um.dosage, um.times, um.notes, up.email
FROM public.user_medicines um
JOIN public.user_profiles up ON um.user_id = up.id
WHERE um.is_active = TRUE AND um.email_notifications = TRUE
ORDER BY um.created_at DESC;
```

**Check reminder schedule for next 24 hours:**
```sql
SELECT name, times, email_notifications, is_active
FROM public.user_medicines
WHERE is_active = TRUE AND email_notifications = TRUE
LIMIT 10;
```

---

## 🔄 Complete Integration Workflow

**First Time Setup:**

1. ✓ Run COMPLETE_DATABASE_SETUP.sql in Supabase
2. ✓ Set .env variables
3. ✓ Start backend: `python backend/main.py`
4. ✓ Run test email: `curl http://localhost:8000/api/test-email?email=your@email.com`
5. ✓ Start frontend: `npm run dev`
6. ✓ Create medicine reminder
7. ✓ Verify in database
8. ✓ Wait for scheduled time
9. ✓ Verify email received

**If Existing Database:**

1. ✓ Run MIGRATION_add_email_notifications.sql
2. ✓ Verify email_notifications column exists
3. ✓ Update frontend code (remove user_email from payload)
4. ✓ Update backend code (join with user_profiles)
5. ✓ Restart backend
6. ✓ Test save and email

---

## 📝 Logging & Debugging

**View Backend Logs:**
```bash
# Real-time log monitoring
tail -f backend.log

# Search for specific issues
grep -i "error" backend.log
grep "check_medicine_reminders" backend.log
```

**Enable Debug Logging in Backend:**
```python
logging.basicConfig(level=logging.DEBUG)  # Change INFO to DEBUG
```

**Browser Console Debugging:**
```javascript
// In browser console
// Check authentication
console.log('User:', user);

// Verify patient data
console.log('Medicines:', medicines);

// Check API response
fetch('/api/test-email?email=test@example.com')
  .then(r => r.json())
  .then(d => console.log('Response:', d));
```

---

## ✅ Final Verification Checklist

- [ ] All 10 tables created in Supabase
- [ ] user_medicines has email_notifications field
- [ ] user_profiles table exists with email field
- [ ] .env file configured with all variables
- [ ] Backend starts without errors
- [ ] Test email sends successfully
- [ ] Medicine save doesn't return RLS error
- [ ] Medicine shows in "My Reminders" list
- [ ] Email arrives at scheduled time
- [ ] Email contains medicine name, dosage, notes
- [ ] Scheduler logs show "checking reminders" messages

---

**All tests passing?** ✨ You're ready to use the medicine reminder system!

Need more help? Check backend logs and database directly using Supabase dashboard.
