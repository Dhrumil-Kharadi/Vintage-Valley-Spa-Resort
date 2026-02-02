import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useMemo, useState } from "react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  status: "UNREAD" | "READ";
  createdAt: string;
};

const AdminInquiries = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const unreadCount = useMemo(() => inquiries.filter((i) => i.status === "UNREAD").length, [inquiries]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/inquiries", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load inquiries");
      setInquiries(data?.data?.inquiries ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to mark as read");
      const updated = data?.data?.inquiry;
      if (updated?.id) {
        setInquiries((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      } else {
        await load();
      }
    } catch (e: any) {
      alert(e?.message ?? "Failed to mark as read");
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <AdminLayout title="Inquiries" description="Reservation inquiries submitted from the Contact page.">
      <div className="bg-white rounded-3xl p-8 luxury-shadow">
        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : inquiries.length === 0 ? (
          <div className="text-gray-800/70">No inquiries yet.</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-gray-800/70 text-sm">Unread: {unreadCount}</div>
              <button
                type="button"
                onClick={load}
                className="px-4 py-2 rounded-full bg-gray-800 text-ivory hover:bg-gray-800/90 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {inquiries.map((i) => (
                <div key={i.id} className="border border-gold/10 rounded-3xl p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-gray-800 font-semibold">{i.name}</div>
                      <div className="text-gray-800/70 text-sm">{i.email}{i.phone ? ` • ${i.phone}` : ""}</div>
                      <div className="text-gray-800/60 text-xs mt-1">{new Date(i.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {i.status === "UNREAD" ? (
                        <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">UNREAD</div>
                      ) : (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">READ</div>
                      )}
                      {i.status === "UNREAD" && (
                        <button
                          type="button"
                          onClick={() => markRead(i.id)}
                          disabled={markingId === i.id}
                          className="px-4 py-2 rounded-full bg-gold text-gray-800 hover:bg-bronze transition-colors text-sm disabled:opacity-60"
                        >
                          {markingId === i.id ? "Marking…" : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 whitespace-pre-wrap text-gray-800/80 text-sm">{i.message}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInquiries;
