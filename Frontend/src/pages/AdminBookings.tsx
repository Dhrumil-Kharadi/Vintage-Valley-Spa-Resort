import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { downloadBookingInvoicePdf } from "@/lib/invoicePdf";

const AdminBookings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

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

  useEffect(() => {
    const run = async () => {
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
