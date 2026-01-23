import { ChevronDown, Play } from 'lucide-react';
import { useState } from 'react';

const Hero = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Multiple Background Layers for Depth */}
      <div className="absolute inset-0">
        {/* Video Background */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/images/room/VN20250720_201334.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-32 h-32 bg-teal-300/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-cyan-400/20 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 text-center text-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Headlines with Stagger Animation */}
        <div className="space-y-4 mb-8">
          <h1 className="font-playfair text-6xl md:text-8xl font-bold text-white animate-slide-up">
            Vintage Valley
          </h1>
          <h2 className="font-playfair text-3xl md:text-5xl font-light text-white animate-slide-up delay-200">
            Spa Resort
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto animate-fade-in delay-500"></div>
        </div>

        {/* Enhanced Description */}
        <p className="text-xl md:text-2xl font-light mb-12 text-white max-w-3xl mx-auto leading-relaxed animate-fade-in delay-700">
          Where luxury meets serenity in the heart of Igatpuri's pristine landscapes. 
          <span className="block mt-2 text-white font-vibes text-2xl">Experience the extraordinary</span>
        </p>
        
        {/* Interactive CTA Section */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in delay-1000">
          <button className="group relative bg-transparent border-2 border-white text-white px-10 py-4 rounded-full font-semibold text-lg overflow-hidden transition-all duration-500 transform hover:scale-105 hover:bg-white/10 hover:text-white">
            <span className="relative z-10">Reserve Your Escape</span>
          </button>
          
          <button className="text-white px-8 py-4 rounded-full font-medium text-lg border border-white/30 hover:bg-white/5 hover:text-white transition-all duration-300 backdrop-blur-sm">
            View Our Suites
          </button>
        </div>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-white/30 opacity-60"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-white/30 opacity-60"></div>
    </section>
  );
};

export default Hero;
