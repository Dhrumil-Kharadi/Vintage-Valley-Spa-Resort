
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingContact from '@/components/FloatingContact';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: '2',
    roomType: 'deluxe',
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const meta = [
        formData.checkIn ? `Check-in: ${formData.checkIn}` : null,
        formData.checkOut ? `Check-out: ${formData.checkOut}` : null,
        formData.guests ? `Guests: ${formData.guests}` : null,
        formData.roomType ? `Room type: ${formData.roomType}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const message = [meta, String(formData.message ?? "").trim()].filter((s) => String(s).trim()).join("\n\n");

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          message,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to send inquiry');

      setSubmitSuccess('Inquiry sent successfully. Our team will contact you soon.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        checkIn: '',
        checkOut: '',
        guests: '2',
        roomType: 'deluxe',
        message: ''
      });
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory">
      <Navbar />
      <FloatingContact />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-gray-800 to-gray-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold text-ivory mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-ivory/80 max-w-2xl mx-auto">
            Let us help you plan your perfect escape to luxury and tranquility
          </p>
        </div>
      </section>

      {/* Contact Information & Form */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div>
            <h2 className="font-playfair text-4xl font-bold text-gray-800 mb-8">
              Get in Touch
            </h2>
            <p className="text-gray-800/80 text-lg leading-relaxed mb-8">
              Our dedicated team is here to assist you with reservations, special requests, 
              and any questions about your upcoming stay at Vintage Valley Resort.
            </p>

            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-start space-x-4">
                <div className="bg-gold/20 rounded-full p-3">
                  <Phone className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Phone Numbers</h3>
                  <p className="text-gray-800/80">+91 9371179888</p>
                  <p className="text-gray-800/80">+91 9371169888</p>
                  <p className="text-gray-800/60 text-sm mt-1">Available 24/7 for reservations</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-4">
                <div className="bg-gold/20 rounded-full p-3">
                  <Mail className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
                  <p className="text-gray-800/80">vintagevalleyresort@gmail.com</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start space-x-4">
                <div className="bg-gold/20 rounded-full p-3">
                  <MapPin className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Location & Directions</h3>
                  <p className="text-gray-800/80 font-medium">Vintage Valley Spa Resort</p>
                  <p className="text-gray-800/80">Mumbai - Nashik Expy, opp. Parveen Industry, Talegaon, Igatpuri, Maharashtra 422402</p>
                  <div className="mt-3 text-sm text-gray-800/70">
                    <p><strong>From Mumbai:</strong> Take NH-3 towards Nashik, exit at Igatpuri (120 km, 2.5 hours)</p>
                    <p><strong>From Pune:</strong> Via NH-50 to Nashik, then to Igatpuri (180 km, 3 hours)</p>
                    <p><strong>From Nashik:</strong> Take Igatpuri Road via NH04 (45 km, 1.5 hours)</p>
                    <p><strong>From Samrudhi:</strong> Take the Samruddhi Mahamarg and exist towards Igatpuri,and follow signs to vintage valley spa resort.</p>
                    <p><strong>Nearest Railway:</strong> Igatpuri Station (2.5 km, 7 Minutes)</p>
                    <p><strong>Mumbai Airport:</strong> Mumbai Airport (120 km)</p>
                    <p><strong>Nashik Airport:</strong> Nashik Airport (61 km)</p>
                  </div>
                </div>
              </div>

              {/* Timings */}
              <div className="flex items-start space-x-4">
                <div className="bg-gold/20 rounded-full p-3">
                  <Clock className="h-6 w-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Check-in/out Times</h3>
                  <p className="text-gray-800/80">Check-in: 1:00 PM</p>
                  <p className="text-gray-800/80">Check-out: 11:00 AM</p>
                  <p className="text-gray-800/60 text-sm mt-1">Early/late requests welcomed</p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <a
                href="tel:+919371179888"
                className="bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Phone className="h-4 w-4" />
                <span>Call Now</span>
              </a>
              <a
                href="https://wa.me/919371179888"
                target="_blank"
                rel="noopener noreferrer"
                className="border-2 border-gray-800 text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-gray-800 hover:text-ivory transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-3xl p-8 luxury-shadow">
            <h3 className="font-playfair text-3xl font-bold text-gray-800 mb-6">
              Reservation Inquiry
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="bg-gold/10 border border-gold/20 text-gray-800 px-4 py-3 rounded-2xl">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-2xl">
                  {submitSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-gray-800 font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-800 font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-gray-800 font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkIn" className="block text-gray-800 font-medium mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    id="checkIn"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>
                <div>
                  <label htmlFor="checkOut" className="block text-gray-800 font-medium mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    id="checkOut"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="guests" className="block text-gray-800 font-medium mb-2">
                    Number of Guests *
                  </label>
                  <select
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  >
                    <option value="1">1 Guest</option>
                    <option value="2">2 Guests</option>
                    <option value="3">3 Guests</option>
                    <option value="4">4 Guests</option>
                    <option value="5+">5+ Guests</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="roomType" className="block text-gray-800 font-medium mb-2">
                    Room Type *
                  </label>
                  <select
                    id="roomType"
                    name="roomType"
                    value={formData.roomType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50"
                  >
                    <option value="deluxe">Deluxe Studio Suite</option>
                    <option value="family">Lotus Family Suite</option>
                    <option value="presidential">Presidential Suite</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-gray-800 font-medium mb-2">
                  Special Requests or Questions
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gold/20 focus:border-gold focus:outline-none transition-colors bg-ivory/50 resize-none"
                  placeholder="Any special requests, dietary requirements, or questions..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-gold to-bronze text-gray-800 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>{submitting ? 'Sending…' : 'Send Inquiry'}</span>
              </button>
            </form>

            <p className="text-gray-800/60 text-sm mt-4 text-center">
              
            </p>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-4xl font-bold text-gray-800 mb-6">
              Find Us in Paradise
            </h2>
            <p className="text-xl text-gray-800/80 max-w-2xl mx-auto">
              Located in the serene hills of Igatpuri, just 2 hours from Mumbai
            </p>
          </div>

          <div className="bg-gold/5 rounded-3xl p-8 border border-gold/20">
            <div className="aspect-video bg-gold/10 rounded-2xl flex items-center justify-center overflow-hidden">
              {/* Embedded Google Map */}
              <iframe
                title="Vintage Valley Spa Resort Map"
                src="https://www.google.com/maps?q=Vintage+Valley+Spa+Resort+Igatpuri&hl=en&z=15&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full rounded-2xl border-none"
              ></iframe>
            </div>
            <div className="text-center mt-6">
              <a
                href="https://maps.google.com/?q=Vintage+Valley+Spa+Resort+Igatpuri"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold text-gray-800 px-6 py-3 rounded-full font-semibold hover:bg-bronze transition-colors duration-200 inline-block"
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
