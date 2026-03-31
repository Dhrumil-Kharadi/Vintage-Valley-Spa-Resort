import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";
import GlobalFlatPromo from "./admin/GlobalFlatPromo";

type Promo = {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: string;
  applicableLabel?: string;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  minNights?: number | null;
  maxNights?: number | null;
  maxUses?: number | null;
  appliesTo?: string | null;
  usedCount?: number;
  createdAt?: string;
};

const AdminPromoCodes = () => {
  const [tab, setTab] = useState<"code" | "global">("code");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState<string>("");
  const [applicableLabel, setApplicableLabel] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [startsAt, setStartsAt] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [minNights, setMinNights] = useState<string>("");
  const [maxNights, setMaxNights] = useState<string>("");
  const [appliesTo, setAppliesTo] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promos", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(data?.error?.message ?? "Failed to load promo codes");
      setPromos(data?.data?.promos ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  const deletePromo = async (promoId: string) => {
    const id = String(promoId ?? "").trim();
    if (!id) return;

    const ok = window.confirm(
      "Delete this promo code? This cannot be undone."
    );
    if (!ok) return;

    try {
      const res = await fetch(`/api/promos/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to delete promo");
        return;
      }
      toast.success("Promo deleted");
      await load();
    } catch {
      toast.error("Failed to delete promo");
    }
  };

  const toggleActive = async (p: Promo) => {
    try {
      const res = await fetch(
        `/api/promos/${encodeURIComponent(p.id)}/active`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isActive: !p.isActive }),
        }
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Failed to update promo");
        return;
      }
      toast.success("Promo updated");
      await load();
    } catch {
      toast.error("Failed to update promo");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: any = {
      code: code.trim(),
      type,
      value: Number(value),
      applicableLabel: applicableLabel.trim(),
      isActive,
    };

    if (maxUses.trim()) payload.maxUses = Number(maxUses);
    if (startsAt.trim()) payload.startsAt = startsAt;
    if (expiresAt.trim()) payload.expiresAt = expiresAt;
    if (minNights.trim()) payload.minNights = Number(minNights);
    if (maxNights.trim()) payload.maxNights = Number(maxNights);
    payload.appliesTo = appliesTo.trim() || null;

    try {
      const res = await fetch("/api/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data?.error?.message ?? "Failed to create promo code";
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Promo code created");
      setCode("");
      setValue("");
      setApplicableLabel("");
      setMaxUses("");
      setStartsAt("");
      setExpiresAt("");
      setMinNights("");
      setMaxNights("");
      setAppliesTo("");
      setIsActive(true);
      await load();
    } catch {
      toast.error("Failed to create promo code");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...promos].sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(
        String(a.createdAt ?? "")
      )
    );
  }, [promos]);

  return (
    <AdminLayout
      title="Promo Codes"
      description="Create and manage discount codes."
    >
      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("code")}
            className={`pb-2 px-1 font-medium transition-colors ${
              tab === "code"
                ? "text-gold border-b-2 border-gold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Code-Based Promos
          </button>

          <button
            type="button"
            onClick={() => setTab("global")}
            className={`pb-2 px-1 font-medium transition-colors ${
              tab === "global"
                ? "text-gold border-b-2 border-gold"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Global Flat Discount
          </button>
        </div>

        {tab === "code" ? (
          <div>
            {/* Form */}
            <form
              onSubmit={submit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            >
              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Code
                </label>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="SAVE10"
                />
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as "PERCENT" | "FLAT")
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                >
                  <option value="PERCENT">Percent (%)</option>
                  <option value="FLAT">Flat (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Value
                </label>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  type="number"
                  min={0}
                  step={type === "PERCENT" ? 1 : 0.01}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder={type === "PERCENT" ? "10" : "500"}
                />
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Offer Applies To
                </label>
                <input
                  value={applicableLabel}
                  onChange={(e) => setApplicableLabel(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="e.g. 1 night / 2 nights / weekend stay"
                />
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Offer Applies To (New)
                </label>
                <select
                  value={appliesTo}
                  onChange={(e) => setAppliesTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                >
                  <option value="">Any Stay</option>
                  <option value="1 night">1 night</option>
                  <option value="2 nights">2 nights</option>
                  <option value="3 nights">3 nights</option>
                  <option value="4 nights">4 nights</option>
                  <option value="5 nights">5 nights</option>
                  <option value="6 nights">6 nights</option>
                  <option value="7 nights">7 nights</option>
                  <option value="weekend stay">Weekend Stay</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Max uses
                </label>
                <input
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="100"
                />
              </div>
              
              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Min Nights (optional)
                </label>
                <input
                  value={minNights}
                  onChange={(e) => setMinNights(e.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-gray-800 font-medium mb-2">
                  Max Nights (optional)
                </label>
                <input
                  value={maxNights}
                  onChange={(e) => setMaxNights(e.target.value)}
                  type="number"
                  min={0}
                  step={1}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="2"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2 text-gray-800/80">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span>Active</span>
                </label>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-full font-semibold bg-gold text-gray-800 hover:bg-bronze transition-colors"
                >
                  Create Promo
                </button>
              </div>
            </form>

            {/* Table */}
            {loading ? (
              <div className="text-gray-800/70">Loading…</div>
            ) : sorted.length === 0 ? (
              <div className="text-gray-800/70">
                No promo codes found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="text-gray-800/60 text-sm">
                      <th className="py-3 pr-4">Code</th>
                      <th className="py-3 pr-4">Type</th>
                      <th className="py-3 pr-4">Value</th>
                      <th className="py-3 pr-4">Applies To</th>
                      <th className="py-3 pr-4">Nights (Min-Max)</th>
                      <th className="py-3 pr-4">Uses</th>
                      <th className="py-3 pr-4">Active</th>
                      <th className="py-3">Action</th>
                      <th className="py-3">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-gold/10"
                      >
                        <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">
                          {p.code}
                        </td>
                        <td className="py-3 pr-4 text-gray-800/80">
                          {p.type}
                        </td>
                        <td className="py-3 pr-4 text-gray-800/80">
                          {p.type === "PERCENT"
                            ? `${p.value}%`
                            : `₹${p.value}`}
                        </td>
                        <td className="py-3 pr-4 text-gray-800/80">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gold">{p.appliesTo}</span>
                            <span className="text-xs text-gray-500">{p.applicableLabel}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-800/80 text-sm">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Any"
                              defaultValue={p.minNights ?? ''}
                              className="w-14 px-1 py-1 rounded border border-gold/20 text-xs text-center bg-ivory/50 focus:border-gold focus:outline-none"
                              onBlur={async (e) => {
                                const val = e.target.value.trim();
                                const newMin = val === '' ? null : Number(val);
                                if (newMin === (p.minNights ?? null)) return;
                                try {
                                  const res = await fetch(`/api/promos/${encodeURIComponent(p.id)}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ minNights: newMin }),
                                  });
                                  if (res.ok) { toast.success('Min nights updated'); await load(); }
                                  else toast.error('Failed to update');
                                } catch { toast.error('Failed to update'); }
                              }}
                            />
                            <span className="text-gray-400">–</span>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="Any"
                              defaultValue={p.maxNights ?? ''}
                              className="w-14 px-1 py-1 rounded border border-gold/20 text-xs text-center bg-ivory/50 focus:border-gold focus:outline-none"
                              onBlur={async (e) => {
                                const val = e.target.value.trim();
                                const newMax = val === '' ? null : Number(val);
                                if (newMax === (p.maxNights ?? null)) return;
                                try {
                                  const res = await fetch(`/api/promos/${encodeURIComponent(p.id)}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify({ maxNights: newMax }),
                                  });
                                  if (res.ok) { toast.success('Max nights updated'); await load(); }
                                  else toast.error('Failed to update');
                                } catch { toast.error('Failed to update'); }
                              }}
                            />
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-800/80">
                          {String(p.usedCount ?? 0)}
                          {p.maxUses != null
                            ? ` / ${p.maxUses}`
                            : ""}
                        </td>
                        <td className="py-3 pr-4 text-gray-800/80">
                          {p.isActive ? "YES" : "NO"}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => toggleActive(p)}
                            className="px-4 py-2 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors"
                          >
                            {p.isActive ? "Disable" : "Enable"}
                          </button>
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => deletePromo(p.id)}
                            className="p-2 rounded-full border border-gold/20 text-gray-800/80 hover:bg-gold/10 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <GlobalFlatPromo />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPromoCodes;