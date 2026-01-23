import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
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
  };

  useEffect(() => {
    setUserName(getUserName());

    const handleStorage = () => setUserName(getUserName());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
    { name: 'Contact', path: '/contact' },
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
            ))}
            {!userName ? (
              <Link
                to="/login"
                className={`px-4 sm:px-6 py-2 rounded-full font-medium text-sm sm:text-base hover:bg-bronze transition-colors duration-200 ${isScrolled ? 'bg-gold text-gray-800' : 'bg-gold text-gray-800'}`}
              >
                Login
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleProfileClick}
                className="h-10 w-10 rounded-full bg-gold text-gray-800 flex items-center justify-center font-bold hover:bg-bronze transition-colors duration-200"
                aria-label="Go to profile"
              >
                {userName.trim().charAt(0).toUpperCase()}
              </button>
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
                <button
                  type="button"
                  onClick={handleProfileClick}
                  className="w-full mt-4 px-4 py-3 rounded-full font-medium text-base bg-gold text-gray-800 hover:bg-bronze transition-colors duration-200"
                >
                  Profile
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
