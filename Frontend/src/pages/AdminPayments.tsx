import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

const AdminPayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/admin-api/payments", { credentials: "include" });
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

  return (
    <AdminLayout title="Payments" description="Track payments and Razorpay orders.">
      <div className="bg-white rounded-3xl p-8 luxury-shadow">
        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : payments.length === 0 ? (
          <div className="text-gray-800/70">No payments found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-800/60 text-sm">
                  <th className="py-3 pr-4">Payment ID</th>
                  <th className="py-3 pr-4">Booking</th>
                  <th className="py-3 pr-4">Amount</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Provider</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-gold/10">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">{p.id}</td>
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
