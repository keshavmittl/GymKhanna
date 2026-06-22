import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, signup, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      if (isSignup) {
        await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
      } else {
        await login({ email: formData.email, password: formData.password });
      }
      navigate("/");
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-[#141414] rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-1">
          {isSignup ? (
            "Create your account"
          ) : (
            <>
              <span className="block">🏋️ GymKhanna</span>
              <span className="block text-gray-400 text-base mt-1">
                Track Progress. Build Consistency.
              </span>
            </>
          )}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          {isSignup ? "Start tracking your lifts" : "Log in to GymKhanna"}
        </p>

        {error && (
          <div className="bg-red-500/10 text-red-500 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-[#1c1c1c] text-white rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500"
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-[#1c1c1c] text-white rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full bg-[#1c1c1c] text-white rounded-md px-4 py-2.5 pr-12 outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {isSignup && (
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full bg-[#1c1c1c] text-white rounded-md px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500"
            />
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-md py-2.5 transition flex items-center justify-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {submitting ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <p className="text-gray-500 text-sm text-center mt-6">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
            className="text-red-500 hover:underline"
          >
            {isSignup ? "Log in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
