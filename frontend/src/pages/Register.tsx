import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

type FormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const Register = () => {
  const [formData, setFormData] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const username = formData.username.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (!username) return setError("Username is required.");
    if (!email) return setError("Email is required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== formData.confirmPassword) return setError("Passwords do not match.");

    setIsSubmitting(true);
    try {
      // Register (includes email)
      await register({ username, email, password });

      // Auto-login
      await login({ username, password });

      auth.syncFromStorage();
      navigate("/profile");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-transparent flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-8 text-white backdrop-blur-md shadow-[0_18px_30px_rgba(0,0,0,0.35)]">
        <h2 className="mb-6 text-center text-2xl font-bold text-white">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Username</label>
            <input
              type="text"
              name="username"
              required
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 outline-none transition focus:border-[#3B5BFF] focus:ring-2 focus:ring-[#3B5BFF]"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 outline-none transition focus:border-[#3B5BFF] focus:ring-2 focus:ring-[#3B5BFF]"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 outline-none transition focus:border-[#3B5BFF] focus:ring-2 focus:ring-[#3B5BFF]"
              placeholder="Create a password (min 8 chars)"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 outline-none transition focus:border-[#3B5BFF] focus:ring-2 focus:ring-[#3B5BFF]"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#3B5BFF] py-2.5 font-semibold text-white transition duration-200 hover:bg-[#2F4CF5] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[#3B5BFF] hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
