import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMemo } from 'react';

const Profile = () => {
  const userName = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      return typeof user?.name === 'string' ? user.name : null;
    } catch {
      return null;
    }
  }, []);

  const initial = (userName ?? 'Yagna').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />

      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory">
            Profile
          </h1>
          <p className="text-xl text-ivory/80 max-w-2xl mt-4">
            Manage your account and bookings.
          </p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl p-8 luxury-shadow flex items-center gap-6">
            <div className="h-16 w-16 rounded-full bg-gold text-gray-800 flex items-center justify-center font-bold text-2xl">
              {initial}
            </div>
            <div>
              <div className="text-gray-800/60">Signed in as</div>
              <div className="text-2xl font-bold text-gray-800">
                {userName ?? 'Yagna'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Profile;
