import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const getUserName = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      const user = JSON.parse(raw);
      return typeof user?.name === 'string' ? user.name : null;
    } catch {
      return null;
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((v) => !v);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
    } finally {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
      setUserName(null);
      setIsMobileMenuOpen(false);
      setIsProfileMenuOpen(false);
      navigate('/');
    }
  };

  useEffect(() => {
    setUserName(getUserName());

    const syncFromCookie = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const name = data?.data?.user?.name;
        if (typeof name === 'string' && name.trim()) {
          localStorage.setItem('user', JSON.stringify({ name }));
          window.dispatchEvent(new Event('storage'));
          setUserName(name);
        }
      } catch {
        // ignore
      }
    };
    syncFromCookie();

    const handleStorage = () => setUserName(getUserName());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!isProfileMenuOpen) return;
      const el = profileMenuRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setIsProfileMenuOpen(false);
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('touchstart', onPointerDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('touchstart', onPointerDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'Tariff', path: '/tariff' },
    { name: 'Facilities', path: '/facilities' },
    { name: 'Attractions', path: '/attractions' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Book Now', path: '/rooms' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-luxury-shadow' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 sm:h-10 sm:w-10 flex items-center justify-center rounded-full overflow-hidden">
              <img 
                src="/favicon.png" 
                alt="Vintage Valley Resort Logo" 
                className="h-full w-full object-contain"
                style={{ 
                  backgroundColor: 'transparent',
                  mixBlendMode: 'multiply'
                }}
              />
            </div>
            <div className={`font-playfair text-lg sm:text-2xl font-bold ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
              Vintage Valley
            </div>
            <div className={`font-vibes text-base sm:text-lg ${isScrolled ? 'text-gold' : 'text-white'}`}>Resort</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 sm:space-x-8">
            {navLinks.map((link) => (
              link.name === 'Book Now' ? (
                <Link
                  key={`${link.path}:${link.name}`}
                  to={link.path}
                  className={`px-5 py-2.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-200 border border-gold/30 shadow-sm hover:shadow-md active:scale-[0.99] ${
                    isScrolled ? 'bg-gold text-gray-800 hover:bg-bronze' : 'bg-gold text-gray-800 hover:bg-bronze'
                  }`}
                >
                  {link.name}
                </Link>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`font-medium transition-colors duration-200 ${
                    location.pathname === link.path
                      ? 'text-gold border-b-2 border-gold'
                      : isScrolled ? 'text-gray-800 hover:text-gold' : 'text-white hover:text-gold'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
            {!userName ? (
              <Link
                to="/login"
                className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base hover:bg-bronze transition-colors duration-200 ${isScrolled ? 'bg-gold text-gray-800' : 'bg-gold text-gray-800'}`}
              >
                Login
              </Link>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={toggleProfileMenu}
                  className="h-10 w-10 rounded-full bg-gold text-gray-800 flex items-center justify-center font-bold hover:bg-bronze transition-colors duration-200"
                  aria-label="Open profile menu"
                  aria-haspopup="menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  {userName.trim().charAt(0).toUpperCase()}
                </button>
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44">
                    <div className="bg-white rounded-2xl shadow-luxury-shadow border border-gold/20 overflow-hidden">
                      <button
                        type="button"
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gold/10 transition-colors duration-200"
                        role="menuitem"
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gold/10 transition-colors duration-200"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className={`h-6 w-6 ${isScrolled ? 'text-gray-800' : 'text-white'}`} />
            ) : (
              <Menu className={`h-6 w-6 ${isScrolled ? 'text-gray-800' : 'text-white'}`} />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gold/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                link.name === 'Book Now' ? (
                  <Link
                    key={`${link.path}:${link.name}`}
                    to={link.path}
                    className="block w-full px-4 py-3 rounded-full font-semibold text-base bg-gold text-gray-800 hover:bg-bronze transition-colors duration-200 text-center mt-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                      location.pathname === link.path
                        ? 'text-gold bg-gold/10'
                        : 'text-gray-800 hover:text-gold hover:bg-gold/5'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              {!userName ? (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full mt-4 px-4 py-3 rounded-full font-medium text-base bg-gold text-gray-800 hover:bg-bronze transition-colors duration-200 text-center"
                >
                  Login
                </Link>
              ) : (
                <div className="space-y-3 mt-4">
                  <button
                    type="button"
                    onClick={handleProfileClick}
                    className="w-full px-4 py-3 rounded-full font-medium text-base bg-gold text-gray-800 hover:bg-bronze transition-colors duration-200"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-full font-medium text-base border-2 border-gold/30 text-gray-800 hover:bg-gold/10 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
