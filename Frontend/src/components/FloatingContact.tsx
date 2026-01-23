
import { Phone, MessageCircle } from 'lucide-react';

const FloatingContact = () => {
  const handleCall = () => {
    window.open('tel:+919371179888', '_self');
  };

  const handleWhatsApp = () => {
    window.open('https://wa.me/919371179888', '_blank');
  };

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      <button
        onClick={handleWhatsApp}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        aria-label="Contact via WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      <button
        onClick={handleCall}
        className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110"
        aria-label="Call us"
      >
        <Phone className="h-6 w-6" />
      </button>
    </div>
  );
};

export default FloatingContact;
