import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Menu, X, MapPin } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Головна', href: '#hero', type: 'scroll' },
    { name: 'Кластери', href: '#clusters', type: 'scroll' },
    { name: 'Рекомендації', href: '#recommendations', type: 'scroll' },
    { name: 'Аналітика', href: '/analytics', type: 'route' },
    { name: 'Карта', href: '#map', type: 'scroll' },
    { name: 'Статистика', href: '#statistics', type: 'scroll' },
    { name: 'Контакти', href: '#contact', type: 'scroll' },
  ];

  const handleNavigation = (link) => {
    if (link.type === 'route') {
      navigate(link.href);
    } else {
      if (isHomePage) {
        const element = document.querySelector(link.href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate('/' + link.href);
      }
    }
    setIsMobileMenuOpen(false);
  };
  
  const handlePlanTrip = () => {
    navigate('/trip-planner');
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-lg leading-tight transition-colors ${
                isScrolled || !isHomePage ? 'text-slate-900' : 'text-white'
              }`}>
                Житомир
              </span>
              <span className={`text-xs leading-tight transition-colors ${
                isScrolled || !isHomePage ? 'text-slate-500' : 'text-white/80'
              }`}>
                Туризм
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavigation(link)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isScrolled || !isHomePage
                    ? 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button
              onClick={handlePlanTrip}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Спланувати подорож
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled || !isHomePage ? 'text-slate-700' : 'text-white'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-white shadow-xl transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleNavigation(link)}
              className="px-4 py-3 text-left text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-colors"
            >
              {link.name}
            </button>
          ))}
          <Button
            onClick={handlePlanTrip}
            className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
          >
            Спланувати подорож
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
