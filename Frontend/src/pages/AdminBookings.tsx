import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useMemo, useState } from "react";
import { downloadBookingInvoicePdf } from "@/lib/invoicePdf";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";

const AdminBookings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOk, setCreateOk] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [extraAdults, setExtraAdults] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "RECEPTION">("RECEPTION");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [mealPlanByDate, setMealPlanByDate] = useState<Record<string, MealPlan>>({});

  type MealPlan = "EP" | "CP" | "MAP";

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const ms = end.getTime() - start.getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 0;
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const nightDates = useMemo(() => {
    if (!checkIn || nights <= 0) return [] as string[];
    const start = new Date(checkIn);
    if (!Number.isFinite(start.getTime())) return [] as string[];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const out: string[] = [];
    for (let i = 0; i < nights; i++) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, "0");
      const dd = String(cursor.getDate()).padStart(2, "0");
      out.push(`${yyyy}-${mm}-${dd}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  }, [checkIn, nights]);

  useEffect(() => {
    if (!nightDates.length) return;
    setMealPlanByDate((prev) => {
      const next: Record<string, MealPlan> = {};
      for (const d of nightDates) {
        const plan = prev[d];
        next[d] = plan === "EP" || plan === "CP" || plan === "MAP" ? plan : "EP";
      }
      return next;
    });
  }, [nightDates]);

  const todayIso = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const checkOutMinIso = useMemo(() => {
    if (!checkIn) return todayIso;
    const d = new Date(checkIn);
    if (!Number.isFinite(d.getTime())) return todayIso;
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, [checkIn, todayIso]);

  useEffect(() => {
    if (!checkOut) return;
    if (checkOut < checkOutMinIso) setCheckOut(checkOutMinIso);
  }, [checkOut, checkOutMinIso]);

  useEffect(() => {
    if (!checkInTime) setCheckInTime("13:00");
    if (!checkOutTime) setCheckOutTime("11:00");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRoom = useMemo(() => {
    const idNum = Number(roomId);
    if (!Number.isFinite(idNum)) return null;
    return roomsList.find((r) => Number(r?.id) === idNum) ?? null;
  }, [roomId, roomsList]);

  const priceEstimate = useMemo(() => {
    const room = selectedRoom;
    if (!room || nights <= 0) return null;

    const round2 = (n: number) => Math.round(n * 100) / 100;

    let cpNights = 0;
    let mapNights = 0;
    for (const d of nightDates) {
      const plan = mealPlanByDate[d] ?? "EP";
      if (plan === "CP") cpNights += 1;
      if (plan === "MAP") mapNights += 1;
    }

    const safeRooms = Number.isFinite(rooms) && rooms > 0 ? rooms : 1;
    const safeGuests = Number.isFinite(guests) && guests > 0 ? guests : 1;
    const safeChildren = Number.isFinite(children) && children >= 0 ? children : 0;
    const safeExtraAdults = Number.isFinite(extraAdults) && extraAdults >= 0 ? extraAdults : 0;

    const title = String(room?.title ?? "").toLowerCase();
    const mapRatePerGuestPerNight = title.includes("lotus") || title.includes("presidential")
      ? 2000
      : title.includes("deluxe") || title.includes("edge")
      ? 1000
      : 0;

    const roomTotal = round2(Number(room.pricePerNight ?? 0) * nights * safeRooms);
    const childCharge = round2(1200 * safeChildren * nights);
    const extraAdultCharge = round2(1500 * safeExtraAdults * nights);
    const cpCharge = round2(500 * safeGuests * cpNights);
    const mapCharge = round2(mapRatePerGuestPerNight * safeGuests * mapNights);
    const base = round2(roomTotal + childCharge + extraAdultCharge + cpCharge + mapCharge);
    const convenienceFee = 0;
    const gst = round2(base * 0.05);
    const total = round2(base + gst);

    return { roomTotal, childCharge, extraAdultCharge, cpCharge, mapCharge, base, convenienceFee, gst, total };
  }, [selectedRoom, nights, rooms, guests, children, extraAdults, nightDates, mealPlanByDate]);

  const discountedEstimate = useMemo(() => {
    const pe = priceEstimate;
    if (!pe) return null;

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const base = Number(pe.base ?? 0);
    const discount = round2(Math.max(0, Math.min(base, Number(appliedPromo?.discountAmount ?? 0))));
    const baseAfterDiscount = round2(Math.max(0, base - discount));
    const gst = round2(baseAfterDiscount * 0.05);
    const total = round2(baseAfterDiscount + gst);
    return { discount, baseAfterDiscount, gst, total };
  }, [priceEstimate, appliedPromo?.discountAmount]);

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

  const deleteBooking = async (bookingId: string) => {
    const id = String(bookingId ?? "").trim();
    if (!id) return;
    const ok = window.confirm("Delete this booking? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/admin-api/bookings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to delete booking");
      toast.success("Booking deleted");
      await loadBookings();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete booking");
    }
  };

  const loadBookings = async () => {
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

  useEffect(() => {
    loadBookings();

    const loadMeta = async () => {
      try {
        const [uRes, rRes] = await Promise.all([
          fetch("/admin-api/users", { credentials: "include" }),
          fetch("/admin-api/rooms", { credentials: "include" }),
        ]);

        const [uData, rData] = await Promise.all([
          uRes.json().catch(() => null),
          rRes.json().catch(() => null),
        ]);

        if (uRes.ok) setUsers(uData?.data?.users ?? []);
        if (rRes.ok) setRoomsList(rData?.data?.rooms ?? []);
      } catch {
        // ignore
      }
    };

    loadMeta();
  }, []);

  const submitManualBooking = async () => {
    setCreateError(null);
    setCreateOk(null);

    const name = userName.trim();
    const email = userEmail.trim();
    const phone = userPhone.trim();
    const r = roomId.trim();
    if (!name) {
      setCreateError("User name is required");
      toast.error("User name is required");
      return;
    }
    if (!email) {
      setCreateError("User email is required");
      toast.error("User email is required");
      return;
    }
    if (!r || !Number.isFinite(Number(r))) {
      setCreateError("Valid Room ID is required");
      toast.error("Valid Room ID is required");
      return;
    }
    if (!checkIn) {
      setCreateError("Check-in date is required");
      toast.error("Check-in date is required");
      return;
    }
    if (!checkOut) {
      setCreateError("Check-out date is required");
      toast.error("Check-out date is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/admin-api/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          paymentMethod,
          userName: name,
          userEmail: email,
          userPhone: phone ? phone : null,
          roomId: Number(r),
          checkIn,
          checkOut,
          checkInTime: checkInTime.trim() ? checkInTime.trim() : null,
          checkOutTime: checkOutTime.trim() ? checkOutTime.trim() : null,
          rooms,
          guests,
          adults,
          children,
          extraAdults,
          additionalInformation: additionalInformation.trim() ? additionalInformation.trim() : null,
          mealPlanByDate: nightDates.map((d) => ({ date: d, plan: mealPlanByDate[d] ?? "EP" })),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to create booking");

      setCreateOk("Booking created (CONFIRMED) with Cash/UPI/Reception payment.");
      toast.success("Booking created");
      await loadBookings();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create booking");
      toast.error(e?.message ?? "Failed to create booking");
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout title="Bookings" description="View and manage bookings.">
      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        <div className="mb-8">
          <div className="text-gray-900 font-semibold mb-3">Cash/UPI/Reception Payment</div>

          <div className="mb-4">
            <div className="text-xs text-gray-800/70 mb-1">Payment method</div>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30 w-full md:w-1/2"
            >
              <option value="RECEPTION">Reception</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {createError && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{createError}</div>
          )}
          {createOk && (
            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{createOk}</div>
          )}

          <div className="mt-4">
            <div className="text-gray-800 font-semibold mb-2">Guest details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Name</div>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Full name"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Email</div>
                <input
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="name@example.com"
                  type="email"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Phone (optional)</div>
                <input
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  placeholder="10-digit mobile"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-gray-800 font-semibold mb-2">Booking details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Room</div>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                >
                  <option value="">Select room</option>
                  {roomsList.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Number of rooms</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(rooms) ? rooms : 1)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 1 : Number.parseInt(digits, 10);
                    setRooms(Math.max(1, Math.min(10, Number.isFinite(n) ? n : 1)));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(rooms) || rooms < 1) setRooms(1);
                  }}
                  placeholder="1"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="hidden md:block" />

              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-in date</div>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={todayIso}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-out date</div>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkOutMinIso}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="hidden md:block" />

              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-in time</div>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Check-out time</div>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="hidden md:block" />
            </div>
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Total guests</div>
                <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-gray-50 text-gray-700">
                  {adults + children + extraAdults}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Adults</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(adults) ? adults : 1)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 0 : Number.parseInt(digits, 10);
                    setAdults(Math.max(0, Number.isFinite(n) ? n : 0));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(adults) || adults < 0) setAdults(0);
                  }}
                  placeholder="2"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Children (5–10 yrs)</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(children) ? children : 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 0 : Number.parseInt(digits, 10);
                    setChildren(Math.max(0, Number.isFinite(n) ? n : 0));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(children) || children < 0) setChildren(0);
                  }}
                  placeholder="0"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-800/70">Extra adults (10+ yrs)</div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={String(Number.isFinite(extraAdults) ? extraAdults : 0)}
                  onFocus={(e) => e.currentTarget.select()}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    (e.currentTarget as HTMLInputElement).focus();
                    (e.currentTarget as HTMLInputElement).select();
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const digits = raw.replace(/[^0-9]/g, "");
                    const n = digits === "" ? 0 : Number.parseInt(digits, 10);
                    setExtraAdults(Math.max(0, Number.isFinite(n) ? n : 0));
                  }}
                  onBlur={() => {
                    if (!Number.isFinite(extraAdults) || extraAdults < 0) setExtraAdults(0);
                  }}
                  placeholder="0"
                  className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-1">
              <div className="text-xs text-gray-800/70">Any further information (optional)</div>
              <input
                value={additionalInformation}
                onChange={(e) => setAdditionalInformation(e.target.value)}
                placeholder="Special requests, arrival details, etc."
                className="px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-gray-800 font-semibold">Meal plan (day-wise)</div>
            <div className="text-gray-800/70 text-sm">EP: no meals, CP: +₹500/guest/night, MAP: included</div>

            {nightDates.length === 0 ? (
              <div className="text-gray-800/60 text-sm mt-2">Select check-in and check-out dates to choose meal plans.</div>
            ) : (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {nightDates.map((d) => (
                  <div key={d} className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40 flex items-center justify-between gap-3">
                    <div className="text-gray-800/80 text-sm">{new Date(d).toLocaleDateString("en-IN")}</div>
                    <select
                      value={mealPlanByDate[d] ?? "EP"}
                      onChange={(e) => setMealPlanByDate((prev) => ({ ...prev, [d]: e.target.value as MealPlan }))}
                      className="px-3 py-2 rounded-xl border border-gold/20 bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 text-sm"
                    >
                      <option value="EP">EP</option>
                      <option value="CP">CP</option>
                      <option value="MAP">MAP</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6">
            <div className="text-gray-800 font-semibold">Promo Code (optional)</div>
            <div className="mt-2">
              {!appliedPromo ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-1/2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-3 rounded-2xl border border-gold/20 focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                  <button
                    type="button"
                    disabled={promoLoading || !promoInput.trim() || !priceEstimate}
                    onClick={async () => {
                      const code = promoInput.trim();
                      if (!code) return;
                      if (!priceEstimate) {
                        toast.error("Select room and dates first");
                        return;
                      }

                      setPromoLoading(true);
                      try {
                        const res = await fetch("/api/promos/validate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ code, baseAmount: Number(priceEstimate.base ?? 0) }),
                        });
                        const data = await res.json().catch(() => null);
                        if (!res.ok) {
                          toast.error("Invalid Promocode");
                          return;
                        }
                        const discountAmount = Number(data?.data?.discountAmount ?? 0);
                        const promoCode = String(data?.data?.promo?.code ?? code).trim();
                        if (!promoCode) {
                          toast.error("Invalid promo code");
                          return;
                        }
                        setAppliedPromo({
                          code: promoCode,
                          discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
                        });
                        toast.success("Promo applied");
                      } catch {
                        toast.error("Failed to apply promo code");
                      } finally {
                        setPromoLoading(false);
                      }
                    }}
                    className="px-4 py-3 rounded-2xl font-semibold bg-gold text-gray-800 hover:bg-bronze transition-colors disabled:opacity-60"
                  >
                    {promoLoading ? "Applying…" : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="w-full md:w-1/2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gold/10 border border-gold/20 rounded-2xl px-4 py-3">
                  <div className="text-gray-800/80 min-w-0">
                    <div className="font-semibold text-gray-800 break-words">{appliedPromo.code}</div>
                    <div className="text-sm text-gray-800/70">Discount: {formatInr(discountedEstimate?.discount ?? 0)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedPromo(null);
                      toast.info("Promo removed");
                    }}
                    className="px-4 py-2 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-gray-800 font-semibold">Price estimate</div>
            {!priceEstimate ? (
              <div className="text-gray-800/60 text-sm mt-2">Select room and dates to see an estimate.</div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-800/70">Base (room + addons + meals)</span>
                    <span className="text-gray-900 font-semibold">{formatInr(priceEstimate.base)}</span>
                  </div>
                </div>
                {((appliedPromo ? discountedEstimate?.gst : priceEstimate.gst) ?? 0) > 0 && (
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-800/70">GST (5%)</span>
                      <span className="text-gray-900 font-semibold">{formatInr(appliedPromo ? discountedEstimate?.gst ?? 0 : priceEstimate.gst)}</span>
                    </div>
                  </div>
                )}
                {appliedPromo && (discountedEstimate?.discount ?? 0) > 0 && (
                  <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-gray-800/70">Promo Code: </span>
                        <span className="text-xs text-green-600 font-medium">{appliedPromo.code}</span>
                      </div>
                      <span className="text-green-600 font-semibold">-{formatInr(discountedEstimate?.discount ?? 0)}</span>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 rounded-2xl border border-gold/20 bg-ivory/40">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">{formatInr(appliedPromo ? discountedEstimate?.total ?? priceEstimate.total : priceEstimate.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={submitManualBooking}
              disabled={creating}
              className="px-5 py-2.5 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create CONFIRMED booking"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : confirmedBookings.length === 0 ? (
          <div className="text-gray-800/70">No CONFIRMED bookings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
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
                  <th className="py-3">Delete</th>
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
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => deleteBooking(b.id)}
                        className="p-2 rounded-full border border-gold/20 text-gray-800/80 hover:bg-gold/10 transition-colors"
                        title="Delete booking"
                      >
                        <Trash2 size={18} />
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
