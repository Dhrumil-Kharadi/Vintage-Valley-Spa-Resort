import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";

const AdminUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/admin-api/users", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load users");
        setUsers(data?.data?.users ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <AdminLayout title="Users" description="Manage registered users.">
      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        {error && (
          <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-800/70">Loading…</div>
        ) : users.length === 0 ? (
          <div className="text-gray-800/70">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="text-gray-800/60 text-sm">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Phone</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-gold/10">
                    <td className="py-3 pr-4 font-medium text-gray-800">{u.name}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{u.email}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{u.phone ?? "—"}</td>
                    <td className="py-3 pr-4 text-gray-800/80">{u.role}</td>
                    <td className="py-3 text-gray-800/70 text-sm">
                      {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
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

export default AdminUsers;
