import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = ["email", "otp", "password", "done"];

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // ── Step 1: Send OTP ──────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const token = otp.join("");
    if (token.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });
      if (error) throw error;
      setStep("password");
    } catch (err) {
      setError("Invalid or expired code. Please try again or resend.");
      setOtp(["","","","","",""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Update Password ───────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStep("done");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const updated = [...otp];
    for (let i = 0; i < pasted.length; i++) updated[i] = pasted[i];
    setOtp(updated);
    const nextFocus = Math.min(pasted.length, 5);
    otpRefs.current[nextFocus]?.focus();
  };

  // Password strength
  const pwStrength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : password.length >= 4 ? 1 : 0;
  const pwColors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const pwLabels = ["", "Weak", "Fair", "Good", "Strong"];

  // ── Step indicator ────────────────────────────────────────
  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Progress dots */}
        {step !== "done" && (
          <div className="flex justify-center gap-2 mb-6">
            {["email", "otp", "password"].map((s, i) => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${
                STEPS.indexOf(step) > i ? "w-8 bg-teal-500" :
                step === s ? "w-8 bg-teal-400" : "w-2 bg-gray-200"
              }`} />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Email ── */}
          {step === "email" && (
            <motion.div key="email"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
              <p className="text-sm text-gray-500 mt-1 mb-6">Enter your email and we'll send a 6-digit verification code.</p>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    placeholder="you@example.com" autoFocus />
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
                <button type="submit" disabled={loading || !email}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold transition flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</> : "Send Verification Code"}
                </button>
              </form>
              <p className="mt-5 text-sm text-gray-500 text-center">
                Remembered it? <Link to="/login" className="text-teal-600 font-semibold hover:text-teal-800">Sign In</Link>
              </p>
            </motion.div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === "otp" && (
            <motion.div key="otp"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-sm text-gray-500 mt-1 mb-1">We sent a 6-digit code to</p>
              <p className="font-semibold text-teal-700 mb-6">{email}</p>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* OTP boxes */}
                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 focus:outline-none transition-all ${
                        digit ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 focus:border-teal-400"
                      }`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">{error}</div>}

                <button type="submit" disabled={loading || otp.join("").length < 6}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold transition flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</> : "Verify Code"}
                </button>
              </form>

              {/* Resend */}
              <div className="mt-5 text-center text-sm text-gray-500">
                Didn't receive it?{" "}
                {resendTimer > 0 ? (
                  <span className="text-gray-400">Resend in {resendTimer}s</span>
                ) : (
                  <button onClick={async () => {
                    setError(""); setOtp(["","","","","",""]); setResendTimer(60);
                    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
                  }} className="text-teal-600 font-semibold hover:text-teal-800">
                    Resend Code
                  </button>
                )}
              </div>
              <div className="mt-2 text-center">
                <button onClick={() => { setStep("email"); setError(""); setOtp(["","","","","",""]); }}
                  className="text-xs text-gray-400 hover:text-gray-600">
                  ← Change email
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: New Password ── */}
          {step === "password" && (
            <motion.div key="password"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8"
            >
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
              <p className="text-sm text-gray-500 mt-1 mb-6">Identity verified! Choose a strong password.</p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input type="password" required minLength={8} value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                    placeholder="At least 8 characters" autoFocus />
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${pwStrength >= i ? pwColors[pwStrength] : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${pwStrength <= 1 ? "text-red-500" : pwStrength <= 2 ? "text-orange-500" : pwStrength <= 3 ? "text-yellow-600" : "text-green-600"}`}>
                        {pwLabels[pwStrength]}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input type="password" required minLength={8} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition ${
                      confirmPassword && confirmPassword !== password ? "border-red-300 focus:border-red-400" :
                      confirmPassword && confirmPassword === password ? "border-green-400 focus:border-green-500" :
                      "border-gray-200 focus:border-teal-500"
                    }`}
                    placeholder="Repeat your password" />
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Passwords match
                    </p>
                  )}
                </div>

                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

                <button type="submit" disabled={loading || !password || password !== confirmPassword}
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold transition flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</> : "Update Password"}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5"
              >
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Updated!</h1>
              <p className="text-gray-500 text-sm">Your password has been reset successfully.</p>
              <p className="text-gray-400 text-xs mt-2">Redirecting you to sign in...</p>
              <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div className="h-full bg-teal-500 rounded-full" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
