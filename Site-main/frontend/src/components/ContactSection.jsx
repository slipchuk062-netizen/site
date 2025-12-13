import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Send, Phone, Mail, MapPin, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await axios.post(`${API}/contact`, formData);
      toast.success('Дякуємо за ваше повідомлення!', {
        description: "Ми зв'яжемося з вами найближчим часом.",
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
      setIsSubmitted(true);
    } catch (error) {
      toast.error('Помилка при відправці', {
        description: 'Будь ласка, спробуйте пізніше або зверніться за телефоном.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Телефон',
      value: '+38 (0412) 12-34-56',
      link: 'tel:+380412123456',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'tourism@zhytomyr.gov.ua',
      link: 'mailto:tourism@zhytomyr.gov.ua',
    },
    {
      icon: MapPin,
      title: 'Адреса',
      value: 'м. Житомир, майдан Соборний, 1',
      link: 'https://maps.google.com/?q=50.2547,28.6587',
    },
    {
      icon: Clock,
      title: 'Графік роботи',
      value: 'Пн-Пт: 09:00 - 18:00',
      link: null,
    },
  ];

  return (
    <section id="contact" className="py-20 lg:py-32 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-300 bg-emerald-50">
            Контакти
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Зв'яжіться з нами
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Маєте питання або потребуєте допомоги з плануванням подорожі?
            Ми з радістю допоможемо!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              {isSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Повідомлення відправлено!
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Дякуємо за звернення. Ми зв'яжемося з вами найближчим часом.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                  >
                    Надіслати ще одне повідомлення
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">
                    Напишіть нам
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Ваше ім'я *
                        </label>
                        <Input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Іван Петренко"
                          required
                          className="h-12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email *
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="example@email.com"
                          required
                          className="h-12"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Телефон
                      </label>
                      <Input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+38 (0XX) XXX-XX-XX"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Повідомлення *
                      </label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Розкажіть, чим можемо допомогти..."
                        required
                        rows={5}
                        className="resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Відправляємо...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Відправити
                        </span>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">
              Контактна інформація
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactInfo.map((info, index) => (
                <Card
                  key={index}
                  className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors duration-300">
                        <info.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">{info.title}</p>
                        {info.link ? (
                          <a
                            href={info.link}
                            target={info.link.startsWith('http') ? '_blank' : undefined}
                            rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="font-medium text-slate-900 hover:text-emerald-600 transition-colors"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="font-medium text-slate-900">{info.value}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Map */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="relative h-64 bg-slate-200">
                <iframe
                  src="https://www.openstreetmap.org/export/embed.html?bbox=28.5587%2C50.2047%2C28.7587%2C50.3047&layer=mapnik&marker=50.2547%2C28.6587"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта Житомира"
                  className="grayscale-[30%] hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
