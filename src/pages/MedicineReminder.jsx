import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, X, Upload, Edit, Trash2, Check, Bell, Calendar, Pill } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { analyzeRadiologyWithOpenAI } from '../api/openai';
import { useAuth } from '../context/AuthContext';
import { subscribeUserToPush } from '../utils/pushNotifications';

export default function MedicineReminder() {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'list'
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [extractedMeds, setExtractedMeds] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'morning',
    times: ['09:00'],
    start_date: '',
    duration_days: '',
    notes: '',
    email_notifications: true
  });
  const [editingId, setEditingId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);

  // Fetch medicines
  useEffect(() => {
    if (!user) return;
    fetchMedicines();
  }, [user]);

  // Notification permission check on load
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      // Auto-subscribe if already granted to ensure we catch updates
      if (Notification.permission === 'granted' && user) {
        subscribeUserToPush().catch(console.error);
      }
    }
  }, [user]);

  const fetchMedicines = async () => {
    const { data, error } = await supabase
      .from('user_medicines')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) console.error('Fetch error:', error);
    else setMedicines(data || []);
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
  });

  const handleUpload = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    setExtractedMeds(null);

    try {
      const base64 = await toBase64(file);
      const prompt = `Analyze this prescription image. Extract ONLY medications as JSON array:
[
  {
    "name": "medicine name",
    "dosage": "dosage e.g. 1 tablet",
    "frequency": "morning/afternoon/evening/bedtime",
    "times": ["09:00", "21:00"],
    "notes": "any notes/instructions"
  }
]
Return only valid JSON array, no extra text.`;

      const result = await analyzeRadiologyWithOpenAI(prompt, base64);
      const cleaned = result.replace(/```json|```/g, '').trim();
      const meds = JSON.parse(cleaned);
      setExtractedMeds(meds);
    } catch (err) {
      console.error('Extraction error:', err);
      setUploadError('Failed to extract medicines. Please add manually.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files[0]);
  };

  const addTimes = () => {
    setFormData({ ...formData, times: [...formData.times, '09:00'] });
  };

  const updateTime = (index, value) => {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({ ...formData, times: newTimes });
  };

  const convertTo24h = (hour12, minute, ampm) => {
    let hour24 = parseInt(hour12);
    if (ampm === 'PM' && hour24 !== 12) hour24 += 12;
    if (ampm === 'AM' && hour24 === 12) hour24 = 0;
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

  const convertTo12h = (time24) => {
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return { hour: String(h12).padStart(2, '0'), minute: minutes, ampm };
  };

  const removeTime = (index) => {
    const newTimes = formData.times.filter((_, i) => i !== index);
    setFormData({ ...formData, times: newTimes });
  };

  const saveMedicine = async (e) => {
    e.preventDefault();

    if (!user || !user.id) {
      console.warn('Trying to save without authenticated user or user ID is missing', user);
      alert('Please login before saving a medicine reminder.');
      return;
    }

    console.log('Medicine reminder save: user ID =', user.id, 'session present =', !!session);

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session) {
      console.error('No valid Supabase session available', sessionError);
      alert('Session is not valid. Please login again.');
      await signOut();
      navigate('/login');
      return;
    }

    if (!formData.name?.trim()) {
      alert('Please enter a medicine name.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      dosage: formData.dosage?.trim() || null,
      frequency: formData.frequency || 'morning',
      times: formData.times && formData.times.length > 0 ? formData.times : ['09:00'],
      start_date: formData.start_date || new Date().toISOString().split('T')[0],
      duration_days: formData.duration_days ? Number(formData.duration_days) : null,
      notes: formData.notes?.trim() || null,
      email_notifications: formData.email_notifications ?? true,
      is_active: true,
    };

    let result;

    try {
      if (editingId) {
        result = await supabase
          .from('user_medicines')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id)
          .select();
      } else {
        result = await supabase
          .from('user_medicines')
          .insert([{ ...payload, user_id: user.id }])
          .select();
      }
    } catch (err) {
      console.error('Save medicine request failed:', err);
      alert('Network error: could not save reminder. Try again.');
      return;
    }

    if (result.error) {
      console.error('Supabase save error details:', {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint
      });
      const message = result.error.message || 'Unknown error';
      const details = result.error.details ? ` Details: ${result.error.details}` : '';
      const hint = result.error.hint ? ` Hint: ${result.error.hint}` : '';
      alert(`Failed to save medication reminder: ${message}.${details}${hint}`);
      return;
    }

    fetchMedicines();
    setShowForm(false);
    setFormData({ name: '', dosage: '', frequency: 'morning', times: ['09:00'], start_date: '', duration_days: '', notes: '' });
    setEditingId(null);
    if (extractedMeds) setExtractedMeds(null);
  };

  const deleteMedicine = async (id) => {
    const { error } = await supabase.from('user_medicines').update({ is_active: false }).eq('id', id);
    if (!error) fetchMedicines();
  };

  const editMedicine = (med) => {
    setFormData({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      times: med.times || [],
      start_date: med.start_date,
      duration_days: med.duration_days,
      notes: med.notes,
      email_notifications: med.email_notifications ?? true
    });
    setEditingId(med.id);
    setShowForm(true);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        const sub = await subscribeUserToPush();
        if (sub) {
          alert("Push notifications enabled! You will receive reminders even when the app is closed.");
        } else {
          alert("Could not register push notifications. Please check your browser settings or ensure you're on HTTPS.");
        }
      }
    }
  };

  const format12h = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const nextDoseTime = (times) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const upcoming = times.map(t => new Date(today + 'T' + t)).filter(d => d > now);
    return upcoming.length > 0 ? upcoming[0].toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : times[0];
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-4">
          <Pill className="w-4 h-4" />
          Medicine Reminder
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Manage Your <span className="text-teal-600">Medicines</span>
        </h2>
        <p className="text-gray-600">Add from prescription scan or manually. Get timely notifications.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button onClick={() => setActiveTab('add')} className={`flex-1 py-2 px-4 rounded-lg font-medium ${activeTab === 'add' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-600'}`}>
          Add Medicine
        </button>
        <button onClick={() => setActiveTab('list')} className={`flex-1 py-2 px-4 rounded-lg font-medium ${activeTab === 'list' ? 'bg-white shadow-sm text-teal-700' : 'text-gray-600'}`}>
          My Reminders ({medicines.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'add' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            {/* Upload Prescription */}
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" /> Scan Prescription
              </h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
                }`}
              >
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleUpload(e.target.files[0])} />
                {isUploading ? (
                  <div className="space-y-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-teal-700 font-medium">Extracting medicines...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-teal-500 mx-auto" />
                    <p className="font-semibold text-gray-700">Drop prescription image</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" className="hidden" />
              {uploadError && (
                <p className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{uploadError}</p>
              )}
            </div>

            {/* Extracted Meds */}
            {extractedMeds && (
              <div className="p-6 rounded-2xl bg-teal-50 border border-teal-100">
                <h4 className="font-semibold text-teal-900 mb-4">Extracted Medicines ({extractedMeds.length})</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {extractedMeds.map((med, i) => (
                    <div key={i} className="p-4 bg-white rounded-xl border shadow-sm">
                      <p className="font-bold text-teal-900">{med.name}</p>
                      <p className="text-sm text-teal-700">{med.dosage}</p>
                      <button
                        onClick={() => {
                          setFormData({
                            name: med.name,
                            dosage: med.dosage,
                            frequency: med.frequency || 'morning',
                            times: med.times || ['09:00'],
                            notes: med.notes || ''
                          });
                          setShowForm(true);
                        }}
                        className="mt-2 px-3 py-1 bg-teal-500 text-white text-xs rounded-lg hover:bg-teal-600"
                      >
                        Use This
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Manual Button */}
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Medicine Manually
            </button>
          </motion.div>
        )}

        {activeTab === 'list' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            {/* Notifications */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <span>Reminders</span>
                </div>
                <button
                  onClick={requestNotificationPermission}
                  disabled={notificationPermission === 'granted'}
                  className="px-4 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {notificationPermission === 'granted' ? 'Enabled' : 'Enable Notifications'}
                </button>
              </div>
            </div>

            {/* Medicines List */}
            <div className="space-y-4">
              {medicines.map((med) => {
                let isCompleted = false;
                if (med.duration_days && med.start_date) {
                  const endDate = new Date(new Date(med.start_date).getTime() + med.duration_days * 24 * 60 * 60 * 1000);
                  isCompleted = new Date() > endDate;
                }
                return (
                <motion.div
                  key={med.id}
                  className={`p-6 rounded-2xl border transition-all ${isCompleted ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
                          <Pill className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xl text-gray-900">{med.name}</h4>
                          <p className="text-teal-700 font-medium">{med.dosage || 'As prescribed'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-3">
                        {isCompleted ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-bold text-xs">
                            Course Completed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-teal-50 text-teal-700 rounded-full">
                            <Clock className="w-3 h-3" /> Next: {nextDoseTime(med.times)}
                          </span>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {med.times?.map((t, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
                              {format12h(t)}
                            </span>
                          ))}
                        </div>
                        {med.frequency && (
                          <span className="px-2 py-1 bg-gray-50 rounded-full">{med.frequency}</span>
                        )}
                      </div>
                      {med.notes && (
                        <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded-lg">{med.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => editMedicine(med)}
                        className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMedicine(med.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )})}
              {medicines.length === 0 && (
                <div className="text-center py-12">
                  <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No medicines added</h3>
                  <p className="text-gray-600 mb-4">Add your first medicine to get started</p>
                  <button
                    onClick={() => { setActiveTab('add'); setShowForm(true); }}
                    className="px-6 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition"
                  >
                    Add Now
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Edit Medicine' : 'Add New Medicine'}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveMedicine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:outline-none"
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                <input
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400"
                  placeholder="e.g. 1 tablet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="bedtime">Bedtime</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  Times <button type="button" onClick={addTimes} className="p-1 hover:bg-gray-100 rounded">
                    <Plus className="w-4 h-4" />
                  </button>
                </label>
                <div className="space-y-3">
                  {formData.times.map((time, index) => {
                    const { hour, minute, ampm } = convertTo12h(time);
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={hour}
                            onChange={(e) => {
                              const h = e.target.value || '01';
                              const new24h = convertTo24h(h, minute, ampm);
                              updateTime(index, new24h);
                            }}
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:border-teal-400"
                            placeholder="HH"
                          />
                          <span className="text-gray-500">:</span>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={minute}
                            onChange={(e) => {
                              const m = String(e.target.value || '00').padStart(2, '0');
                              const new24h = convertTo24h(hour, m, ampm);
                              updateTime(index, new24h);
                            }}
                            className="w-12 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:border-teal-400"
                            placeholder="MM"
                          />
                          <select
                            value={ampm}
                            onChange={(e) => {
                              const new24h = convertTo24h(hour, minute, e.target.value);
                              updateTime(index, new24h);
                            }}
                            className="px-3 py-1 border border-gray-300 rounded bg-white focus:outline-none focus:border-teal-400 text-sm font-medium"
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                          <span className="ml-auto text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded font-medium">
                            {format12h(time)}
                          </span>
                        </div>
                        <button type="button" onClick={() => removeTime(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="email_notifications"
                  checked={formData.email_notifications}
                  onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <label htmlFor="email_notifications" className="text-sm font-medium text-gray-700">
                  Enable Email Notifications
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || '' })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400"
                  placeholder="e.g. 14"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 resize-vertical"
                  placeholder="Take with food, etc."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-teal-500 text-white py-3 rounded-xl hover:bg-teal-600 font-medium transition">
                  <Check className="w-4 h-4 inline mr-2" /> {editingId ? 'Update' : 'Add Medicine'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

