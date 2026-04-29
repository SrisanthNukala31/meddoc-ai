# Demo Data Removal Guide

## Overview
The Dashboard currently displays demo/sample data for UI screenshots and development purposes. This guide explains how to remove it when going to production.

## Files with Demo Data

### 1. **src/pages/Dashboard.jsx**
Contains demo constants at the top of the file:
- `DEMO_PROFILE` - Sample user profile
- `DEMO_METRICS` - Sample health metrics
- `DEMO_ALLERGIES` - Sample allergies
- `DEMO_MEDICINES` - Sample medicines
- `DEMO_APPOINTMENTS` - Sample appointments
- `DEMO_INSIGHTS` - Sample health insights

### 2. **src/components/dashboard/ReportsSection.jsx**
Contains demo reports:
- `DEMO_REPORTS` - Sample medical reports

---

## How to Remove Demo Data

### Step 1: Remove from Dashboard.jsx

**Location**: `src/pages/Dashboard.jsx` (Lines 1-120 approximately)

**Action**: Delete the entire demo data section:
```javascript
// ❌ DELETE THIS ENTIRE BLOCK:
// Demo data for UI screenshots - REMOVE THIS SECTION WHEN GOING TO PRODUCTION
const DEMO_PROFILE = { ... }
const DEMO_METRICS = { ... }
const DEMO_ALLERGIES = [ ... ]
const DEMO_MEDICINES = [ ... ]
const DEMO_APPOINTMENTS = [ ... ]
const DEMO_INSIGHTS = [ ... ]
```

**Replace with**:
```javascript
// ✅ USE THIS INSTEAD:
const DEMO_PROFILE = null;      // Remove demo
const DEMO_METRICS = null;      // Remove demo
const DEMO_ALLERGIES = [];      // Remove demo
const DEMO_MEDICINES = [];      // Remove demo
const DEMO_APPOINTMENTS = [];   // Remove demo
const DEMO_INSIGHTS = [];       // Remove demo
```

OR simply change the initial state to empty:

**Find this**:
```javascript
const [profile, setProfile] = useState(DEMO_PROFILE);
const [healthMetrics, setHealthMetrics] = useState(DEMO_METRICS);
const [allergies, setAllergies] = useState(DEMO_ALLERGIES);
const [medicines, setMedicines] = useState(DEMO_MEDICINES);
const [appointments, setAppointments] = useState(DEMO_APPOINTMENTS);
const [insights, setInsights] = useState(DEMO_INSIGHTS);
```

**Replace with**:
```javascript
const [profile, setProfile] = useState(null);
const [healthMetrics, setHealthMetrics] = useState(null);
const [allergies, setAllergies] = useState([]);
const [medicines, setMedicines] = useState([]);
const [appointments, setAppointments] = useState([]);
const [insights, setInsights] = useState([]);
```

### Step 2: Remove Demo Data Banner

**Find this** in Dashboard.jsx:
```javascript
{/* Demo Data Banner */}
<div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded text-blue-800">
  <p className="font-semibold text-sm">
    📊 Demo Data Mode - This dashboard is displaying sample/demo data...
  </p>
</div>
```

**Delete** this entire block.

### Step 3: Remove from ReportsSection.jsx

**Location**: `src/components/dashboard/ReportsSection.jsx` (Line 1-30 approximately)

**Delete this**:
```javascript
// Demo reports data
const DEMO_REPORTS = [
  { id: 'report-1', ... },
  { id: 'report-2', ... },
];
```

**Find this line**:
```javascript
const [reports, setReports] = useState(DEMO_REPORTS);
```

**Replace with**:
```javascript
const [reports, setReports] = useState([]);
```

### Step 4: Update Loading Logic (Optional)

In Dashboard.jsx, you can remove the comment "If no real data, keep demo data":

**Find**:
```javascript
if (metricsData) setHealthMetrics(metricsData);
// If no real metrics, keep demo data
```

**Replace with**:
```javascript
if (metricsData) setHealthMetrics(metricsData);
```

---

## Verification After Removal

After removing demo data, verify:

1. ✅ Dashboard loads without demo banner
2. ✅ Empty states show for unrecorded data
3. ✅ Real data appears when you add it
4. ✅ New user signup shows empty dashboard
5. ✅ No console warnings about undefined data

---

## Quick Checklist

- [ ] Delete DEMO_* constants from Dashboard.jsx
- [ ] Change initial state to null/[] in Dashboard.jsx
- [ ] Remove demo banner JSX
- [ ] Delete DEMO_REPORTS from ReportsSection.jsx
- [ ] Update Reports initial state to []
- [ ] Test dashboard with real data
- [ ] Verify empty states display correctly
- [ ] Check console for errors

---

## Sample Diff (What Should Change)

**Before (with demo data)**:
```javascript
const [profile, setProfile] = useState(DEMO_PROFILE);  // Has data
const [allergies, setAllergies] = useState(DEMO_ALLERGIES);  // Has 2 items
```

**After (production ready)**:
```javascript
const [profile, setProfile] = useState(null);  // Empty until loaded
const [allergies, setAllergies] = useState([]);  // Empty until loaded
```

---

## Testing Production Mode

1. **Sign up with new account** - Dashboard should be completely empty
2. **Add health metrics** - Only metrics you add should appear
3. **Add allergies** - Only allergies you add should appear
4. **Add medicines** - Only medicines you add should appear
5. **Create appointments** - Only appointments you create should appear

---

**Important**: Never commit demo data to production branch!

Add to `.gitignore` or create a pre-commit hook to prevent accidental commits.

---

**Last Updated**: April 2026  
**Status**: Demo Mode - Ready for Removal  
**Priority**: HIGH - Remove before deploying to production
