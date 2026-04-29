import { Calendar, MapPin, User, Trash2, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AppointmentsWidget({ appointments, onUpdate }) {
  const handleDelete = async (id) => {
    if (confirm('Cancel this appointment?')) {
      try {
        await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', id);
        onUpdate();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleMarkComplete = async (id) => {
    try {
      await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', id);
      onUpdate();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const isUpcoming = (date) => new Date(date) > new Date();

  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Appointments</h3>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No appointments scheduled</p>
          <p className="text-sm text-gray-500">Go to Appointments to schedule a visit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Upcoming Appointments</h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {appointments.map(apt => (
          <div
            key={apt.id}
            className={`p-4 rounded-xl border-2 transition ${
              isUpcoming(apt.appointment_date)
                ? 'border-teal-100 bg-teal-50/50 hover:border-teal-300'
                : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">{apt.doctor_name}</h4>
                <p className="text-xs text-gray-600">{apt.specialization || 'Doctor'}</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  apt.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : apt.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                }`}
              >
                {apt.status}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>{new Date(apt.appointment_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>{apt.appointment_time}</span>
              </div>
              {apt.clinic_name && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span>{apt.clinic_name}</span>
                </div>
              )}
              {apt.reason && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span className="text-xs font-medium">Reason:</span>
                  <span>{apt.reason}</span>
                </div>
              )}
            </div>

            {apt.status === 'scheduled' && (
              <div className="flex gap-2 pt-3 border-t border-black/10">
                <button
                  onClick={() => handleMarkComplete(apt.id)}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-green-600 hover:bg-green-50 px-3 py-2 rounded transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </button>
                <button
                  onClick={() => handleDelete(apt.id)}
                  className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-2 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
