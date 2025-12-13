import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const quickLinks = [
    { name: 'Головна', href: '#hero', isRoute: false },
    { name: 'Кластери', href: '#clusters', isRoute: false },
    { name: 'Карта', href: '#map', isRoute: false },
    { name: 'Відгуки', href: '#testimonials', isRoute: false },
    { name: 'Контакти', href: '#contact', isRoute: false },
    { name: 'Планувальник', href: '/trip-planner', isRoute: true },
    { name: 'Залишити відгук', href: '/feedback', isRoute: true },
  ];

  const clusterLinks = [
    { name: "Історичні пам'ятки", href: '#clusters' },
    { name: 'Парки та сквери', href: '#clusters' },
    { name: 'Торгівельні центри', href: '#clusters' },
    { name: 'Культурні заклади', href: '#clusters' },
    { name: "Природні об'єкти", href: '#clusters' },
    { name: 'Гастрономія', href: '#clusters' },
  ];

  const handleNavigation = (link) => {
    if (link.isRoute) {
      navigate(link.href);
    } else {
      const element = document.querySelector(link.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-slate-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="font-bold text-xl block">Житомир</span>
                <span className="text-slate-400 text-sm">Туризм</span>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6">
              Відкрийте для себе багатства Житомирщини — історію,
              природу та культуру одного з найстаріших міст України.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors duration-300"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors duration-300"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Швидкі посилання</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => handleNavigation(link)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors duration-200 text-left"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Clusters */}
          <div>
            <h4 className="font-bold text-lg mb-6">Кластери</h4>
            <ul className="space-y-3">
              {clusterLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-slate-400 hover:text-emerald-400 transition-colors duration-200"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-6">Контакти</h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+380412123456"
                  className="flex items-center gap-3 text-slate-400 hover:text-emerald-400 transition-colors duration-200"
                >
                  <Phone className="w-5 h-5" />
                  +38 (0412) 12-34-56
                </a>
              </li>
              <li>
                <a
                  href="mailto:tourism@zhytomyr.gov.ua"
                  className="flex items-center gap-3 text-slate-400 hover:text-emerald-400 transition-colors duration-200"
                >
                  <Mail className="w-5 h-5" />
                  tourism@zhytomyr.gov.ua
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-slate-400">
                  <MapPin className="w-5 h-5 mt-0.5" />
                  <span>м. Житомир, майдан Соборний, 1</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © {currentYear} Туристичні кластери Житомирської громади. Всі права захищені.
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <button className="hover:text-emerald-400 transition-colors">
                Політика конфіденційності
              </button>
              <button className="hover:text-emerald-400 transition-colors">
                Умови використання
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
