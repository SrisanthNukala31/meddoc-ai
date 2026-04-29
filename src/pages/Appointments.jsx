import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Clock, User, Phone, CheckCircle, Search, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 14); }, [center]);
  return null;
}

const timeSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];

export default function Appointments() {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [step, setStep] = useState('map');
  const [booking, setBooking] = useState({ name: '', phone: '', date: '', time: '', reason: '' });
  const [confirmed, setConfirmed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationError, setLocationError] = useState(null);

  const getLocation = () => {
    setLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        await fetchHospitals(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLocationError('Location access denied. Please enable location or search manually.');
        setLoading(false);
      }
    );
  };

  const fetchHospitals = async (lat, lng) => {
    try {
      const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:5000,${lat},${lng});node["amenity"="clinic"](around:5000,${lat},${lng});node["healthcare"="doctor"](around:5000,${lat},${lng}););out body;`;
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      const results = data.elements.slice(0, 15).map((el, i) => ({
        id: el.id,
        name: el.tags?.name || `Medical Center ${i + 1}`,
        type: el.tags?.amenity || el.tags?.healthcare || 'clinic',
        lat: el.lat,
        lng: el.lon,
        address: el.tags?.['addr:street'] ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}`.trim() : 'Address not available',
        phone: el.tags?.phone || el.tags?.['contact:phone'] || 'Not available',
        distance: calcDistance(lat, lng, el.lat, el.lon).toFixed(1),
      }));
      results.sort((a, b) => a.distance - b.distance);
      setHospitals(results);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        await fetchHospitals(parseFloat(lat), parseFloat(lon));
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
    setLoading(false);
  };

  const calcDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleBook = (hospital) => {
    setSelectedHospital(hospital);
    setStep('book');
  };

  const handleConfirm = async () => {
    if (!booking.name || !booking.phone || !booking.date || !booking.time) return;
    
    if (user) {
      try {
        const { error } = await supabase.from('appointments').insert({
          user_id: user.id,
          title: `Appointment at ${selectedHospital?.name || 'Medical Center'}`,
          doctor_name: booking.name,
          clinic_name: selectedHospital?.name || 'Medical Center',
          appointment_date: booking.date,
          appointment_time: booking.time,
          reason: booking.reason,
          status: 'scheduled'
        });
        
        if (error) {
          console.error('Supabase error inserting appointment:', error);
          alert(`Failed to save appointment to database: ${error.message}`);
          return; // Stop the flow so they don't see the confirmed screen if it failed
        }
      } catch (err) {
        console.error('Failed to save appointment:', err);
        alert('An unexpected error occurred while saving.');
        return;
      }
    } else {
      alert('Please log in to save appointments.');
      return;
    }

    setConfirmed(true);
    setStep('confirmed');
  };

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="text-center max-w-2xl mx-auto py-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 text-sm font-medium mb-4">
          <MapPin className="w-4 h-4" /> Find & Book Appointments
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Nearby <span className="text-teal-600">Hospitals & Clinics</span>
        </h2>
        <p className="text-gray-600">Find hospitals near you and book appointments instantly</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 'map' && (
          <motion.div key="map" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 flex gap-2 min-w-60">
                  <input type="text" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                    placeholder="Search by city or area..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
                  <button onClick={searchLocation}
                    className="px-4 py-2 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-colors flex items-center gap-1 text-sm">
                    <Search className="w-4 h-4" /> Search
                  </button>
                </div>
                <button onClick={getLocation}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center gap-2 text-sm font-medium">
                  <Navigation className="w-4 h-4" />
                  {loading ? 'Finding...' : 'Use My Location'}
                </button>
              </div>
              {locationError && <p className="text-red-600 text-sm mt-2">{locationError}</p>}
            </div>

            {location && (
              <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: '400px' }}>
                <MapContainer center={[location.lat, location.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                  <MapUpdater center={[location.lat, location.lng]} />
                  <Marker position={[location.lat, location.lng]} icon={userIcon}>
                    <Popup>📍 Your Location</Popup>
                  </Marker>
                  {hospitals.map((h) => (
                    <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
                      <Popup>
                        <div className="text-sm">
                          <p className="font-semibold">{h.name}</p>
                          <p className="text-gray-600">{h.distance} km away</p>
                          <button onClick={() => handleBook(h)}
                            className="mt-2 px-3 py-1 bg-teal-500 text-white rounded-lg text-xs hover:bg-teal-600">
                            Book Appointment
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {hospitals.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">{hospitals.length} Facilities Found Nearby</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {hospitals.map((h) => (
                    <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{h.name}</p>
                          <p className="text-xs text-teal-600 capitalize mt-0.5">{h.type}</p>
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {h.address}
                          </p>
                          {h.phone !== 'Not available' && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {h.phone}
                            </p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-teal-600 ml-3">{h.distance} km</span>
                      </div>
                      <button onClick={() => handleBook(h)}
                        className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-medium hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4" /> Book Appointment
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {!location && !loading && (
              <div className="text-center py-16 text-gray-400">
                <MapPin className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Click "Use My Location" or search your area</p>
                <p className="text-sm mt-1">to find nearby hospitals and clinics</p>
              </div>
            )}
          </motion.div>
        )}

        {step === 'book' && selectedHospital && (
          <motion.div key="book" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-4">
            <button onClick={() => setStep('map')}
              className="text-sm text-teal-600 hover:text-teal-800 flex items-center gap-1">
              ← Back to map
            </button>
            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 mb-6">
                <p className="font-semibold text-teal-900">{selectedHospital.name}</p>
                <p className="text-sm text-teal-700 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {selectedHospital.address} • {selectedHospital.distance} km away
                </p>
              </div>
              <h3 className="font-semibold text-gray-900 mb-4">Your Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={booking.name}
                      onChange={(e) => { const v = e.target.value; setBooking(prev => ({ ...prev, name: v })); }}
                      placeholder="Your name"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input type="tel" value={booking.phone}
                      onChange={(e) => { const v = e.target.value; setBooking(prev => ({ ...prev, phone: v })); }}
                      placeholder="Your phone number"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                  <input type="text" value={booking.reason}
                    onChange={(e) => { const v = e.target.value; setBooking(prev => ({ ...prev, reason: v })); }}
                    placeholder="e.g. General checkup, fever, follow-up..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date *</label>
                  <input type="date" value={booking.date} min={getTodayDate()}
                    onChange={(e) => { const v = e.target.value; setBooking(prev => ({ ...prev, date: v })); }}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-teal-400 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Time *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <button type="button" key={time} onClick={() => setBooking(prev => ({ ...prev, time }))}
                        className={`py-2 rounded-xl text-sm font-medium transition-all border ${
                          booking.time === time
                            ? 'bg-teal-500 text-white border-teal-500'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-teal-300'
                        }`}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleConfirm}
                  disabled={!booking.name || !booking.phone || !booking.date || !booking.time}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" /> Confirm Appointment
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'confirmed' && (
          <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center space-y-6">
            <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked!</h3>
              <p className="text-gray-600 mb-6">Your appointment has been confirmed</p>
              <div className="p-4 rounded-xl bg-gray-50 text-left space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-teal-500" />
                  <div>
                    <p className="text-xs text-gray-500">Patient</p>
                    <p className="font-medium text-gray-900">{booking.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-teal-500" />
                  <div>
                    <p className="text-xs text-gray-500">Hospital</p>
                    <p className="font-medium text-gray-900">{selectedHospital?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium text-gray-900">{booking.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-teal-500" />
                  <div>
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-medium text-gray-900">{booking.time}</p>
                  </div>
                </div>
                {booking.reason && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-teal-500" />
                    <div>
                      <p className="text-xs text-gray-500">Reason</p>
                      <p className="font-medium text-gray-900">{booking.reason}</p>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => { setStep('map'); setBooking({ name: '', phone: '', date: '', time: '', reason: '' }); setConfirmed(false); }}
                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-600 hover:to-cyan-600 transition-all">
                Book Another Appointment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}