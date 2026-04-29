import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Heart, Weight, Droplet, Utensils, AlertCircle, Calendar,
  Pill, TrendingUp, FileText, Clock, ChevronRight, AlertTriangle,
  Info, CheckCircle, Plus, Edit2, Loader
} from 'lucide-react';

import HealthMetricsCard from '../components/dashboard/HealthMetricsCard';
import AllergiesSection from '../components/dashboard/AllergiesSection';
import MedicineRemindersWidget from '../components/dashboard/MedicineRemindersWidget';
import MedicalInsightsWidget from '../components/dashboard/MedicalInsightsWidget';
import ReportsSection from '../components/dashboard/ReportsSection';
import AppointmentsWidget from '../components/dashboard/AppointmentsWidget';
import ProfileCompletionCard from '../components/dashboard/ProfileCompletionCard';



export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) setProfile(profileData);

      // Load today's health metrics
      const today = new Date().toISOString().split('T')[0];
      const { data: metricsData } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_date', today)
        .single();

      if (metricsData) setHealthMetrics(metricsData);

      // Load allergies
      const { data: allergiesData } = await supabase
        .from('user_allergies')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (allergiesData) setAllergies(allergiesData);

      // Load active medicines
      const { data: medicinesData } = await supabase
        .from('user_medicines')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (medicinesData) setMedicines(medicinesData);

      // Load upcoming appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: true })
        .limit(5);

      if (appointmentsData) setAppointments(appointmentsData);

      // Generate insights from latest lab analysis results
      const { data: analysisData } = await supabase
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'lab')
        .order('created_at', { ascending: false })
        .limit(3);

      if (analysisData && analysisData.length > 0) {
        const derived = [];
        analysisData.forEach((entry) => {
          const a = entry.analysis || {};
          const dateStr = new Date(entry.created_at).toLocaleDateString();

          // Urgent findings → alert severity
          (a.urgent_findings || []).forEach((f) => {
            derived.push({
              id: `${entry.id}-uf-${derived.length}`,
              severity: 'alert',
              title: '⚠️ Urgent Finding',
              description: f,
              recommendations: 'Please consult your doctor immediately.',
              source_date: dateStr,
            });
          });

          // High-probability predicted diseases → warning severity
          (a.predicted_diseases || []).filter(d => d.probability === 'High').forEach((d) => {
            derived.push({
              id: `${entry.id}-pd-${derived.length}`,
              severity: 'warning',
              title: `🦠 ${d.disease_name}`,
              description: d.reasoning,
              recommendations: `High probability detected on ${dateStr}. Schedule a follow-up.`,
              source_date: dateStr,
            });
          });

          // Warnings from explanation
          (a.explanation?.warnings || []).filter(w => w && w.length > 3).forEach((w) => {
            derived.push({
              id: `${entry.id}-w-${derived.length}`,
              severity: 'info',
              title: '📋 Health Warning',
              description: w,
              recommendations: a.explanation?.when_to_consult || '',
              source_date: dateStr,
            });
          });

          // Abnormal test results → info severity
          (a.test_results || []).filter(t => t.status === 'High' || t.status === 'Low' || t.status === 'Critical').forEach((t) => {
            derived.push({
              id: `${entry.id}-tr-${derived.length}`,
              severity: t.status === 'Critical' ? 'alert' : 'warning',
              title: `${t.status === 'Critical' ? '🚨' : '📊'} ${t.name} ${t.status}`,
              description: `${t.name}: ${t.value} ${t.unit || ''} (Normal: ${t.normal_range}). ${t.description || ''}`,
              recommendations: '',
              source_date: dateStr,
            });
          });
        });
        setInsights(derived.slice(0, 8));
      }
    } catch (err) {
      console.error('Dashboard data load error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your medical dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Medical Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {profile?.full_name || 'User'}! Here's your complete health overview.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Profile Completion Card */}
        {profile && !profile.profile_completed && (
          <ProfileCompletionCard profile={profile} onUpdate={loadDashboardData} />
        )}

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Height & Weight */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Height</h3>
              <Height className="w-5 h-5 text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {profile?.height_cm ? `${profile.height_cm} cm` : 'Not set'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Body measurement</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Weight</h3>
              <Weight className="w-5 h-5 text-teal-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not set'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Current weight</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Age</h3>
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {profile?.date_of_birth 
                ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()
                : 'Not set'} yrs
            </p>
            <p className="text-xs text-gray-500 mt-2">Years old</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Diet</h3>
              <Utensils className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900 capitalize">
              {profile?.dietary_preference ? profile.dietary_preference.split('-').join(' ') : 'Not set'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Dietary preference</p>
          </div>
        </div>

        {/* Health Metrics & Allergies Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today's Health Metrics */}
          <div className="lg:col-span-2">
            <HealthMetricsCard metrics={healthMetrics} onUpdate={loadDashboardData} userId={user.id} />
          </div>

          {/* Allergies */}
          <div>
            <AllergiesSection allergies={allergies} onUpdate={loadDashboardData} userId={user.id} />
          </div>
        </div>

        {/* Medicine Reminders & Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Medicine Reminders */}
          <div>
            <MedicineRemindersWidget medicines={medicines} onUpdate={loadDashboardData} />
          </div>

          {/* Medical Insights */}
          <div>
            <MedicalInsightsWidget insights={insights} onUpdate={loadDashboardData} />
          </div>
        </div>

        {/* Appointments & Reports Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointments */}
          <div>
            <AppointmentsWidget appointments={appointments} onUpdate={loadDashboardData} />
          </div>

          {/* Medical Reports */}
          <div>
            <ReportsSection onUpdate={loadDashboardData} userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Height icon component
function Height(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20M7 7h10M7 17h10M12 2l3 3M12 2l-3 3M12 22l3-3M12 22l-3-3" />
    </svg>
  );
}
