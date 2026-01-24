import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

const AdminBookings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/admin-api/bookings", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load bookings");
        setBookings(data?.data?.bookings ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <AdminLayout title="Bookings" description="View and manage bookings.">
      <div className="bg-white rounded-3xl p-8 luxury-shadow">
        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="text-gray-800/70">No bookings found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-800/60 text-sm">
                  <th className="py-3 pr-4">Booking ID</th>
                  <th className="py-3 pr-4">User</th>
                  <th className="py-3 pr-4">Room</th>
                  <th className="py-3 pr-4">Dates</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-gold/10">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">{b.id}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{b.user?.name ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{b.room?.title ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/70 text-sm">
                      {b.checkIn ? new Date(b.checkIn).toLocaleDateString() : "—"} - {b.checkOut ? new Date(b.checkOut).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-800/80">₹{b.amount}</td>
                    <td className="py-3 text-gray-800/80">{b.status}</td>
                  </tr>
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
