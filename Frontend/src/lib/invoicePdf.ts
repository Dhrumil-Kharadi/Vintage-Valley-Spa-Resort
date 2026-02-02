import { jsPDF } from "jspdf";

export const downloadBookingInvoicePdf = async (b: any, opts?: { fileName?: string }) => {
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

  const paid = b.payments?.find((p: any) => p.status === "PAID") ?? null;

  const totalAmount = Number(b.amount ?? 0);
  const baseAmount = Number.isFinite(Number(b.baseAmount)) ? Number(b.baseAmount) : null;
  const gstAmount = Number.isFinite(Number(b.gstAmount)) ? Number(b.gstAmount) : null;

  // Display-friendly computation (supports decimals if total is decimal)
  const computedBase = baseAmount ?? (Number.isFinite(totalAmount) ? totalAmount / 1.05 : 0);
  const computedGst = gstAmount ?? Math.max(0, (Number.isFinite(totalAmount) ? totalAmount : 0) - computedBase);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const left = 48;
  const right = pageW - 48;
  const contentW = right - left;
  let y = 48;

  const formatMoney = (v: any) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n)) return String(v ?? "0");

    const hasFraction = Math.abs(n % 1) > 0.000001;
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: hasFraction ? 2 : 0,
    }).format(n);
  };

  const formatDate = (d: any) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN");
  };

  const invoiceNo = `INV-${String(b.id ?? "").slice(0, 8).toUpperCase()}`;
  const invoiceDate = new Date();

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

  const drawMoneyRight = (yy: number, amount: any, opts?: { strong?: boolean; muted?: boolean }) => {
    const currency = "Rs.";
    const value = formatMoney(amount);

    const muted = !!opts?.muted;
    const strong = !!opts?.strong;

    const valueSize = strong ? 14 : 11;
    const currencySize = strong ? 10 : 9;

    const valueColor: [number, number, number] = muted ? [71, 85, 105] : [15, 23, 42];
    const currencyColor: [number, number, number] = muted ? [100, 116, 139] : [71, 85, 105];

    doc.setFont("helvetica", strong ? "bold" : "normal");
    doc.setFontSize(valueSize);
    doc.setTextColor(...valueColor);
    doc.text(value, right - 14, yy, { align: "right" });

    const valueW = doc.getTextWidth(value);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(currencySize);
    doc.setTextColor(...currencyColor);
    doc.text(currency, right - 14 - valueW - 6, yy, { align: "right" });
  };

  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageW, 120, "F");

  try {
    const logo = await getLogoDataUrl();
    doc.addImage(logo, "PNG", left, 28, 44, 44);
  } catch {
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("VintageValley Resort", left + 56, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Invoice", left + 56, 72);

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

  y = 150;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Booking Invoice", left + 14, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: ${invoiceNo}`, right - 14, y, { align: "right" });
  y += 14;
  doc.text(`Invoice Date: ${invoiceDate.toLocaleDateString("en-IN")}`, right - 14, y, { align: "right" });

  y += 14;
  drawDivider(y);
  y += 18;

  y = drawSectionTitle("Summary", y);
  y = drawKV("Booking ID", String(b.id ?? "—"), y);
  y = drawKV("Room", String(b.room?.title ?? "—"), y);
  y = drawKV(
    "Dates",
    `${formatDate(b.checkIn)} ${b.checkInTime ? `(${String(b.checkInTime)})` : ""} - ${formatDate(b.checkOut)} ${b.checkOutTime ? `(${String(b.checkOutTime)})` : ""}`.trim(),
    y
  );
  y = drawKV("Rooms", String(b.rooms ?? 1), y);
  y = drawKV(
    "Guest Summary",
    `${String(b.guests ?? "—")} total (A:${String(b.adults ?? "—")}, C:${String(b.children ?? "—")}, Extra:${String(b.extraAdults ?? "—")})`,
    y
  );

  y += 10;
  drawDivider(y);
  y += 18;

  // Price summary (print/PDF friendly)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("Base Amount", left + 14, y);
  drawMoneyRight(y, computedBase, { muted: true });
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("GST (5%)", left + 14, y);
  drawMoneyRight(y, computedGst, { muted: true });
  y += 12;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(left + 14, y, right - 14, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Amount", left + 14, y);
  drawMoneyRight(y, b.amount, { strong: true });
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
  y = drawKV("Booking Status", String(b.status ?? "—"), y);
  y = drawKV("Payment Status", String(paid?.status ?? "—"), y);
  y = drawKV("Method", formatMethod(paid?.method), y);
  y = drawKV("Razorpay Order", String(paid?.razorpayOrderId ?? "—"), y);
  y = drawKV("Razorpay Payment", String(paid?.razorpayPaymentId ?? "—"), y);

  if (b.additionalInformation) {
    y += 14;
    drawDivider(y);
    y += 22;
    y = drawSectionTitle("Additional Information", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const text = String(b.additionalInformation);
    const lines = doc.splitTextToSize(text, contentW - 28);
    doc.text(lines, left + 14, y + 6);
  }

  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("This invoice is system generated and valid without signature.", left, pageH - 56);
  doc.text("VintageValley Resort", right, pageH - 56, { align: "right" });

  const rawFileName = opts?.fileName?.trim();
  const safeFileName = rawFileName
    ? rawFileName.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim()
    : `invoice_${String(b.id ?? "booking")}.pdf`;

  doc.save(safeFileName);
};
