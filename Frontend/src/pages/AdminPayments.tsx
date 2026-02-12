import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

const AdminPayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const formatMethod = (m: any) => {
    const s = String(m ?? "").trim();
    if (!s) return "—";
    return s.toUpperCase();
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/payments", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load payments");
        setPayments(data?.data?.payments ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load payments");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const paidPayments = payments.filter((p) => p?.status === "PAID");

  return (
    <AdminLayout title="Payments" description="Track payments and Razorpay orders.">
      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : paidPayments.length === 0 ? (
          <div className="text-gray-800/70">No PAID payments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="text-gray-800/60 text-sm">
                  <th className="py-3 pr-4">Payment ID</th>
                  <th className="py-3 pr-4">Customer</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Method</th>
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Provider</th>
                </tr>
              </thead>
              <tbody>
                {paidPayments.map((p) => (
                  <tr key={p.id} className="border-t border-gold/10">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">{p.id}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{p.booking?.user?.name ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{p.booking?.user?.email ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{p.booking?.user?.phone ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{formatMethod(p.method)}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">{p.bookingId}</td>
                    <td className="py-3 pr-4 text-gray-800/80">₹{p.amount}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{p.status}</td>
                    <td className="py-3 text-gray-800/80">{p.provider}</td>
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

export default AdminPayments;
