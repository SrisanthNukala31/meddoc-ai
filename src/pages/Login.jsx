import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, signIn, signUp, sendOtp, verifyOtp } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setLoading(true);
      try {
        const { error: signUpError } = await signUp({ email, password });
        if (signUpError) throw signUpError;
        setMessage("Account created! You can now sign in.");
        setMode("signin");
      } catch (err) {
        setError(err.message || "Failed to create account.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === "signin") {
      setLoading(true);
      try {
        const { error: signInError } = await signIn({ email, password });
        if (signInError) {
          const message = signInError.message || "Authentication failed.";
          throw new Error(
            message.toLowerCase().includes('invalid')
              ? 'Invalid email or password. Please sign up if you do not have an account.'
              : message
          );
        }
      } catch (err) {
        setError(err.message || "Authentication failed.");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MedDoc AI</h1>
            <p className="text-sm text-gray-500">Secure Account Access</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
            }}
            className={`py-2 rounded-lg text-sm font-medium transition ${
              mode === "signin"
                ? "bg-white text-gray-900 shadow"
                : "text-gray-600"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
            }}
            className={`py-2 rounded-lg text-sm font-medium transition ${
              mode === "signup" ? "bg-white text-gray-900 shadow" : "text-gray-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="you@example.com"
            />
          </div>

          {mode === "signin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="At least 8 characters"
              />
            </div>
          )}

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Repeat password"
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium transition"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600 flex items-center justify-between">
          <Link to="/forgot-password" className="text-teal-700 hover:text-teal-800">
            Forgot password?
          </Link>
          <span>
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-teal-700 hover:text-teal-800 font-medium"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
