import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Trash2 } from "lucide-react";

type Promo = {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: string;
  isActive: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  usedCount?: number;
  createdAt?: string;
};

const AdminPromoCodes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);

  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [startsAt, setStartsAt] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isActive, setIsActive] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promos", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load promo codes");
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

    const ok = window.confirm("Delete this promo code? This cannot be undone.");
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

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...promos].sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
  }, [promos]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: any = {
      code: code.trim(),
      type,
      value: Number(value),
      isActive,
    };

    if (maxUses.trim()) payload.maxUses = Number(maxUses);
    if (startsAt.trim()) payload.startsAt = startsAt;
    if (expiresAt.trim()) payload.expiresAt = expiresAt;

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
      setMaxUses("");
      setStartsAt("");
      setExpiresAt("");
      setIsActive(true);
      await load();
    } catch {
      toast.error("Failed to create promo code");
    }
  };

  const toggleActive = async (p: Promo) => {
    try {
      const res = await fetch(`/api/promos/${encodeURIComponent(p.id)}/active`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !p.isActive }),
      });
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

  return (
    <AdminLayout title="Promo Codes" description="Create and manage discount codes.">
      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        {error && <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>}

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-gray-800 font-medium mb-2">Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} required className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50" placeholder="SAVE10" />
          </div>

          <div>
            <label className="block text-gray-800 font-medium mb-2">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50">
              <option value="PERCENT">Percent (%)</option>
              <option value="FLAT">Flat (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-800 font-medium mb-2">Value</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} required type="number" min={0} step={type === "PERCENT" ? 1 : 0.01} className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50" placeholder={type === "PERCENT" ? "10" : "500"} />
          </div>

          <div>
            <label className="block text-gray-800 font-medium mb-2">Max uses (optional)</label>
            <input value={maxUses} onChange={(e) => setMaxUses(e.target.value)} type="number" min={0} step={1} className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50" placeholder="100" />
          </div>

          <div>
            <label className="block text-gray-800 font-medium mb-2">Starts at (optional)</label>
            <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="datetime-local" className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50" />
          </div>

          <div>
            <label className="block text-gray-800 font-medium mb-2">Expires at (optional)</label>
            <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="datetime-local" className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50" />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-4">
            <label className="inline-flex items-center gap-2 text-gray-800/80">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span>Active</span>
            </label>
            <button type="submit" className="px-6 py-3 rounded-full font-semibold bg-gold text-gray-800 hover:bg-bronze transition-colors">Create Promo</button>
          </div>
        </form>

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : sorted.length === 0 ? (
          <div className="text-gray-800/70">No promo codes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="text-gray-800/60 text-sm">
                  <th className="py-3 pr-4">Code</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Value</th>
                  <th className="py-3 pr-4">Uses</th>
                  <th className="py-3 pr-4">Active</th>
                  <th className="py-3">Action</th>
                  <th className="py-3">Delete</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr key={p.id} className="border-t border-gold/10">
                    <td className="py-3 pr-4 font-mono text-xs text-gray-800/80">{p.code}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{p.type}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{p.type === "PERCENT" ? `${p.value}%` : `₹${p.value}`}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{String(p.usedCount ?? 0)}{p.maxUses != null ? ` / ${p.maxUses}` : ""}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{p.isActive ? "YES" : "NO"}</td>
                    <td className="py-3">
                      <button type="button" onClick={() => toggleActive(p)} className="px-4 py-2 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors">
                        {p.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => deletePromo(p.id)}
                        className="p-2 rounded-full border border-gold/20 text-gray-800/80 hover:bg-gold/10 transition-colors"
                        title="Delete promo"
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
    </AdminLayout>
  );
};

export default AdminPromoCodes;
