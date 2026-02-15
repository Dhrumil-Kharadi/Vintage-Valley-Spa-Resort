import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useMemo, useState } from "react";

const AdminPayments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const paidPayments = payments.filter((p) => p?.status === "PAID");

  const filteredPayments = useMemo(() => {
    const q = String(search ?? "").trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;
    const fromMs = from && Number.isFinite(from.getTime()) ? from.getTime() : null;
    const toMsRaw = to && Number.isFinite(to.getTime()) ? to.getTime() : null;
    const toMs = toMsRaw === null ? null : toMsRaw + (24 * 60 * 60 * 1000 - 1);

    return (paidPayments ?? []).filter((p) => {
      if (q) {
        const hay = `${p?.id ?? ""} ${p?.bookingId ?? ""} ${p?.status ?? ""} ${p?.provider ?? ""} ${p?.method ?? ""} ${p?.amount ?? ""} ${p?.booking?.user?.name ?? ""} ${p?.booking?.user?.email ?? ""} ${p?.booking?.user?.phone ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      const created = p?.createdAt ? new Date(p.createdAt) : null;
      const createdMs = created && Number.isFinite(created.getTime()) ? created.getTime() : null;
      if (fromMs !== null && createdMs !== null && createdMs < fromMs) return false;
      if (toMs !== null && createdMs !== null && createdMs > toMs) return false;
      if ((fromMs !== null || toMs !== null) && createdMs === null) return false;

      return true;
    });
  }, [paidPayments, search, fromDate, toDate]);

  const downloadCsv = () => {
    const activeFilters = Boolean(String(search ?? "").trim()) || Boolean(fromDate) || Boolean(toDate);
    const list = activeFilters ? filteredPayments : paidPayments;

    const escapeCsv = (v: any) => {
      const s = String(v ?? "");
      if (/[\n\r,\"]/g.test(s)) return `"${s.replace(/\"/g, '""')}"`;
      return s;
    };

    const rows = (list ?? []).map((p) => {
      const created = p?.createdAt ? new Date(p.createdAt).toISOString() : "";
      return [
        escapeCsv(p?.id),
        escapeCsv(p?.bookingId),
        escapeCsv(p?.booking?.user?.name ?? ""),
        escapeCsv(p?.booking?.user?.email ?? ""),
        escapeCsv(p?.booking?.user?.phone ?? ""),
        escapeCsv(formatMethod(p?.method)),
        escapeCsv(p?.provider ?? ""),
        escapeCsv(p?.status ?? ""),
        escapeCsv(p?.amount ?? ""),
        escapeCsv(created),
      ].join(",");
    });

    const csv = ["paymentId,bookingId,customer,email,phone,method,provider,status,amount,createdAt", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `payments_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Payments" description="Track payments and Razorpay orders.">
      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div>
              <label className="block text-xs text-gray-800/70 mb-1">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payment / booking / user / method"
                className="w-full md:w-72 px-4 py-2.5 rounded-2xl border border-gold/20 focus:outline-none focus:border-gold transition-colors bg-ivory/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-800/70 mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full md:w-44 px-4 py-2.5 rounded-2xl border border-gold/20 focus:outline-none focus:border-gold transition-colors bg-ivory/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-800/70 mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full md:w-44 px-4 py-2.5 rounded-2xl border border-gold/20 focus:outline-none focus:border-gold transition-colors bg-ivory/50"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
              className="px-4 py-2.5 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors md:mb-[1px]"
            >
              Clear
            </button>
          </div>

          <button
            type="button"
            onClick={downloadCsv}
            className="px-4 py-2.5 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors"
          >
            Download CSV
          </button>
        </div>

        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : filteredPayments.length === 0 ? (
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
                {filteredPayments.map((p) => (
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
