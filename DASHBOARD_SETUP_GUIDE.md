# Medical Analytics Dashboard - Setup Guide

## Overview
A comprehensive medical analytics dashboard for patients to track their health metrics, medications, allergies, medical history, appointments, and personalized health insights.

## Features Included

### 1. **Health Dashboard** (Main Landing Page After Login)
- Overview of user's complete health profile
- Quick stats cards: Height, Weight, Age, Dietary Preference
- Health metrics tracking and visualization
- Allergies management
- Medicine reminders at a glance
- Medical insights feed
- Upcoming appointments
- Medical reports archive

### 2. **Health Metrics Card**
- Record daily health measurements:
  - Blood Pressure (Systolic/Diastolic)
  - Heart Rate (BPM)
  - Body Temperature
  - Blood Glucose (mg/dL)
  - Weight
  - Sleep Hours
  - Water Intake
  - Exercise Minutes
- Add or update daily metrics
- Visual display of today's recorded metrics

### 3. **Allergies Section**
- Manage food allergies with:
  - Food name
  - Severity level (Mild, Moderate, Severe)
  - Symptoms description
- Color-coded severity indicators
- Add/Remove allergies easily

### 4. **Medicine Reminders Widget**
- Display all active medicines
- Show:
  - Medicine name and dosage
  - Frequency (daily, morning, evening, etc.)
  - Scheduled times
  - Duration remaining
  - Email notification status
  - Important notes
- Alert when medicine course is ending

### 5. **Medical Insights**
- AI-generated health recommendations
- Categorized by severity: Info, Warning, Alert
- Personalized suggestions based on health data
- Mark insights as read
- Track health trends

### 6. **Appointments Widget**
- View upcoming appointments
- Details include:
  - Doctor name and specialization
  - Clinic location
  - Date and time
  - Appointment reason
  - Appointment status
- Mark appointments as completed
- Cancel appointments
- Color-coded status indicators

### 7. **Medical Reports**
- Upload and organize medical reports
- Report types:
  - Blood Test
  - X-Ray
  - Ultrasound
  - MRI
  - CT Scan
  - EKG
  - COVID Test
  - General Report
- Store findings and doctor's analysis
- Track doctor and clinic information

### 8. **Profile Completion Card**
- Prompt users to complete their health profile
- Fields:
  - Full Name
  - Date of Birth
  - Height (cm)
  - Weight (kg)
  - Gender
  - Blood Type
  - Dietary Preference
- Progress bar showing completion percentage
- Visual checklist of required fields

---

## Installation & Setup

### Step 1: Run Database Migration
Copy and run the SQL from `DASHBOARD_TABLES_SETUP.sql` in your Supabase SQL Editor:

**File Location:** `DASHBOARD_TABLES_SETUP.sql`

This creates:
- `user_allergies` table
- `health_metrics` table
- `medical_reports` table
- `appointments` table
- `medical_insights` table
- Extends `user_profiles` table with new health fields
- All necessary RLS policies and permissions

### Step 2: Verify Files Are in Place
```
src/
├── pages/
│   └── Dashboard.jsx              ✓ Main dashboard page
├── components/
│   └── dashboard/
│       ├── HealthMetricsCard.jsx           ✓ Health tracking
│       ├── AllergiesSection.jsx            ✓ Allergy management
│       ├── MedicineRemindersWidget.jsx     ✓ Active medicines
│       ├── MedicalInsightsWidget.jsx       ✓ Health insights
│       ├── AppointmentsWidget.jsx          ✓ Upcoming appointments
│       ├── ReportsSection.jsx              ✓ Medical reports
│       └── ProfileCompletionCard.jsx       ✓ Profile setup
```

### Step 3: Start Your Application
```bash
npm run dev
```

### Step 4: Test the Dashboard
1. **Sign Up** with a new account (or use existing if profile exists)
2. **Navigate** to Dashboard using the new "Health Dashboard" menu item
3. **Complete Profile** using the yellow card at the top
4. **Add Health Metrics** by clicking the "Add" button
5. **Record Allergies** in the allergies section
6. **View Medicine Reminders** from your active medicines
7. **Add Reports** to build your medical history

---

## Database Schema

### Enhanced user_profiles table
```sql
-- New columns added:
- height_cm DECIMAL(5,2)
- weight_kg DECIMAL(5,2)
- dietary_preference TEXT ('vegetarian', 'vegan', 'non-vegetarian', 'eggterian')
- medical_history TEXT
- profile_completed BOOLEAN
```

### New Tables

**user_allergies**
- Tracks food allergies and intolerances
- Severity levels for each allergy
- Symptom descriptions

**health_metrics**
- Daily health measurements
- Blood pressure, heart rate, temperature
- Blood glucose, weight tracking
- Sleep, water intake, exercise data
- One entry per day per user

**medical_reports**
- Store medical test results
- Report types and findings
- Doctor and clinic information
- Analysis and interpretation

**appointments**
- Scheduled medical appointments
- Doctor details and specialization
- Status tracking (scheduled, completed, cancelled)

**medical_insights**
- Generated health recommendations
- Severity levels (info, warning, alert)
- Personalized health suggestions
- Read/unread tracking

---

## User Flow

1. **Login** → Redirected to Dashboard (not Home)
2. **Complete Profile** → Prompted on first visit
3. **Record Health Data** → Add metrics, allergies, appointments
4. **View Insights** → Get personalized recommendations
5. **Track Medicines** → See active reminders at a glance
6. **Manage Reports** → Maintain medical history

---

## Features by Tab

### Health Dashboard (Main)
- Overview of all health information
- Quick access to frequently used functions
- Status indicators for urgent items

### Health Metrics Card
- Daily measurement recording
- Visual display of metrics
- Historical tracking (daily basis)

### Allergies
- List all recorded allergies
- Color-coded by severity
- Easy add/remove functionality

### Medicine Reminders
- Active medications only
- Duration tracking
- Email notification status

### Appointments
- Upcoming and past appointments
- Status management
- Doctor and location details

### Medical Reports
- Organized by type
- Easy document management
- Doctor and clinic info
- Findings storage

### Medical Insights
- Auto-generated recommendations
- Severity-based alerts
- Health trend analysis

---

## Troubleshooting

### Dashboard Not Loading
**Problem:** 404 error when accessing `/dashboard`
**Solution:** 
- Ensure Dashboard.jsx exists in `src/pages/`
- Check App.jsx has correct route definition
- Restart dev server: `npm run dev`

### Data Not Saving
**Problem:** Allergies or metrics not being saved
**Solution:**
- Check browser console for error messages
- Verify RLS policies are enabled in Supabase
- Confirm user_id is being passed correctly
- Check SQL migration ran successfully

### Profile Not Showing
**Problem:** Health metrics not displaying
**Solution:**
- Complete user profile first (required)
- Ensure date of birth is set (for age calculation)
- Check that data exists for selected date

### RLS Policy Errors
**Problem:** "Permission denied" errors
**Solution:**
- Re-run the DASHBOARD_TABLES_SETUP.sql
- Check that `authenticated` role has grants
- Verify user is properly authenticated

---

## Future Enhancements

1. **Graphs & Charts**: Visualize health metrics over time
2. **Health Goals**: Set and track wellness objectives
3. **Notifications**: Push reminders for appointments
4. **Integration**: Connect with wearable devices
5. **Export**: Generate health reports as PDF
6. **Sharing**: Share health data with doctors
7. **AI Analytics**: Advanced health predictions
8. **Telemedicine**: Video consultation booking

---

## File Structure Summary
```
Dashboard System
├── Database (Supabase)
│   ├── user_profiles (enhanced)
│   ├── user_allergies
│   ├── health_metrics
│   ├── medical_reports
│   ├── appointments
│   └── medical_insights
├── Frontend Components
│   ├── Dashboard.jsx (main page)
│   └── dashboard/ (sub-components)
└── Routes
    └── /dashboard (protected)
```

---

## Next Steps

1. ✅ Run `DASHBOARD_TABLES_SETUP.sql` in Supabase
2. ✅ Restart dev server
3. ✅ Login and complete profile
4. ✅ Add health metrics for today
5. ✅ Record an allergy
6. ✅ Schedule an appointment
7. ✅ Upload a medical report
8. ✅ View dashboard insights

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Status**: Production Ready
