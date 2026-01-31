import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

const AdminBookings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

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
    const paid = b.payments?.find((p: any) => p.status === "PAID") ?? null;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const left = 48;
    const right = pageW - 48;
    const contentW = right - left;
    let y = 48;

    const formatMoney = (v: any) => {
      const n = Number(v ?? 0);
      return Number.isFinite(n) ? new Intl.NumberFormat("en-IN").format(n) : String(v ?? "0");
    };

    const formatDate = (d: any) => {
      if (!d) return "—";
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return "—";
      return dt.toLocaleDateString("en-IN");
    };

    const drawDivider = (yy: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(left, yy, right, yy);
    };

    const drawSectionTitle = (title: string, yy: number) => {
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, left + 14, yy);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(left + 14, yy + 8, right - 14, yy + 8);
      return yy + 26;
    };

    const drawKV = (label: string, value: string, yy: number, opts?: { valueAlignRight?: boolean }) => {
      const labelX = left + 14;
      const valueX = opts?.valueAlignRight ? right - 14 : left + 190;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(label, labelX, yy);

      doc.setTextColor(15, 23, 42);
      const v = String(value ?? "—");
      const maxW = opts?.valueAlignRight ? right - valueX : right - valueX - 14;
      const lines = doc.splitTextToSize(v, maxW);
      if (opts?.valueAlignRight) {
        doc.text(lines, valueX, yy, { align: "right" });
      } else {
        doc.text(lines, valueX, yy);
      }
      return yy + Math.max(14, lines.length * 12);
    };

    // Header band
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageW, 120, "F");

    try {
      const logo = await getLogoDataUrl();
      doc.addImage(logo, "PNG", left, 28, 44, 44);
    } catch {
      // If logo fails, continue without it.
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("VintageValley Resort", left + 56, 52);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Booking Invoice / Ticket", left + 56, 72);

    // Right-side status pill
    const status = String(b.status ?? "—");
    const pillW = Math.min(170, doc.getTextWidth(status) + 44);
    const pillX = right - pillW;
    const pillY = 40;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pillX, pillY, pillW, 28, 14, 14, "F");
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(status, pillX + pillW / 2, pillY + 18, { align: "center" });

    // Meta row
    y = 150;
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Booking Details", left + 14, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Booking Details generated: ${new Date().toLocaleString()}`, right - 14, y, { align: "right" });

    y += 14;
    drawDivider(y);
    y += 18;

    y = drawSectionTitle("Summary", y);
    y = drawKV("Booking ID", String(b.id ?? "—"), y);
    y = drawKV("Room", String(b.room?.title ?? "—"), y);

    const checkIn = formatDate(b.checkIn);
    const checkOut = formatDate(b.checkOut);
    y = drawKV("Dates", `${checkIn} - ${checkOut}`, y);
    y = drawKV("Guests", String(b.guests ?? "—"), y);
    y += 10;

    drawDivider(y);
    y += 18;

    // Total (no box) - invoice style
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL AMOUNT", left + 14, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Rs. ${formatMoney(b.amount)}`, right - 14, y, { align: "right" });
    y += 14;
    drawDivider(y);
    y += 22;

    y = drawSectionTitle("Customer", y);
    y = drawKV("Name", String(b.user?.name ?? "—"), y);
    y = drawKV("Email", String(b.user?.email ?? "—"), y);
    y = drawKV("Phone", String(b.user?.phone ?? "—"), y);
    y += 14;
    drawDivider(y);
    y += 22;

    y = drawSectionTitle("Payment", y);
    y = drawKV("Payment Status", String(paid?.status ?? "—"), y);
    y = drawKV("Method", formatMethod(paid?.method), y);
    y = drawKV("Razorpay Order", String(paid?.razorpayOrderId ?? "—"), y);
    y = drawKV("Razorpay Payment", String(paid?.razorpayPaymentId ?? "—"), y);
    y += 14;
    drawDivider(y);
    y += 22;

    y = drawSectionTitle("Guests Breakdown", y);
    y = drawKV("Adults", String(b.adults ?? "—"), y);
    y = drawKV("Children", String(b.children ?? "—"), y);
    y = drawKV("Extra Adults", String(b.extraAdults ?? "—"), y);
    y += 14;
    drawDivider(y);
    y += 22;

    if (b.additionalInformation) {
      y = drawSectionTitle("Additional Information", y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const text = String(b.additionalInformation);
      const lines = doc.splitTextToSize(text, contentW - 28);
      doc.text(lines, left + 14, y + 6);
      y += lines.length * 12 + 12;
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text("This Booking Detail is system generated and valid without signature.", left, pageH - 56);
    doc.text("VintageValley Resort", right, pageH - 56, { align: "right" });

    doc.save(`invoice_${String(b.id ?? "booking")}.pdf`);
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
                    <td className="py-3 pr-4 text-gray-800/80">₹{b.amount}</td>
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
