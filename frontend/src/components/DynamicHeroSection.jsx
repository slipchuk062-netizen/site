import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { MapPin, TrendingUp, Users, Sparkles } from 'lucide-react';

const DynamicHeroSection = ({ attractionsCount }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Реальні фото Житомира та області (високої якості)
  const zhytomyrImages = [
    'https://customer-assets.emergentagent.com/job_geodatahub/artifacts/k5aipgcz_2.jpg',
    'https://customer-assets.emergentagent.com/job_geodatahub/artifacts/xzj86o6h_3.jpg',
    'https://customer-assets.emergentagent.com/job_geodatahub/artifacts/u0lq4r38_4.jpg',
    'https://customer-assets.emergentagent.com/job_geodatahub/artifacts/bt8vwg1v_5.jpg',
    'https://customer-assets.emergentagent.com/job_geodatahub/artifacts/cij6a3q1_6.jpg',
  ];

  useEffect(() => {
    // Preload першого фото
    const img = new Image();
    img.src = zhytomyrImages[0];
    img.onload = () => setIsLoaded(true);

    // Зміна фото кожні 5 секунд
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % zhytomyrImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic Photo Background */}
      <div className="absolute inset-0 z-0">
        {zhytomyrImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImageIndex && isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ 
              backgroundImage: `url(${image})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover'
            }}
          />
        ))}
        
        {/* Dark overlay для читабельності */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900/80"></div>
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-radial-gradient opacity-50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in-up">
          {/* Coat of Arms */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-30 rounded-full"></div>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Coat_of_Arms_of_Zhytomyr_Oblast.svg"
                alt="Герб Житомирської області"
                className="relative h-28 w-28 drop-shadow-2xl animate-float"
                onError={(e) => {
                  e.target.style.display = 'none';
                  console.error('Failed to load coat of arms');
                }}
              />
            </div>
          </div>
          
          {/* Badge */}
          <Badge className="mb-6 bg-emerald-600/90 backdrop-blur-sm text-white border-emerald-400/50 text-lg px-6 py-2 shadow-xl">
            <Sparkles className="h-5 w-5 mr-2 inline animate-pulse" />
            Житомирська область
          </Badge>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-2xl">
            Відкрийте для себе
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Житомирщину
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-lg leading-relaxed">
            Інтелектуальна платформа для дослідження туристичних об'єктів області 
            з використанням кластеризації та AI-аналізу
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3">
                <MapPin className="h-8 w-8 text-emerald-400" />
                <div className="text-left">
                  <p className="text-3xl font-bold text-white">{attractionsCount?.toLocaleString() || '1,864'}</p>
                  <p className="text-sm text-white/80">Туристичних об'єктів</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-400" />
                <div className="text-left">
                  <p className="text-3xl font-bold text-white">7</p>
                  <p className="text-sm text-white/80">Категорій кластерів</p>
                </div>
              </div>
            </div>

            <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-400" />
                <div className="text-left">
                  <p className="text-3xl font-bold text-white">4</p>
                  <p className="text-sm text-white/80">Райони області</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => scrollToSection('clusters')}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-lg px-8 py-6 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105"
            >
              <MapPin className="h-6 w-6 mr-2" />
              Дослідити кластери
            </Button>

            <Button 
              size="lg"
              variant="outline"
              onClick={() => scrollToSection('map')}
              className="border-2 border-white/50 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 text-lg px-8 py-6 shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <TrendingUp className="h-6 w-6 mr-2" />
              Переглянути карту
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 animate-bounce">
            <div className="w-8 h-12 mx-auto border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-white rounded-full animate-scroll"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes scroll {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(6px);
          }
          100% {
            transform: translateY(0);
          }
        }

        .animate-scroll {
          animation: scroll 1.5s ease-in-out infinite;
        }

        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .bg-radial-gradient {
          background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
        }
      `}</style>
    </section>
  );
};

export default DynamicHeroSection;
