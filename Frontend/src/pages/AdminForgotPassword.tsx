import { useState } from "react";
import { Link } from "react-router-dom";

const AdminForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    setLoading(true);

    try {
      const res = await fetch("/admin-api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const raw = await res.text().catch(() => "");
      const data = raw
        ? (() => {
            try {
              return JSON.parse(raw);
            } catch {
              return null;
            }
          })()
        : null;

      if (!res.ok) {
        const message = data?.error?.message ?? (raw ? raw.slice(0, 200) : "") ?? "Failed";
        setError(`${res.status} ${res.statusText}: ${message}`);
        return;
      }

      setOk(true);
    } catch {
      setError("Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-3 sm:px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-800">Forgot Password</h1>
            <p className="text-gray-800/70 mt-3">We will send the reset link to the configured admin email.</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {ok && (
              <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">
                If your admin account is configured, a reset link has been sent.
              </div>
            )}

            {error && (
              <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center text-sm text-gray-800/70">
              <Link to="/admin/login" className="hover:text-gold transition-colors duration-200">
                Back to Admin Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
