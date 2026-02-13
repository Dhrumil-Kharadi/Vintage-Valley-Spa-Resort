import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const token = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return String(q.get("token") ?? "").trim();
  }, [location.search]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);

    if (!token) {
      setError("Missing token");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/admin-api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, newPassword }),
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
      setTimeout(() => navigate("/admin/login"), 800);
    } catch {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-3 sm:px-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-800/70 mt-3">Set a new password for admin login.</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            {!token && (
              <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">
                Invalid reset link (missing token).
              </div>
            )}

            {ok && (
              <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">
                Password updated. Redirecting to login…
              </div>
            )}

            {error && (
              <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{error}</div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-gray-800 font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-gray-800 font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update Password"}
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

export default AdminResetPassword;
