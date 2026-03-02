import { useState, useEffect } from 'react';
import axios from 'axios';

interface GlobalFlatPromo {
  id: string;
  discountValue: number;
  isGlobalActive: boolean;
}

export default function GlobalFlatPromo() {
  const [promos, setPromos] = useState<GlobalFlatPromo[]>([]);
  const [discountValue, setDiscountValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchPromos = async () => {
    try {
      const res = await axios.get('/api/admin/promos?scope=GLOBAL_FLAT', { withCredentials: true });
      setPromos(res.data.promos || []);
    } catch (err) {
      console.error('Failed to fetch promos', err);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreate = async () => {
    if (!discountValue || Number(discountValue) <= 0) {
      setMessage('Enter a valid discount amount');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/admin/promos', {
        promoScope: 'GLOBAL_FLAT',
        discountValue: Number(discountValue),
        isGlobalActive: false,
      }, { withCredentials: true });
      setMessage('Global flat promo created');
      setDiscountValue('');
      fetchPromos();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to create promo');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    if (isActive) {
      // Deactivating: just toggle this one
      try {
        await axios.patch(`/api/admin/promos/${id}`, { isGlobalActive: false }, { withCredentials: true });
        setMessage('Promo deactivated');
        fetchPromos();
      } catch (err: any) {
        setMessage(err?.response?.data?.message || 'Failed to deactivate promo');
      }
    } else {
      // Activating: deactivate all others first, then activate this one
      try {
        // Deactivate all global flat promos
        await Promise.all(promos.map(p =>
          axios.patch(`/api/admin/promos/${p.id}`, { isGlobalActive: false }, { withCredentials: true })
        ));
        // Activate this one
        await axios.patch(`/api/admin/promos/${id}`, { isGlobalActive: true }, { withCredentials: true });
        setMessage('Promo activated (others deactivated)');
        fetchPromos();
      } catch (err: any) {
        setMessage(err?.response?.data?.message || 'Failed to activate promo');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo?')) return;
    try {
      await axios.delete(`/api/admin/promos/${id}`, { withCredentials: true });
      setMessage('Promo deleted');
      fetchPromos();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Failed to delete promo');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Global Flat Discount Management</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Create New Global Flat Promo</h2>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Discount amount (₹)"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
        {message && <div className="mt-2 text-sm text-gray-600">{message}</div>}
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold p-4 border-b">Existing Global Flat Promos</h2>
        {promos.length === 0 ? (
          <div className="p-4 text-gray-500">No global flat promos found.</div>
        ) : (
          <ul className="divide-y">
            {promos.map((promo) => (
              <li key={promo.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">₹{promo.discountValue} OFF</div>
                  <div className={`text-sm ${promo.isGlobalActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {promo.isGlobalActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(promo.id, promo.isGlobalActive)}
                    className={`px-3 py-1 rounded text-sm ${
                      promo.isGlobalActive
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {promo.isGlobalActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
