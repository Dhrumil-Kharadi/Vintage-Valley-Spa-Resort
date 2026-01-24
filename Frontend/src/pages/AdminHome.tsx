import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useMemo, useState } from "react";

const AdminHome = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rRes, uRes, bRes, pRes] = await Promise.all([
          fetch("/admin-api/rooms", { credentials: "include" }),
          fetch("/admin-api/users", { credentials: "include" }),
          fetch("/admin-api/bookings", { credentials: "include" }),
          fetch("/admin-api/payments", { credentials: "include" }),
        ]);

        const [rData, uData, bData, pData] = await Promise.all([
          rRes.json().catch(() => null),
          uRes.json().catch(() => null),
          bRes.json().catch(() => null),
          pRes.json().catch(() => null),
        ]);

        if (!rRes.ok) throw new Error(rData?.error?.message ?? "Failed to load rooms");
        if (!uRes.ok) throw new Error(uData?.error?.message ?? "Failed to load users");
        if (!bRes.ok) throw new Error(bData?.error?.message ?? "Failed to load bookings");
        if (!pRes.ok) throw new Error(pData?.error?.message ?? "Failed to load payments");

        setRooms(rData?.data?.rooms ?? []);
        setUsers(uData?.data?.users ?? []);
        setBookings(bData?.data?.bookings ?? []);
        setPayments(pData?.data?.payments ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const recentRooms = useMemo(() => {
    return [...rooms]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [rooms]);

  return (
    <AdminLayout title="Admin Dashboard" description="Overview of rooms, bookings, and payments.">
      {error && (
        <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 luxury-shadow">
          <div className="text-gray-800/60 text-sm">Rooms</div>
          <div className="font-playfair text-3xl font-bold text-gray-800 mt-2">
            {loading ? "…" : rooms.length}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 luxury-shadow">
          <div className="text-gray-800/60 text-sm">Bookings</div>
          <div className="font-playfair text-3xl font-bold text-gray-800 mt-2">
            {loading ? "…" : bookings.length}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 luxury-shadow">
          <div className="text-gray-800/60 text-sm">Payments</div>
          <div className="font-playfair text-3xl font-bold text-gray-800 mt-2">
            {loading ? "…" : payments.length}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 luxury-shadow">
          <div className="text-gray-800/60 text-sm">Users</div>
          <div className="font-playfair text-3xl font-bold text-gray-800 mt-2">
            {loading ? "…" : users.length}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-3xl p-6 luxury-shadow">
        <div className="font-playfair text-2xl font-bold text-gray-800 mb-4">Recent Rooms</div>
        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : recentRooms.length === 0 ? (
          <div className="text-gray-800/70">No rooms found.</div>
        ) : (
          <div className="space-y-3">
            {recentRooms.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-gold/10 rounded-2xl px-4 py-3">
                <div>
                  <div className="font-semibold text-gray-800">{r.title}</div>
                  <div className="text-gray-800/60 text-sm">₹{r.pricePerNight} / night</div>
                </div>
                <div className="text-gray-800/60 text-sm">#{r.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminHome;
