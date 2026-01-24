import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/admin-api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const raw = await res.text().catch(() => "");
      const data = raw ? (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })() : null;
      if (!res.ok) {
        const message =
          data?.error?.message ??
          (raw ? raw.slice(0, 200) : "") ??
          "Admin login failed";

        setError(`${res.status} ${res.statusText}: ${message}`);
        return;
      }

      navigate("/admin");
    } catch {
      setError("Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-6">Admin Login</h1>
          <p className="text-xl text-ivory/80 max-w-2xl mx-auto">Sign in to manage rooms and bookings.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 luxury-shadow">
            <h2 className="font-playfair text-3xl font-bold text-gray-800 mb-6">Sign In</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-gray-800 font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="admin@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-gray-800 font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AdminLogin;
