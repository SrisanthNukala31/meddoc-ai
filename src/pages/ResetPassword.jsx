import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the user here with a token in the URL hash.
  // The onAuthStateChange listener picks it up and creates a session automatically.
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionReady(true);
      }
    });

    // Also check if there is already an active session (user clicked the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  }

  // Success screen
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h1>
          <p className="text-gray-600 text-sm">Your password has been reset successfully.</p>
          <p className="text-xs text-gray-400 mt-2">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  // Invalid/expired link screen
  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h1>
          <p className="text-sm text-gray-600 mb-5">
            This reset link has expired or already been used. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition text-sm"
          >
            Request New Link
          </Link>
          <div className="mt-3">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mb-5">
          <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
        <p className="text-sm text-gray-600 mt-2 mb-6">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="At least 8 characters"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              placeholder="Repeat your password"
            />
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                  password.length >= (i + 1) * 3
                    ? password.length >= 12 ? 'bg-green-500' : password.length >= 8 ? 'bg-yellow-400' : 'bg-red-400'
                    : 'bg-gray-200'
                }`} />
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
