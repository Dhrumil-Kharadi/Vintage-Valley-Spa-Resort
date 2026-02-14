"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingInvoicePdfBuffer = void 0;
const jspdf_1 = require("jspdf");
function drawInvoiceHeader(doc, config) {
    const { left, right, bookingRef } = config;
    const boxX = left;
    const boxY = 32;
    const boxW = right - left;
    const boxH = 112;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(2);
    doc.rect(boxX, boxY, boxW, boxH);
    doc.setLineWidth(1);
    doc.rect(boxX + 4, boxY + 4, boxW - 8, boxH - 8);
    const innerLeft = boxX + 14;
    const innerRight = boxX + boxW - 14;
    const colGap = 24;
    const colW = (boxW - 28 - colGap) / 2;
    const leftColX = innerLeft;
    const rightColX = innerLeft + colW + colGap;
    const headerImageDataUrl = config.headerImageDataUrl;
    const imageHeight = headerImageDataUrl ? 48 : 0;
    if (headerImageDataUrl) {
        const props = doc.getImageProperties ? doc.getImageProperties(headerImageDataUrl) : null;
        const iw = Number(props?.width ?? 0);
        const ih = Number(props?.height ?? 0);
        const usableW = boxW - 28;
        const scaledW = iw > 0 && ih > 0 ? Math.min(usableW, (iw / ih) * imageHeight) : usableW;
        const imgX = boxX + (boxW - scaledW) / 2;
        const imgY = boxY + 8;
        doc.addImage(headerImageDataUrl, "PNG", imgX, imgY, scaledW, imageHeight);
    }
    const topY = boxY + imageHeight + 22;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("CONFIRM BOOKING", leftColX, topY);
    doc.setFontSize(12);
    doc.text("BOOKING REFERENCE", leftColX, topY + 16);
    doc.setFontSize(14);
    const refText = `NO :${bookingRef}`;
    const refLines = doc.splitTextToSize(refText, colW);
    doc.text(refLines, leftColX, topY + 32);
    const refLineH = 14;
    const refEndY = topY + 32 + (refLines.length - 1) * refLineH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const leftNote = "Kindly print this confirmation and\nhave it ready upon check-in at the Hotel";
    const leftNoteY = refEndY + 24;
    doc.text(leftNote.split("\n"), leftColX, leftNoteY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("RVJ ENTERPRISES-VINTAGE", rightColX + colW, topY, { align: "right" });
    doc.setFontSize(18);
    doc.text("VALLEY RESORT", rightColX + colW, topY + 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    const address = "Mumbai-Nashik Highway,Opp Pravin Industries,\nTalegaon,Igatpuri,\nIgatpuri,Nashik - 422403,Maharashtra,India";
    const addrStartY = topY + 36;
    const headerLineH = 13;
    doc.setFontSize(10);
    const addrLines = doc.splitTextToSize(address, colW);
    for (let i = 0; i < addrLines.length; i++) {
        doc.text(String(addrLines[i] ?? ""), rightColX + colW, addrStartY + i * headerLineH, { align: "right" });
    }
    const addrEndY = addrStartY + (addrLines.length - 1) * headerLineH;
    const email = "vintagevalleyresort@gmail.com";
    const contactBlockH = headerLineH * 3 + 8;
    const safeBottomY = boxY + boxH - 14;
    const contactStartY = Math.max(addrEndY + 10, safeBottomY - contactBlockH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Contact us By", rightColX + colW, contactStartY, { align: "right" });
    doc.text("Phone number : +919371169888", rightColX + colW, contactStartY + headerLineH, { align: "right" });
    const emailTextY = contactStartY + headerLineH * 2;
    doc.text(`Email ID : ${email}`, rightColX + colW, emailTextY, { align: "right" });
    const emailW = doc.getTextWidth(email);
    doc.setLineWidth(0.8);
    const underlineY = emailTextY + 1;
    doc.line(innerRight - emailW, underlineY, innerRight, underlineY);
    return boxY + boxH + 18;
}
const generateBookingInvoicePdfBuffer = async (b) => {
    const formatMethod = (m) => {
        const s = String(m ?? "").trim();
        if (!s)
            return "—";
        return s.toUpperCase();
    };
    const paid = b.payments?.find((p) => p.status === "PAID") ?? null;
    const totalAmount = Number(b.amount ?? 0);
    const baseAmount = Number.isFinite(Number(b.baseAmount)) ? Number(b.baseAmount) : null;
    const convenienceFeeAmount = Number.isFinite(Number(b.convenienceFeeAmount)) ? Number(b.convenienceFeeAmount) : null;
    const gstAmount = Number.isFinite(Number(b.gstAmount)) ? Number(b.gstAmount) : null;
    const computedBase = baseAmount ?? (Number.isFinite(totalAmount) ? totalAmount / 1.07 : 0);
    const computedConvenience = convenienceFeeAmount ?? Math.max(0, computedBase * 0.02);
    const computedGst = gstAmount ?? Math.max(0, computedBase * 0.05);
    const doc = new jspdf_1.jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const left = 36;
    const right = pageW - 36;
    const contentW = right - left;
    let y = 36;
    const formatMoney = (v) => {
        const n = Number(v ?? 0);
        if (!Number.isFinite(n))
            return String(v ?? "0");
        const hasFraction = Math.abs(n % 1) > 0.000001;
        return new Intl.NumberFormat("en-IN", {
            minimumFractionDigits: hasFraction ? 2 : 0,
            maximumFractionDigits: hasFraction ? 2 : 0,
        }).format(n);
    };
    const formatDate = (d) => {
        if (!d)
            return "—";
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime()))
            return "—";
        return dt.toLocaleDateString("en-IN");
    };
    const invoiceDate = new Date();
    // Use VVR-{bookingNo} format if available, otherwise fall back to the old ID
    const bookingRef = b.bookingNo ? `VVR-${b.bookingNo}` : String(b.id ?? "").trim() || "—";
    const addPageIfNeeded = (nextY) => {
        if (nextY <= pageH - 60)
            return;
        doc.addPage();
        y = 48;
    };
    const drawPara = (text, x, yy, maxW, lineH) => {
        const lines = doc.splitTextToSize(text, maxW);
        doc.text(lines, x, yy);
        return yy + lines.length * lineH;
    };
    const drawLabelColonValue = (label, value, yy) => {
        const x = left + 14;
        const labelW = 120;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(label, x, yy);
        doc.text(":", x + labelW, yy);
        doc.text(String(value ?? ""), x + labelW + 10, yy);
        return yy + 16;
    };
    const drawTableHeaderBox = (yy, headers) => {
        const x = left + 14;
        const w = contentW - 28;
        const h = 22;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1.2);
        doc.rect(x, yy, w, h);
        doc.setLineWidth(0.6);
        doc.rect(x + 2, yy + 2, w - 4, h - 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const textY = yy + 15;
        for (const hd of headers) {
            const opts = { align: hd.align ?? "left" };
            if (typeof hd.maxWidth === "number")
                opts.maxWidth = hd.maxWidth;
            doc.text(hd.text, hd.x, textY, opts);
        }
        return yy + h + 14;
    };
    y = drawInvoiceHeader(doc, { left, right, contentW, bookingRef });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    const guestName = String(b.user?.name ?? "").trim() || "Guest";
    y = drawPara(`Dear ${guestName},`, left + 14, y, contentW - 28, 16);
    y += 6;
    y = drawPara("Thank you for choosing RVJ ENTERPRISES-VINTAGE VALLEY RESORT for your stay. We are pleased to inform you that your reservation request is CONFIRMED and your reservation details are as follows.", left + 14, y, contentW - 28, 16);
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Booking Details", left + 14, y);
    y += 18;
    const bookingDate = b?.createdAt ? formatDate(b.createdAt) : formatDate(invoiceDate);
    const checkInDate = formatDate(b.checkIn);
    const checkOutDate = formatDate(b.checkOut);
    const nights = String(b?.nights ?? "—");
    const arrivalTime = String(b?.checkInTime ?? "").trim() || "—";
    const checkoutTime = String(b?.checkOutTime ?? "").trim() || "—";
    const specialRequest = String(b?.additionalInformation ?? "").trim();
    y = drawLabelColonValue("Booking Date", bookingDate, y);
    y = drawLabelColonValue("Check In Date", checkInDate, y);
    y = drawLabelColonValue("Check Out Date", `${checkOutDate} ${checkoutTime !== "—" ? checkoutTime : ""}`.trim(), y);
    y = drawLabelColonValue("Nights", nights, y);
    y = drawLabelColonValue("Arrival Time", arrivalTime, y);
    y = drawLabelColonValue("Special Request", specialRequest, y);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Your Details", left + 14, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Name : ${guestName}`, left + 14, y);
    y += 16;
    doc.text(`Email : ${String(b.user?.email ?? "")}`, left + 14, y);
    y += 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Rooms Details", left + 14, y);
    y += 12;
    addPageIfNeeded(y + 70);
    const tableX = left + 14;
    const tableW = contentW - 28;
    const col1 = tableX + 6;
    const col2 = tableX + tableW * 0.34;
    const col3 = tableX + tableW * 0.5;
    const col4 = tableX + tableW * 0.7;
    const col5 = tableX + tableW - 6;
    y = drawTableHeaderBox(y, [
        { text: "Room Type", x: col1, align: "left" },
        { text: "Guest(s)", x: col2, align: "left" },
        { text: "No of rooms", x: col3, align: "left" },
        { text: "Package if any", x: col4, align: "left", maxWidth: Math.max(40, col5 - col4 - 10) },
        { text: "Promotion if any", x: col5, align: "right" },
    ]);
    const roomTitle = String(b.room?.title ?? "—");
    const adults = Number(b.adults ?? 0);
    const children = Number(b.children ?? 0);
    const guestSummary = `${adults} adult & ${children}\nchild`;
    const noOfRooms = String(b.rooms ?? 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const roomTitleLines = doc.splitTextToSize(roomTitle, col2 - col1 - 8);
    doc.text(roomTitleLines, col1, y);
    doc.setFont("helvetica", "normal");
    const guestLines = guestSummary.split("\n");
    doc.text(guestLines, col2, y);
    doc.text(noOfRooms, col3, y);
    doc.text("None", col4, y);
    doc.text("None", col5, y, { align: "right" });
    const rowLineH = 12;
    const rowH = Math.max(roomTitleLines.length * rowLineH, guestLines.length * rowLineH, 14);
    y += rowH + 6;
    doc.setFont("helvetica", "bold");
    doc.text("Description", tableX, y);
    doc.setFont("helvetica", "normal");
    const hasMap = (b.mealPlanByDate || []).some((d) => d.plan === "MAP");
    const hasCp = (b.mealPlanByDate || []).some((d) => d.plan === "CP");
    const mealPlan = hasMap ? "AP" : hasCp ? "CP" : "EP";
    doc.text(`: ${roomTitle} - ${mealPlan}`, tableX + 70, y);
    y += 18;
    addPageIfNeeded(y + 180);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Rates Details", left + 14, y);
    y += 12;
    y = drawTableHeaderBox(y, [
        { text: "Details", x: tableX + 6, align: "left" },
        { text: "Rates (Rs)", x: tableX + tableW - 6, align: "right" },
    ]);
    const totalRoomCharges = Number.isFinite(Number(b.baseAmount)) ? Number(b.baseAmount) : computedBase;
    const roomChargesTax = Number.isFinite(Number(b.gstAmount))
        ? Number(b.gstAmount)
        : Math.max(0, Number(b.amount ?? 0) - totalRoomCharges);
    const inclusions = 0;
    const extraCharges = 0;
    const roundOff = 0;
    const grandTotal = Number(b.amount ?? 0);
    const totalPaid = Array.isArray(b?.payments)
        ? b.payments
            .filter((p) => String(p?.status ?? "").toUpperCase() === "PAID")
            .reduce((sum, p) => sum + (Number.isFinite(Number(p?.amount)) ? Number(p.amount) : 0), 0)
        : Number(paid?.amount ?? 0);
    const dueAtCheckIn = Math.max(0, grandTotal - totalPaid);
    const drawRateRow = (label, amount) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(label, tableX + 6, y);
        doc.text(formatMoney(amount), tableX + tableW - 6, y, { align: "right" });
        y += 16;
    };
    drawRateRow("Total Room Charges", totalRoomCharges);
    drawRateRow("Room Charges Tax", roomChargesTax);
    drawRateRow("Inclusions Including Tax", inclusions);
    drawRateRow("Extra Charges Including Discount and Tax", extraCharges);
    drawRateRow("Round Off", roundOff);
    y += 2;
    drawRateRow("Grand Total", grandTotal);
    drawRateRow("Total Paid", totalPaid);
    drawRateRow("Amount due at time of check in", dueAtCheckIn);
    y += 12;
    {
        const boxW = 210;
        const boxH = 56;
        const boxX = left + 14;
        const boxY = y;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1);
        doc.rect(boxX, boxY, boxW, boxH);
        doc.setLineWidth(0.6);
        doc.rect(boxX + 3, boxY + 3, boxW - 6, boxH - 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(16);
        doc.text("BOOKING AMOUNT", boxX + boxW / 2, boxY + 24, { align: "center" });
        doc.setFontSize(13);
        doc.text(`Rs ${formatMoney(grandTotal)} (INR)`, boxX + boxW / 2, boxY + 44, { align: "center" });
        y = boxY + boxH + 22;
    }
    doc.addPage();
    y = 48;
    {
        addPageIfNeeded(y + 60);
        const rightX = right - 14;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Booked & Payable By", rightX, y, { align: "right" });
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const nameLines = doc.splitTextToSize(guestName, 180);
        doc.text(nameLines, rightX, y, { align: "right" });
        y += nameLines.length * 14;
        y += 18;
    }
    addPageIfNeeded(y + 240);
    {
        const headerY = y;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        const x = left + 14;
        const w = contentW - 28;
        const h = 22;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1.2);
        doc.rect(x, headerY, w, h);
        doc.setLineWidth(0.6);
        doc.rect(x + 2, headerY + 2, w - 4, h - 4);
        doc.text("Conditions & Policies", x + 6, headerY + 15);
        y = headerY + h + 14;
        doc.setFont("helvetica", "bold");
        doc.text("Cancellation Policy", x, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        const cancelText = "0-07 DAYS PRIOR TO STAY -NO REFUND. 08-15 DAYS PRIOR TO STAY -25% REFUND. 15-30 DAYS PRIOR TO STAY- 50% REFUND. MORE THAN 30 DAYS PRIOR TO STAY- 75% REFUND. ALL NO SHOWS WILL BE CHARGED AS PER THE BOOKING DETAILS. ALL REFUNDS WILL BE ATTRACT A 10% ADMINISTRATIVE CHARGES AND IT WOULD TAKE A MININUM OF 10 WORKING DAYS";
        y = drawPara(cancelText, x, y, w, 14);
        y += 10;
        doc.setFont("helvetica", "bold");
        doc.text("Hotel Policy", x, y);
        y += 18;
        doc.setFont("helvetica", "bold");
        doc.text("Hotel Check in Time", x, y);
        doc.setFont("helvetica", "normal");
        doc.text(": 01:00 PM", x + 130, y);
        y += 16;
        doc.setFont("helvetica", "bold");
        doc.text("Hotel Check out Time", x, y);
        doc.setFont("helvetica", "normal");
        doc.text(": 11:00 AM", x + 130, y);
        y += 22;
        doc.setFont("helvetica", "bold");
        doc.text("This email has been sent from an automated system - please do not reply to it.", x + w / 2, y, { align: "center" });
        y += 10;
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.8);
        doc.line(x, y + 8, x + w, y + 8);
        y += 26;
        doc.setFont("helvetica", "normal");
        doc.text("**** FOR ANY FURTHER QUERY ****", x, y);
        y += 16;
        doc.text("Contact us by", x, y);
        y += 14;
        doc.text("Phone number : +919371169888", x, y);
        y += 14;
        doc.text("Email ID : vintagevalleyresort@gmail.com", x, y);
        y += 14;
        const addr = "Mumbai-Nashik Highway,Opp Pravin Industries,Talegaon,Igatpuri,Igatpuri,Nashik-422403,Maharashtra,India";
        {
            const minFont = 7;
            let fs = 11;
            doc.setFont("helvetica", "normal");
            while (fs > minFont) {
                doc.setFontSize(fs);
                if (doc.getTextWidth(addr) <= w)
                    break;
                fs -= 0.5;
            }
            doc.text(addr, x, y);
            doc.setFontSize(12);
            y += 14;
        }
        y += 6;
        doc.setDrawColor(120, 120, 120);
        doc.setLineWidth(0.8);
        doc.line(x, y, x + w, y);
    }
    void formatMethod;
    void computedConvenience;
    void computedGst;
    const pdfArrayBuffer = doc.output("arraybuffer");
    return Buffer.from(pdfArrayBuffer);
};
exports.generateBookingInvoicePdfBuffer = generateBookingInvoicePdfBuffer;
