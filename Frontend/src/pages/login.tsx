import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginUser = (userName: string) => {
    localStorage.setItem("user", JSON.stringify({ name: userName }));
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Password and confirm password do not match.');
        return;
      }

      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            phone: number.trim(),
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setError(data?.error?.message ?? 'Signup failed');
          return;
        }

        const userName = data?.data?.user?.name ?? name.trim() ?? 'Yagna';
        loginUser(userName);
      } catch {
        setError('Signup failed');
      }

      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? 'Login failed');
        return;
      }

      const userName = data?.data?.user?.name ?? 'Yagna';
      loginUser(userName);
    } catch {
      setError('Login failed');
    }
  };

  const handleGoogleSignIn = () => {
    setError(null);
    loginUser('Yagna');
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-6">
            Welcome Back
          </h1>
          <p className="text-xl text-ivory/80 max-w-2xl mx-auto">
            Login to continue your booking experience.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-playfair text-4xl font-bold text-gray-800 mb-6">
              Sign In
            </h2>
            <p className="text-gray-800/80 text-lg leading-relaxed">
              Access your account to manage bookings and preferences.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 luxury-shadow">
            <h3 className="font-playfair text-3xl font-bold text-gray-800 mb-6">
              {mode === 'login' ? 'Login' : 'Sign Up'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'signup' && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-gray-800 font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label htmlFor="number" className="block text-gray-800 font-medium mb-2">
                      Number
                    </label>
                    <input
                      type="tel"
                      id="number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </>
              )}

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
                  placeholder="your.email@example.com"
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

              {mode === 'signup' && (
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
              )}

              {error && (
                <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200"
              >
                {mode === 'login' ? 'Login' : 'Sign Up'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gold/20" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-800/60">or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full text-gray-800 py-3 rounded-full font-semibold bg-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
                aria-label="Continue with Google"
              >
                <span className="h-9 w-9 rounded-md bg-white flex items-center justify-center">
                  <svg
                    viewBox="0 0 48 48"
                    className="h-5 w-5"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303C33.652 32.658 29.215 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306 14.691 12.86 19.5C14.635 15.108 18.927 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691Z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.193 0-9.616-3.317-11.283-7.946l-6.51 5.015C9.504 39.556 16.227 44 24 44Z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303a11.97 11.97 0 0 1-4.087 5.57h.003l6.19 5.238C36.971 40.205 44 36 44 24c0-1.341-.138-2.65-.389-3.917Z"
                    />
                  </svg>
                </span>
              </button>
            </form>

            {mode === 'login' ? (
              <p className="mt-6 text-center text-gray-800/70">
                If not have account then{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('signup');
                  }}
                  className="text-gold font-semibold hover:text-bronze transition-colors"
                >
                  sign up
                </button>
              </p>
            ) : (
              <p className="mt-6 text-center text-gray-800/70">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="text-gold font-semibold hover:text-bronze transition-colors"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Login;
