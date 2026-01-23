
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter } from 'lucide-react';
import { useState } from 'react';
import PolicyModals from './PolicyModals';

const Footer = () => {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  return (
    <footer className="bg-gray-800 text-ivory">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-2 sm:mb-4">
              <div className="font-playfair text-lg sm:text-2xl font-bold text-ivory">
                Vintage Valley
              </div>
              <div className="font-vibes text-gold text-base sm:text-lg">Resort</div>
            </div>
            <p className="text-ivory/80 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
              Experience luxury nestled in nature at Igatpuri's most exclusive retreat. 
              Where modern elegance meets serene wilderness.
            </p>
            <div className="flex space-x-4 mb-4">
              <a href="https://www.facebook.com/profile.php?id=61559427784120" className="text-gold hover:text-ivory transition-colors duration-200">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/vintagevalleyresort.igatpuri" className="text-gold hover:text-ivory transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gold hover:text-ivory transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-playfair text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gold">Quick Links</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <a href="/rooms" className="text-ivory/80 hover:text-gold transition-colors duration-200">Rooms & Suites</a>
              </li>
              <li>
                <a href="/facilities" className="text-ivory/80 hover:text-gold transition-colors duration-200">Facilities</a>
              </li>
              <li>
                <a href="/tariff" className="text-ivory/80 hover:text-gold transition-colors duration-200">Tariff</a>
              </li>
              
              <li>
                <a href="/gallery" className="text-ivory/80 hover:text-gold transition-colors duration-200">Gallery</a>
              </li>
              <li>
                <a href="/attractions" className="text-ivory/80 hover:text-gold transition-colors duration-200">Nearby Attractions</a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-playfair text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gold">Services</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <span className="text-ivory/80 cursor-not-allowed opacity-60">Spa & Wellness <span className="text-xs text-gold">(Upcoming)</span></span>
              </li>
              <li>
                <a href="/facilities#valley-edge-pool" className="text-ivory/80 hover:text-gold transition-colors duration-200">Valley Edge Pool</a>
              </li>
              <li>
                <a href="/facilities#palatio-banquet" className="text-ivory/80 hover:text-gold transition-colors duration-200">Banquet Hall</a>
              </li>
              <li>
                <a href="/facilities#conference-hall" className="text-ivory/80 hover:text-gold transition-colors duration-200">Conference Room</a>
              </li>
              <li>
                <span className="text-ivory/80 cursor-not-allowed opacity-60">Cafe Vintage Bite <span className="text-xs text-gold">(Upcoming)</span></span>
              </li>
              <li>
                <a href="/facilities#fitness-studio" className="text-ivory/80 hover:text-gold transition-colors duration-200">Gym</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-playfair text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-gold">Contact Us</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gold mt-1" />
                <div>
                  <p className="text-ivory/80">+91 9371179888</p>
                  <p className="text-ivory/80">+91 9371169888</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gold mt-1" />
                <p className="text-ivory/80">vintagevalleyresort@gmail.com</p>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gold mt-1" />
                <p className="text-ivory/80">Mumbai - Nashik Expy, opp. Parveen Industry, Talegaon, Igatpuri, Maharashtra 422402.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-ivory/20 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
          <div className="flex justify-center space-x-4 mb-3">
            <button 
              onClick={() => setPrivacyOpen(true)} 
              className="text-ivory/60 text-xs sm:text-sm hover:text-gold transition-colors duration-200"
            >
              Privacy Policy
            </button>
            <span className="text-ivory/60">|</span>
            <button 
              onClick={() => setTermsOpen(true)} 
              className="text-ivory/60 text-xs sm:text-sm hover:text-gold transition-colors duration-200"
            >
              Terms & Conditions
            </button>
          </div>
          <p className="text-ivory/60 text-xs sm:text-sm">
            © 2024 Vintage Valley Spa Resort. All rights reserved. | Crafted with luxury in mind.
          </p>
        </div>
        
        {/* Policy Modals */}
        <PolicyModals 
          privacyOpen={privacyOpen}
          termsOpen={termsOpen}
          onPrivacyOpenChange={setPrivacyOpen}
          onTermsOpenChange={setTermsOpen}
        />
      </div>
    </footer>
  );
};

export default Footer;
