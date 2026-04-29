import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import { FileSearch, Activity, Heart, Menu, X, MapPin, Clock, LogOut, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import Home from "./pages/home";
import Dashboard from "./pages/Dashboard";
import SymptomChecker from "./pages/SymptomChecker";
import LifestyleAdvisor from "./pages/LifestyleAdvisor";
import Appointments from "./pages/Appointments";
import MedicineReminder from "./pages/MedicineReminder";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleMenu = () => {
    console.log('Toggle menu clicked');
    setMenuOpen(prev => {
      console.log('New state:', !prev);
      return !prev;
    });
  };

  const navItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Health Dashboard' },
    { to: '/', icon: FileSearch, label: 'Medical Docs' },
    { to: '/symptoms', icon: Activity, label: 'Symptom Checker' },
    { to: '/lifestyle', icon: Heart, label: 'Lifestyle Advisor' },
    { to: '/appointments', icon: MapPin, label: 'Appointments' },
    { to: '/reminders', icon: Clock, label: 'Medicine Reminders' },
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-shrink-0">
                <button 
                  onClick={toggleMenu}
                  className="p-3 rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  style={{minWidth: '44px', minHeight: '44px'}}
                >
                  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 truncate">MedDoc AI</h1>
                  <p className="text-xs text-gray-500">Your Health Assistant</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {user ? (
                  <button 
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                ) : (
                  <NavLink 
                    to="/login" 
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all whitespace-nowrap"
                  >
                    Sign In
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hamburger Overlay Menu - Always available */}
        {menuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
              onClick={closeMenu}
            />
            <div className="fixed top-0 left-0 w-72 h-full bg-white/95 backdrop-blur-xl shadow-2xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">MedDoc AI</h2>
                      <p className="text-sm text-gray-500">Your Health Assistant</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeMenu}
                    className="p-2 hover:bg-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-4 space-y-1 overflow-y-auto h-full">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={closeMenu}
                    className={({ isActive }) => `
                      block w-full flex items-center gap-4 p-4 rounded-2xl font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-800 shadow-lg border border-teal-200' 
                        : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:border border-transparent'
                      }
                      focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2
                    `}
                  >
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
                {user ? (
                  <button
                    onClick={() => {
                      closeMenu();
                      signOut();
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl font-semibold text-red-600 hover:bg-red-50 hover:shadow-md hover:border border-red-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <LogOut className="w-6 h-6" />
                    <span>Logout</span>
                  </button>
                ) : (
                  <NavLink
                    to="/login"
                    onClick={closeMenu}
                    className="block w-full flex items-center gap-4 p-4 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:shadow-md hover:border border-transparent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    <LogOut className="w-6 h-6" />
                    <span>Sign In</span>
                  </NavLink>
                )}
              </div>
            </div>
          </>
        )}

        <main className="flex-1">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/symptoms" element={<ProtectedRoute><SymptomChecker /></ProtectedRoute>} />
            <Route path="/lifestyle" element={<ProtectedRoute><LifestyleAdvisor /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><MedicineReminder /></ProtectedRoute>} />
          </Routes>
        </main>

        <footer className="border-t border-gray-100 mt-16">
          <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
            <p>⚠️ This tool provides educational information only and should not replace professional medical advice.</p>
            <p className="mt-2">Always consult with a qualified healthcare provider for medical decisions.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

