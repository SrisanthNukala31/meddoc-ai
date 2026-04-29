import { Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

export default function MedicineRemindersWidget({ medicines, onUpdate }) {
  if (!medicines || medicines.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Active Medicines</h3>
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No active medicines</p>
          <p className="text-sm text-gray-500">Go to Medicine Reminders to add medicines</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Active Medicines ({medicines.length})</h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {medicines.map(medicine => {
          const endDate = medicine.duration_days
            ? new Date(new Date(medicine.start_date).getTime() + medicine.duration_days * 24 * 60 * 60 * 1000)
            : null;
          const isCompleted = endDate && (new Date() > endDate);
          const isEndingSoon = endDate && !isCompleted && ((endDate - new Date()) < 2 * 24 * 60 * 60 * 1000);

          return (
            <div
              key={medicine.id}
              className={`p-4 rounded-xl border-2 transition ${
                isCompleted
                  ? 'border-gray-200 bg-gray-50 opacity-75'
                  : isEndingSoon
                  ? 'border-orange-200 bg-orange-50'
                  : 'border-teal-100 bg-teal-50/50 hover:border-teal-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-gray-900">{medicine.name}</h4>
                  <p className="text-sm text-gray-600">{medicine.dosage}</p>
                </div>
                <Clock className={`w-5 h-5 ${isCompleted ? 'text-gray-400' : isEndingSoon ? 'text-orange-600' : 'text-teal-600'}`} />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium text-gray-900 capitalize">{medicine.frequency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Times:</span>
                  <span className="font-medium text-gray-900">{medicine.times?.join(', ') || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium text-gray-900">
                    {medicine.duration_days ? `${medicine.duration_days} days` : 'Ongoing'}
                  </span>
                </div>
              </div>

              {medicine.email_notifications && (
                <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Email notifications on
                </div>
              )}

              {isCompleted && (
                <div className="mt-3 p-2 bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Course Completed</span>
                </div>
              )}

              {isEndingSoon && (
                <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">Medicine course ending soon</span>
                </div>
              )}

              {medicine.notes && (
                <p className="mt-3 text-xs text-gray-600 italic">Note: {medicine.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
