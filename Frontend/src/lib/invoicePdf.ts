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
  const convenienceFeeAmount = Number.isFinite(Number(b.convenienceFeeAmount)) ? Number(b.convenienceFeeAmount) : null;
  const gstAmount = Number.isFinite(Number(b.gstAmount)) ? Number(b.gstAmount) : null;
  const mealPlanCpAmount = Number.isFinite(Number(b.mealPlanCpAmount)) ? Number(b.mealPlanCpAmount) : 0;

  // Display-friendly computation (supports decimals if total is decimal)
  const computedBase = baseAmount ?? (Number.isFinite(totalAmount) ? totalAmount / 1.07 : 0);
  const computedConvenience = convenienceFeeAmount ?? Math.max(0, computedBase * 0.02);
  const computedGst = gstAmount ?? Math.max(0, computedBase * 0.05);

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

  if (mealPlanCpAmount > 0.000001) {
    y = drawKV("Meal Plan", "CP (day-wise)", y);
  } else {
    y = drawKV("Meal Plan", "EP/MAP", y);
  }

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

  if (mealPlanCpAmount > 0.000001) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("CP Plan Charge", left + 14, y);
    drawMoneyRight(y, mealPlanCpAmount, { muted: true });
    y += 16;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("Convenience Fee (2%)", left + 14, y);
  drawMoneyRight(y, computedConvenience, { muted: true });
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

  // Terms & Conditions
  {
    const addPageIfNeeded = (nextY: number) => {
      if (nextY <= pageH - 72) return;
      doc.addPage();
      y = 60;
    };

    y += 14;
    drawDivider(y);
    y += 22;
    addPageIfNeeded(y + 20);
    y = drawSectionTitle("Terms & Conditions", y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    const terms = [
      "Last updated: June 15, 2024",
      "",
      "1. Acceptance of Terms",
      "By accessing and using the services of Vintage Valley Resort, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by the above, please do not use this service.",
      "",
      "2. Reservation and Cancellation Policy",
      "Reservations must be guaranteed with a valid credit card at the time of booking.",
      "Cancellations made 48 hours or more before the scheduled arrival date will receive a full refund.",
      "Cancellations made less than 48 hours before the scheduled arrival date will be charged for one night's stay.",
      "Early departures will be charged for the entire reserved stay.",
      "",
      "3. Check-in and Check-out",
      "Check-in time is 1:00 PM. Early check-in is subject to availability.",
      "Check-out time is 11:00 AM. Late check-out may result in additional charges.",
      "A valid government-issued photo ID is required at check-in.",
      "",
      "4. Resort Rules",
      "Smoking is prohibited in all indoor areas of the resort.",
      "Pets are not allowed unless specifically stated as a pet-friendly room.",
      "Quiet hours are from 10:00 PM to 7:00 AM.",
      "The resort is not responsible for any loss or damage to personal belongings.",
      "Guests are liable for any damage caused to resort property during their stay.",
      "",
      "5. Child and Extra Person Policy",
      "Children below 5 years of age stay free when using existing bedding.",
      "Children between 5 to 12 years are charged ₹1200 per night.",
      "Extra person charges (above 12 years) are ₹1500 per night.",
      "Maximum occupancy per room varies by room type.",
      "",
      "6. Facility Usage",
      "Use of resort facilities is at the guest's own risk.",
      "Children must be supervised at all times, especially in the pool area.",
      "The resort reserves the right to close any facility for maintenance without prior notice.",
      "Operating hours for facilities are subject to change.",
      "",
      "7. Limitation of Liability",
      "Vintage Valley Resort shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use the services or for the cost of procurement of substitute services.",
      "",
      "8. Governing Law",
      "These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in Maharashtra, India.",
      "",
      "9. Contact Information",
      "For questions or concerns regarding these terms and conditions, please contact us at:",
      "Email: vintagevalleyresort@gmail.com",
      "Phone: +91 9371179888",
      "Address: Mumbai - Nashik Expy, opp. Parveen Industry, Talegaon, Igatpuri, Maharashtra 422402.",
    ].join("\n");

    const lines = doc.splitTextToSize(terms, contentW - 28);
    for (const line of lines) {
      addPageIfNeeded(y + 14);
      doc.text(String(line), left + 14, y);
      y += 12;
    }
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
