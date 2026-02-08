import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { downloadBookingInvoicePdf } from "@/lib/invoicePdf";
import { toast } from "react-toastify";

const AdminBookings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [extraAdults, setExtraAdults] = useState(0);
  const [additionalInformation, setAdditionalInformation] = useState("");

  const formatInr = (value: any) => {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return String(value ?? "0");
    const hasFraction = Math.abs(n % 1) > 0.000001;
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: hasFraction ? 2 : 0,
        maximumFractionDigits: hasFraction ? 2 : 0,
      }).format(n);
    } catch {
      return String(n);
    }
  };

  const formatMethod = (m: any) => {
    const s = String(m ?? "").trim();
    if (!s) return "—";
    return s.toUpperCase();
  };

  let cachedLogoDataUrl: string | null = null;
  const getLogoDataUrl = async () => {
    if (cachedLogoDataUrl) return cachedLogoDataUrl;

    const res = await fetch("/favicon.png", { cache: "force-cache" });
    if (!res.ok) throw new Error("Failed to load logo");
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read logo"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });

    cachedLogoDataUrl = dataUrl;
    return dataUrl;
  };

  const confirmedBookings = bookings.filter((b) => b?.status === "CONFIRMED");

  const downloadInvoice = async (b: any) => {
    await downloadBookingInvoicePdf(b);
  };

  const loadBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/bookings", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load bookings");
        setBookings(data?.data?.bookings ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load bookings");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const submitManualBooking = async () => {
    setCreateError(null);
    setCreateOk(null);

    const u = userId.trim();
    const r = roomId.trim();
    if (!u) {
      setCreateError("User ID is required");
      toast.error("User ID is required");
      return;
    }
    if (!r || !Number.isFinite(Number(r))) {
      setCreateError("Valid Room ID is required");
      toast.error("Valid Room ID is required");
      return;
    }
    if (!checkIn) {
      setCreateError("Check-in date is required");
      toast.error("Check-in date is required");
      return;
    }
    if (!checkOut) {
      setCreateError("Check-out date is required");
      toast.error("Check-out date is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: u,
          roomId: Number(r),
          checkIn,
          checkOut,
          checkInTime: checkInTime.trim() ? checkInTime.trim() : null,
          checkOutTime: checkOutTime.trim() ? checkOutTime.trim() : null,
          rooms,
          guests,
          adults,
          children,
          extraAdults,
          additionalInformation: additionalInformation.trim() ? additionalInformation.trim() : null,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to create booking");

      setCreateOk("Booking created (CONFIRMED) without payment.");
      toast.success("Booking created (CONFIRMED) without payment.");
      await loadBookings();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create booking");
      toast.error(e?.message ?? "Failed to create booking");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Bookings" description="View and manage bookings.">
      <div className="bg-white rounded-3xl p-8 luxury-shadow">
        <div className="mb-8">
          <div className="text-gray-900 font-semibold mb-3">Manual booking (no payment)</div>

          {createError && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{createError}</div>
          )}
          {createOk && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{createOk}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Room ID"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              value={String(rooms)}
              onChange={(e) => setRooms(Math.max(1, Math.min(10, Number(e.target.value || 1))))}
              placeholder="Rooms"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />

            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <div className="hidden md:block" />

            <input
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              placeholder="Check-in time (HH:MM)"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              placeholder="Check-out time (HH:MM)"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <div className="hidden md:block" />

            <input
              value={String(guests)}
              onChange={(e) => setGuests(Math.max(1, Number(e.target.value || 1)))}
              placeholder="Guests"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              value={String(adults)}
              onChange={(e) => setAdults(Math.max(1, Number(e.target.value || 1)))}
              placeholder="Adults"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              value={String(children)}
              onChange={(e) => setChildren(Math.max(0, Number(e.target.value || 0)))}
              placeholder="Children"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />

            <input
              value={String(extraAdults)}
              onChange={(e) => setExtraAdults(Math.max(0, Number(e.target.value || 0)))}
              placeholder="Extra adults"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <input
              value={additionalInformation}
              onChange={(e) => setAdditionalInformation(e.target.value)}
              placeholder="Additional information (optional)"
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30 md:col-span-2"
            />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={submitManualBooking}
              disabled={creating}
              className="px-5 py-2.5 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create CONFIRMED booking"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : confirmedBookings.length === 0 ? (
          <div className="text-gray-800/70">No CONFIRMED bookings found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-800/60 text-sm">
                  <th className="py-3 pr-4">Booking ID</th>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Room</th>
                  <th className="py-3 pr-4">Dates</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Payment</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {confirmedBookings.map((b) => (
                  (() => {
                    const paid = b.payments?.find((p: any) => p.status === 'PAID');
                    return (
                  <tr key={b.id} className="border-t border-gold/10">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">{b.id}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{b.user?.name ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{b.user?.email ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{b.user?.phone ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{b.room?.title ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/70 text-sm">
                      {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"} - {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-800/80">{formatInr(b.amount)}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{formatMethod(paid?.method)}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{b.status}</td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(b)}
                        className="px-4 py-2 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                    );
                  })()
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBookings;
