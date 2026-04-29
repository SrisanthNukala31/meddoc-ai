import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export default function AllergiesSection({ allergies, onUpdate, userId }) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    food_name: '',
    severity: 'moderate',
    symptoms: '',
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
        .from('user_allergies')
        .insert({
          user_id: userId,
          ...formData,
        });

      setFormData({ food_name: '', severity: 'moderate', symptoms: '' });
      setShowForm(false);
      onUpdate();
    } catch (err) {
      console.error('Allergy add error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this allergy?')) {
      try {
        await supabase.from('user_allergies').delete().eq('id', id);
        onUpdate();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'moderate': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'severe': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (showForm) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Add Allergy</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Food Name
            </label>
            <input
              type="text"
              name="food_name"
              value={formData.food_name}
              onChange={handleChange}
              required
              placeholder="e.g., Peanuts, Shellfish"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symptoms
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="e.g., Itching, Swelling, Hives"
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
              {loading ? 'Adding...' : 'Add Allergy'}
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
        <h3 className="text-lg font-bold text-gray-900">Allergies</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg font-medium text-sm transition"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {allergies.length > 0 ? (
          allergies.map(allergy => (
            <div
              key={allergy.id}
              className={`p-3 rounded-lg border flex items-start justify-between ${getSeverityColor(allergy.severity)}`}
            >
              <div className="flex-1">
                <p className="font-semibold text-sm capitalize">{allergy.food_name}</p>
                {allergy.symptoms && (
                  <p className="text-xs opacity-75 mt-1">{allergy.symptoms}</p>
                )}
                <span className="text-xs font-medium mt-2 inline-block capitalize px-2 py-1 bg-black/10 rounded">
                  {allergy.severity}
                </span>
              </div>
              <button
                onClick={() => handleDelete(allergy.id)}
                className="ml-3 p-2 hover:bg-black/10 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No allergies recorded</p>
          </div>
        )}
      </div>
    </div>
  );
}
