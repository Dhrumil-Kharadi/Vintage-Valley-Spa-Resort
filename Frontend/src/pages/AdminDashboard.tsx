import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useMemo, useState } from "react";

const AdminDashboard = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerNight, setPricePerNight] = useState<number>(0);
  const [imagesRaw, setImagesRaw] = useState("");
  const [amenitiesRaw, setAmenitiesRaw] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPricePerNight, setEditPricePerNight] = useState<number>(0);
  const [editImagesRaw, setEditImagesRaw] = useState("");
  const [editAmenitiesRaw, setEditAmenitiesRaw] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const loadRooms = async () => {
    setRoomsLoading(true);
    setRoomsError(null);
    try {
      const res = await fetch("/admin-api/rooms", { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to load rooms");
      setRooms(data?.data?.rooms ?? []);
    } catch (e: any) {
      setRoomsError(e?.message ?? "Failed to load rooms");
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const parsedImages = useMemo(() => {
    return imagesRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [imagesRaw]);

  const parsedAmenities = useMemo(() => {
    return amenitiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [amenitiesRaw]);

  const parsedEditImages = useMemo(() => {
    return editImagesRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [editImagesRaw]);

  const parsedEditAmenities = useMemo(() => {
    return editAmenitiesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [editAmenitiesRaw]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (parsedImages.length === 0) {
      setError("Please add at least one image URL (one per line). ");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/admin-api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          pricePerNight,
          images: parsedImages,
          amenities: parsedAmenities,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to create room");
        return;
      }

      setSuccess("Room created successfully");
      setTitle("");
      setDescription("");
      setPricePerNight(0);
      setImagesRaw("");
      setAmenitiesRaw("");

      await loadRooms();
    } catch {
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (room: any) => {
    setEditError(null);
    setEditingId(room.id);
    setEditTitle(room.title ?? "");
    setEditDescription(room.description ?? "");
    setEditPricePerNight(Number(room.pricePerNight ?? 0));
    setEditImagesRaw((room.images ?? []).join("\n"));
    setEditAmenitiesRaw((room.amenities ?? []).join(", "));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
    setEditLoading(false);
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    setEditError(null);

    if (parsedEditImages.length === 0) {
      setEditError("Please add at least one image URL (one per line). ");
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch(`/admin-api/rooms/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          pricePerNight: editPricePerNight,
          images: parsedEditImages,
          amenities: parsedEditAmenities,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setEditError(data?.error?.message ?? "Failed to update room");
        return;
      }

      await loadRooms();
      setEditingId(null);
    } catch {
      setEditError("Failed to update room");
    } finally {
      setEditLoading(false);
    }
  };

  const deleteRoom = async (id: number) => {
    const ok = window.confirm("Delete this room? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/admin-api/rooms/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setRoomsError(data?.error?.message ?? "Failed to delete room");
        return;
      }
      await loadRooms();
    } catch {
      setRoomsError("Failed to delete room");
    }
  };

  return (
    <AdminLayout title="Rooms" description="Add rooms to your inventory.">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <div className="bg-white rounded-3xl p-8 luxury-shadow">
            <h2 className="font-playfair text-3xl font-bold text-gray-800 mb-6">Add Room</h2>

            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-gray-800 font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="Deluxe Studio Suite"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-gray-800 font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="Room description..."
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-gray-800 font-medium mb-2">
                  Price Per Night
                </label>
                <input
                  type="number"
                  id="price"
                  value={Number.isFinite(pricePerNight) ? pricePerNight : 0}
                  onChange={(e) => setPricePerNight(Number(e.target.value))}
                  min={0}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="4500"
                />
              </div>

              <div>
                <label htmlFor="images" className="block text-gray-800 font-medium mb-2">
                  Image URLs (one per line)
                </label>
                <textarea
                  id="images"
                  value={imagesRaw}
                  onChange={(e) => setImagesRaw(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="/images/room-1.jpg\n/images/room-2.jpg"
                />
              </div>

              <div>
                <label htmlFor="amenities" className="block text-gray-800 font-medium mb-2">
                  Amenities (comma separated)
                </label>
                <input
                  type="text"
                  id="amenities"
                  value={amenitiesRaw}
                  onChange={(e) => setAmenitiesRaw(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="WiFi, Parking, Smart TV"
                />
              </div>

              {error && (
                <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{error}</div>
              )}
              {success && (
                <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{success}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-3xl p-8 luxury-shadow">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="font-playfair text-3xl font-bold text-gray-800">Rooms</h2>
              <button
                type="button"
                onClick={loadRooms}
                className="px-4 py-2 rounded-full border-2 border-gold/20 text-gray-800 hover:bg-gold/10 transition-colors"
              >
                Refresh
              </button>
            </div>

            {roomsError && (
              <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl mb-4">{roomsError}</div>
            )}

            {roomsLoading ? (
              <div className="text-gray-800/70">Loading…</div>
            ) : rooms.length === 0 ? (
              <div className="text-gray-800/70">No rooms found.</div>
            ) : (
              <div className="space-y-4">
                {rooms.map((r) => (
                  <div key={r.id} className="border border-gold/10 rounded-3xl p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-playfair text-2xl font-bold text-gray-800">{r.title}</div>
                        <div className="text-gray-800/70 text-sm mt-1">₹{r.pricePerNight} / night • #{r.id}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(r)}
                          className="px-4 py-2 rounded-full bg-gold text-gray-800 font-semibold hover:bg-bronze transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRoom(r.id)}
                          className="px-4 py-2 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="text-gray-800/80 mt-3 line-clamp-3">{r.description}</div>

                    {editingId === r.id && (
                      <div className="mt-5 bg-ivory/60 rounded-3xl p-5 border border-gold/10">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-gray-800 font-medium mb-2">Title</label>
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-800 font-medium mb-2">Description</label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-800 font-medium mb-2">Price Per Night</label>
                            <input
                              type="number"
                              value={Number.isFinite(editPricePerNight) ? editPricePerNight : 0}
                              onChange={(e) => setEditPricePerNight(Number(e.target.value))}
                              min={0}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-800 font-medium mb-2">Image URLs (one per line)</label>
                            <textarea
                              value={editImagesRaw}
                              onChange={(e) => setEditImagesRaw(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-gray-800 font-medium mb-2">Amenities (comma separated)</label>
                            <input
                              value={editAmenitiesRaw}
                              onChange={(e) => setEditAmenitiesRaw(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-white"
                            />
                          </div>

                          {editError && (
                            <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">{editError}</div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={saveEdit}
                              disabled={editLoading}
                              className="px-6 py-3 rounded-full bg-gold text-gray-800 font-semibold hover:bg-bronze transition-colors disabled:opacity-60"
                            >
                              {editLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-6 py-3 rounded-full border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
