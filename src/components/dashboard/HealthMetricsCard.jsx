import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Heart, Droplet, Thermometer, TrendingUp, Loader, AlertCircle } from 'lucide-react';

export default function HealthMetricsCard({ metrics, onUpdate, userId }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    blood_pressure_systolic: metrics?.blood_pressure_systolic || '',
    blood_pressure_diastolic: metrics?.blood_pressure_diastolic || '',
    heart_rate: metrics?.heart_rate || '',
    temperature: metrics?.temperature || '',
    blood_glucose: metrics?.blood_glucose || '',
    weight_kg: metrics?.weight_kg || '',
    sleep_hours: metrics?.sleep_hours || '',
    water_intake_liters: metrics?.water_intake_liters || '',
    exercise_minutes: metrics?.exercise_minutes || '',
    notes: metrics?.notes || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (metrics?.id) {
        // Update existing
        await supabase
          .from('health_metrics')
          .update(formData)
          .eq('id', metrics.id);
      } else {
        // Insert new
        await supabase
          .from('health_metrics')
          .insert({
            user_id: userId,
            metric_date: today,
            ...formData,
          });
      }

      setShowForm(false);
      onUpdate();
    } catch (err) {
      console.error('Metrics save error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Today's Health Metrics</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Pressure (Sys/Dias)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="blood_pressure_systolic"
                  value={formData.blood_pressure_systolic}
                  onChange={handleChange}
                  placeholder="120"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
                <input
                  type="number"
                  name="blood_pressure_diastolic"
                  value={formData.blood_pressure_diastolic}
                  onChange={handleChange}
                  placeholder="80"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                name="heart_rate"
                value={formData.heart_rate}
                onChange={handleChange}
                placeholder="72"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
                placeholder="37.0"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Glucose (mg/dL)
              </label>
              <input
                type="number"
                name="blood_glucose"
                value={formData.blood_glucose}
                onChange={handleChange}
                placeholder="100"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                name="weight_kg"
                value={formData.weight_kg}
                onChange={handleChange}
                placeholder="70"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sleep Hours
              </label>
              <input
                type="number"
                step="0.5"
                name="sleep_hours"
                value={formData.sleep_hours}
                onChange={handleChange}
                placeholder="8"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Water Intake (liters)
              </label>
              <input
                type="number"
                step="0.1"
                name="water_intake_liters"
                value={formData.water_intake_liters}
                onChange={handleChange}
                placeholder="2"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercise (minutes)
              </label>
              <input
                type="number"
                name="exercise_minutes"
                value={formData.exercise_minutes}
                onChange={handleChange}
                placeholder="30"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes..."
              rows="2"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? 'Saving...' : 'Save Metrics'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Today's Health Metrics</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          {metrics ? 'Update' : 'Add'}
        </button>
      </div>

      {metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'BP', value: `${metrics.blood_pressure_systolic}/${metrics.blood_pressure_diastolic}` || '-', icon: Droplet },
            { label: 'HR', value: `${metrics.heart_rate} bpm` || '-', icon: Heart },
            { label: 'Temp', value: `${metrics.temperature}°C` || '-', icon: Thermometer },
            { label: 'Glucose', value: `${metrics.blood_glucose} mg/dL` || '-', icon: TrendingUp },
            { label: 'Weight', value: `${metrics.weight_kg} kg` || '-', icon: TrendingUp },
            { label: 'Sleep', value: `${metrics.sleep_hours} hrs` || '-', icon: TrendingUp },
          ].map((metric, idx) => (
            <div key={idx} className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
              <p className="text-xs font-medium text-gray-600 mb-1">{metric.label}</p>
              <p className="text-lg font-bold text-gray-900">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No metrics recorded today</p>
          <p className="text-sm text-gray-500">Click "Add" to record your health metrics</p>
        </div>
      )}
    </div>
  );
}
