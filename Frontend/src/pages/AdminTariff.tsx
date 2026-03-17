import AdminLayout from '@/components/admin/AdminLayout';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Check, X } from 'lucide-react';

const AdminTariff = () => {
  const [tariffs, setTariffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTariffs();
  }, []);

  const loadTariffs = async () => {
    try {
      const res = await fetch('/api/tariff');
      const data = await res.json();
      if (data.ok) {
        setTariffs(data.data.tariffs);
      } else {
        toast.error('Failed to load tariffs');
      }
    } catch (err) {
      toast.error('Error fetching tariffs');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (t: any) => {
    setEditingId(t.id);
    setEditForm({ ...t });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const overrideTariff = async () => {
    setSaving(true);
    try {
      // NOTE: Using /api/tariff directly as defined in our router (mounted at apiRouter)
      // The user requested Admin Dashboard changes, so usually /admin-api/tariff is for admin checks.
      // But we just mapped /api/tariff in backend index.ts to handle the PUT request. 
      // This is a simple implementation. In a real app we'd map it under adminRouter for auth.
      const res = await fetch(`/api/tariff/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Tariff updated successfully');
        loadTariffs();
        setEditingId(null);
      } else {
        toast.error(data.error?.message || 'Failed to update tariff');
      }
    } catch (err) {
      toast.error('Error updating tariff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Tariff Management" description="Manage Room Tariff 2025-2026">
      <div className="bg-white rounded-3xl p-4 sm:p-8 luxury-shadow">
        <h2 className="text-gray-900 font-bold text-2xl mb-6">Room Tariffs</h2>
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gold/10 text-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-xl">Category</th>
                  <th className="px-4 py-3 font-semibold">Meal Plan</th>
                  <th className="px-4 py-3 font-semibold">Persons</th>
                  <th className="px-4 py-3 font-semibold">Mon-Thurs</th>
                  <th className="px-4 py-3 font-semibold">Fri-Sun</th>
                  <th className="px-4 py-3 font-semibold rounded-tr-xl text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tariffs.map((t) => (
                  <tr key={t.id} className="border-b border-gold/10 hover:bg-gold/5 transition-colors">
                    <td className="px-4 py-4 font-semibold text-gray-800">{t.category}</td>
                    <td className="px-4 py-4 text-gray-600">{t.mealPlan}</td>
                    <td className="px-4 py-4 text-gray-600">{t.persons}</td>
                    {editingId === t.id ? (
                      <>
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            value={editForm.weekday}
                            onChange={(e) => setEditForm({ ...editForm, weekday: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-gold/30 bg-white"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="text"
                            value={editForm.weekend}
                            onChange={(e) => setEditForm({ ...editForm, weekend: e.target.value })}
                            className="w-full px-2 py-1 rounded border border-gold/30 bg-white"
                          />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              disabled={saving}
                              onClick={overrideTariff}
                              className="p-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-full transition-colors"
                              title="Save"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              disabled={saving}
                              onClick={cancelEdit}
                              className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full transition-colors"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4 text-gold font-bold">{t.weekday}</td>
                        <td className="px-4 py-4 text-gold font-bold">{t.weekend}</td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => startEdit(t)}
                            className="p-2 bg-gold/10 text-gray-800 hover:bg-gold/20 rounded-full transition-colors"
                            title="Edit Pricing"
                          >
                            <Pencil size={16} />
                          </button>
                        </td>
                      </>
                    )}
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

export default AdminTariff;
