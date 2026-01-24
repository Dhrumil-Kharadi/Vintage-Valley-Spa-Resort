import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerNight, setPricePerNight] = useState<number>(0);
  const [imagesRaw, setImagesRaw] = useState("");
  const [amenitiesRaw, setAmenitiesRaw] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleLogout = async () => {
    try {
      await fetch("/admin-api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
    } finally {
      navigate("/login");
    }
  };

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
    } catch {
      setError("Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <section className="pt-24 pb-10 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-ivory">Admin Dashboard</h1>
              <p className="text-ivory/80 mt-2">Add rooms to your inventory.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="border-2 border-ivory/60 text-ivory px-6 py-3 rounded-full font-semibold hover:bg-ivory hover:text-gray-800 transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
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
      </section>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
