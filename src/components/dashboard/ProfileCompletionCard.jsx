import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfileCompletionCard({ profile, onUpdate }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    height_cm: profile?.height_cm || '',
    weight_kg: profile?.weight_kg || '',
    date_of_birth: profile?.date_of_birth || '',
    gender: profile?.gender || '',
    blood_type: profile?.blood_type || '',
    dietary_preference: profile?.dietary_preference || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await supabase
        .from('user_profiles')
        .update({
          ...formData,
          profile_completed: true,
        })
        .eq('id', profile.id);

      setShowForm(false);
      onUpdate();
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const completionPercentage = Math.round(
    ((formData.full_name ? 1 : 0) +
      (formData.height_cm ? 1 : 0) +
      (formData.weight_kg ? 1 : 0) +
      (formData.date_of_birth ? 1 : 0) +
      (formData.gender ? 1 : 0) +
      (formData.blood_type ? 1 : 0) +
      (formData.dietary_preference ? 1 : 0)) /
      7 *
      100
  );

  if (showForm) {
    return (
      <div className="mb-8 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Complete Your Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                name="height_cm"
                value={formData.height_cm}
                onChange={handleChange}
                placeholder="170"
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
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Type
              </label>
              <select
                name="blood_type"
                value={formData.blood_type}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="">Select blood type</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dietary Preference
              </label>
              <select
                name="dietary_preference"
                value={formData.dietary_preference}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              >
                <option value="">Select dietary preference</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="eggterian">Eggterian</option>
                <option value="non-vegetarian">Non-vegetarian</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg transition"
            >
              Later
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Complete Your Profile
          </h3>
          <p className="text-sm text-gray-700 mt-2">
            Add your health details to get personalized insights and accurate recommendations.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile Completion</span>
          <span className="text-sm font-bold text-amber-700">{Math.round(completionPercentage)}%</span>
        </div>
        <div className="w-full bg-amber-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className={`text-xs font-medium ${formData.full_name ? 'text-green-700' : 'text-gray-700'}`}>
          {formData.full_name ? '✓' : '○'} Name
        </div>
        <div className={`text-xs font-medium ${formData.height_cm ? 'text-green-700' : 'text-gray-700'}`}>
          {formData.height_cm ? '✓' : '○'} Height
        </div>
        <div className={`text-xs font-medium ${formData.weight_kg ? 'text-green-700' : 'text-gray-700'}`}>
          {formData.weight_kg ? '✓' : '○'} Weight
        </div>
        <div className={`text-xs font-medium ${formData.date_of_birth ? 'text-green-700' : 'text-gray-700'}`}>
          {formData.date_of_birth ? '✓' : '○'} DOB
        </div>
        <div className={`text-xs font-medium ${formData.gender ? 'text-green-700' : 'text-gray-700'}`}>
          {formData.gender ? '✓' : '○'} Gender
        </div>
        <div className={`text-xs font-medium ${formData.blood_type ? 'text-green-700' : 'text-gray-700'}`}>
          {formData.blood_type ? '✓' : '○'} Blood Type
        </div>
        <div className={`text-xs font-medium col-span-2 ${formData.dietary_preference ? 'text-green-700' : 'text-gray-700'}`}>
          {formData.dietary_preference ? '✓' : '○'} Diet Preference
        </div>
      </div>

      <button
        onClick={() => setShowForm(true)}
        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium py-2 rounded-lg transition"
      >
        Complete Profile Now
      </button>
    </div>
  );
}
