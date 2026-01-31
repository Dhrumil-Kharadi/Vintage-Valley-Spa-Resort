import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useEffect, useMemo, useState } from 'react';

type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  adults: number;
  children: number;
  extraAdults: number;
  nights: number;
  amount: number;
  status: string;
  createdAt: string;
  room?: { id: number; title: string };
};

const Profile = () => {
  const userName = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return typeof user?.name === 'string' ? user.name : null;
    } catch {
      return null;
    }
  }, []);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingBookingId, setRetryingBookingId] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // User info state
  const [user, setUser] = useState<{ id: string; name: string; email: string; phone?: string | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/bookings/me', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load bookings');
        setBookings(data?.data?.bookings ?? []);
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // Load current user info
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!res.ok) return;
        const u = data?.data?.user;
        if (u) {
          setUser(u);
          setEditName(u.name ?? '');
          setEditPhone(u.phone ?? '');
        }
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  // Load Razorpay script once
  useEffect(() => {
    if ((window as any).Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING');
  const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');

  let cachedCheckoutLogoDataUrl: string | null = null;
  const getCheckoutLogoDataUrl = async () => {
    if (cachedCheckoutLogoDataUrl) return cachedCheckoutLogoDataUrl;

    const res = await fetch('/favicon.png', { cache: 'force-cache' });
    if (!res.ok) throw new Error('Failed to load logo');
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read logo'));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });

    cachedCheckoutLogoDataUrl = dataUrl;
    return dataUrl;
  };

  const handleRetryPayment = async (booking: Booking) => {
    setRetryingBookingId(booking.id);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: booking.room?.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: booking.guests,
          adults: booking.adults,
          children: booking.children,
          extraAdults: booking.extraAdults,
          additionalInformation: '',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to retry payment');

      const { razorpay } = data?.data ?? {};
      if (!razorpay?.orderId || !razorpay?.keyId) throw new Error('Invalid payment response');

      const RazorpayCtor = (window as Window & { Razorpay?: unknown }).Razorpay;
      if (typeof RazorpayCtor !== 'function' || !razorpayLoaded) {
        alert('Payment gateway is loading. Please wait a moment and try again.');
        return;
      }

      let checkoutLogo: string | undefined = undefined;
      try {
        checkoutLogo = await getCheckoutLogoDataUrl();
      } catch {
        checkoutLogo = undefined;
      }

      const rzp = new (RazorpayCtor as any)({
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency,
        order_id: razorpay.orderId,
        name: 'VintageValley Resort',
        description: `Booking ID: ${booking.id}`,
        image: checkoutLogo,
        theme: { color: '#3399cc' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`/api/bookings/${booking.id}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json().catch(() => null);
            if (!verifyRes.ok) throw new Error(verifyData?.error?.message ?? 'Payment verification failed');
            // Reload bookings to move it to confirmed section
            const reloadRes = await fetch('/api/bookings/me', { credentials: 'include' });
            const reloadData = await reloadRes.json().catch(() => null);
            if (reloadRes.ok) setBookings(reloadData?.data?.bookings ?? []);
          } catch (e: any) {
            alert(e?.message ?? 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            // Optional: handle dismissal
          },
        },
        prefill: {
          name: userName ?? undefined,
        },
      });
      rzp.open();
    } catch (e: any) {
      alert(e?.message ?? 'Failed to retry payment');
    } finally {
      setRetryingBookingId(null);
    }
  };

  const handleDeletePendingBooking = async (booking: Booking) => {
    const ok = window.confirm('Delete this pending booking?');
    if (!ok) return;

    setDeletingBookingId(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to delete booking');

      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (e: any) {
      alert(e?.message ?? 'Failed to delete booking');
    } finally {
      setDeletingBookingId(null);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileError(null);
    try {
      if (editPassword.trim() && editPassword.trim() !== editPasswordConfirm.trim()) {
        throw new Error('Passwords do not match');
      }

      const payload: any = {};
      if (editName.trim() !== user?.name) payload.name = editName.trim();
      if (editPhone.trim() !== user?.phone) payload.phone = editPhone.trim() || null;
      if (editPassword.trim()) payload.password = editPassword.trim();
      if (Object.keys(payload).length === 0) {
        setEditing(false);
        setSaving(false);
        return;
      }

      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update profile');

      const updated = data?.data?.user;
      if (updated) {
        setUser(updated);
        localStorage.setItem('user', JSON.stringify({ name: updated.name, email: updated.email }));
      }
      setEditPassword('');
      setEditPasswordConfirm('');
      setEditing(false);
    } catch (e: any) {
      setProfileError(e?.message ?? 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditName(user.name ?? '');
      setEditPhone(user.phone ?? '');
    }
    setEditPassword('');
    setEditPasswordConfirm('');
    setEditing(false);
    setProfileError(null);
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory">Profile</h1>
          <p className="text-xl text-ivory/80 max-w-2xl mt-4">Manage your account and bookings.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white rounded-3xl p-8 luxury-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="font-playfair text-2xl font-bold text-gray-800">User Information</div>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm"
                >
                  Edit
                </button>
              )}
            </div>

            {profileError && (
              <div className="bg-red-100 text-red-800 px-4 py-3 rounded-2xl mb-4">{profileError}</div>
            )}

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-800/60 text-sm mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gold/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-gray-800/60 text-sm mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gold/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-gray-800/60 text-sm mb-1">New Password (optional)</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full px-4 py-2 border border-gold/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>
                <div>
                  <label className="block text-gray-800/60 text-sm mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={editPasswordConfirm}
                    onChange={(e) => setEditPasswordConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-2 border border-gold/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-6 py-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gold/10">
                  <span className="text-gray-800/60">Name</span>
                  <span className="text-gray-800 font-medium">{user?.name ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gold/10">
                  <span className="text-gray-800/60">Email</span>
                  <span className="text-gray-800 font-medium">{user?.email ?? '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-800/60">Phone</span>
                  <span className="text-gray-800 font-medium">{user?.phone || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{error}</div>
          )}

          {loading ? (
            <div className="text-gray-800/70">Loading bookings…</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 luxury-shadow">
              <div className="font-playfair text-2xl font-bold text-gray-800">No bookings yet</div>
              <div className="text-gray-800/70 mt-2">Your booking tickets will appear here after you book a room.</div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-3xl p-8 luxury-shadow">
                <div className="font-playfair text-3xl font-bold text-gray-800">Pending Requests</div>
                <div className="text-gray-800/70 mt-1">Awaiting payment confirmation</div>

                {pendingBookings.length === 0 ? (
                  <div className="mt-6 text-gray-800/60">No pending bookings.</div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {pendingBookings.map((b) => (
                      <div key={b.id} className="border border-gold/15 rounded-3xl p-6 bg-ivory/30">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="text-gray-800 font-bold text-lg">{b.room?.title ?? 'Room'}</div>
                            <div className="text-gray-800/70 text-sm mt-1">Booking ID: {b.id}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">PENDING</div>
                            <button
                              type="button"
                              onClick={() => handleRetryPayment(b)}
                              disabled={retryingBookingId === b.id}
                              className="px-4 py-2 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm disabled:opacity-50"
                            >
                              {retryingBookingId === b.id ? 'Retrying…' : 'Retry Payment'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePendingBooking(b)}
                              disabled={deletingBookingId === b.id || retryingBookingId === b.id}
                              className="px-4 py-2 rounded-full border border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors text-sm disabled:opacity-50"
                            >
                              {deletingBookingId === b.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white/70 rounded-2xl p-4">
                            <div className="text-gray-800/60 text-xs">Dates</div>
                            <div className="text-gray-800 font-semibold">
                              {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="bg-white/70 rounded-2xl p-4">
                            <div className="text-gray-800/60 text-xs">Guests</div>
                            <div className="text-gray-800 font-semibold">{b.guests} total</div>
                          </div>
                          <div className="bg-white/70 rounded-2xl p-4">
                            <div className="text-gray-800/60 text-xs">Total</div>
                            <div className="text-gray-800 font-semibold">₹{Number(b.amount ?? 0).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl p-8 luxury-shadow">
                <div className="font-playfair text-3xl font-bold text-gray-800">Confirmed Requests</div>
                <div className="text-gray-800/70 mt-1">Payment completed and booking confirmed</div>

                {confirmedBookings.length === 0 ? (
                  <div className="mt-6 text-gray-800/60">No confirmed bookings.</div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {confirmedBookings.map((b) => (
                      <div key={b.id} className="border border-gold/15 rounded-3xl p-6 bg-ivory/30">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div>
                            <div className="text-gray-800 font-bold text-lg">{b.room?.title ?? 'Room'}</div>
                            <div className="text-gray-800/70 text-sm mt-1">Booking ID: {b.id}</div>
                          </div>
                          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">CONFIRMED</div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white/70 rounded-2xl p-4">
                            <div className="text-gray-800/60 text-xs">Dates</div>
                            <div className="text-gray-800 font-semibold">
                              {new Date(b.checkIn).toLocaleDateString()} - {new Date(b.checkOut).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="bg-white/70 rounded-2xl p-4">
                            <div className="text-gray-800/60 text-xs">Guests</div>
                            <div className="text-gray-800 font-semibold">{b.guests} total</div>
                          </div>
                          <div className="bg-white/70 rounded-2xl p-4">
                            <div className="text-gray-800/60 text-xs">Total</div>
                            <div className="text-gray-800 font-semibold">₹{Number(b.amount ?? 0).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;
