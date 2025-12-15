import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Castle, Trees, ShoppingBag, Theater, Mountain, UtensilsCrossed, Hotel, TrendingUp, MapPin, Star } from 'lucide-react';

const BeautifulClustering = () => {
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = [
    {
      id: 'historical',
      name: 'Історія',
      icon: Castle,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      count: 342,
      description: 'Замки, храми, музеї та пам\'ятки',
      topPlaces: ['Замкова гора', 'Михайлівський собор', 'Бердичівський монастир'],
      emoji: '🏰'
    },
    {
      id: 'parks',
      name: 'Парки',
      icon: Trees,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      count: 287,
      description: 'Парки, сквери та зелені зони',
      topPlaces: ['Парк культури', 'Ботанічний сад', 'Гідропарк'],
      emoji: '🌳'
    },
    {
      id: 'culture',
      name: 'Культура',
      icon: Theater,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      count: 234,
      description: 'Театри, бібліотеки та культурні центри',
      topPlaces: ['Театр Кропивницького', 'Історичний музей', 'Краєзнавчий музей'],
      emoji: '🎭'
    },
    {
      id: 'nature',
      name: 'Природа',
      icon: Mountain,
      color: 'from-teal-500 to-cyan-500',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      count: 298,
      description: 'Озера, ліси та заповідники',
      topPlaces: ['Лісопарк', 'Озеро Тетерів', 'Заповідник'],
      emoji: '🏞️'
    },
    {
      id: 'gastro',
      name: 'Гастрономія',
      icon: UtensilsCrossed,
      color: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      count: 412,
      description: 'Ресторани, кафе та бари',
      topPlaces: ['Ресторан "Житомир"', 'Кав\'ярня "Старе місто"', 'Піцерія'],
      emoji: '🍽️'
    },
    {
      id: 'shopping',
      name: 'Шопінг',
      icon: ShoppingBag,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      count: 189,
      description: 'ТЦ, ринки та магазини',
      topPlaces: ['ТЦ "Глобус"', 'Центральний ринок', 'ТЦ "Вікторія"'],
      emoji: '🛍️'
    },
    {
      id: 'hotels',
      name: 'Житло',
      icon: Hotel,
      color: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      count: 102,
      description: 'Готелі, хостели та апартаменти',
      topPlaces: ['Готель "Україна"', 'Хостел "Центр"', 'Апартаменти'],
      emoji: '🏨'
    }
  ];

  const total = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <section className="py-20 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xl px-8 py-3">
            <MapPin className="h-6 w-6 mr-2 inline" />
            7 категорій
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
            Що вас цікавить?
          </h2>
          <p className="text-xl sm:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed mb-4">
            Ми розподілили всі <strong className="text-emerald-700">{total.toLocaleString()}</strong> туристичних місць 
            на зручні категорії
          </p>
          <p className="text-lg text-slate-600">
            Натисніть на категорію щоб дізнатися більше ↓
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <Card
                key={category.id}
                className={`relative overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
                  isActive 
                    ? `${category.borderColor} shadow-2xl scale-105 ring-4 ring-offset-2 ring-${category.borderColor}` 
                    : `${category.borderColor} hover:shadow-xl hover:scale-102`
                } ${category.bgColor}`}
                onClick={() => setActiveCategory(isActive ? null : category.id)}
              >
                <CardContent className="p-6 relative">
                  {/* Animated Background */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.color} opacity-10 rounded-full -mr-16 -mt-16`} />
                  
                  {/* Number Badge */}
                  <div className="absolute top-4 right-4">
                    <Badge className={`bg-gradient-to-r ${category.color} text-white text-xs px-2 py-1`}>
                      #{index + 1}
                    </Badge>
                  </div>

                  {/* Icon and Emoji */}
                  <div className="flex items-center justify-center mb-4">
                    <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg ${
                      isActive ? 'animate-pulse' : ''
                    }`}>
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  {/* Emoji */}
                  <div className="text-5xl text-center mb-3">
                    {category.emoji}
                  </div>

                  {/* Category Name */}
                  <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">
                    {category.name}
                  </h3>

                  {/* Count */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className={`text-3xl font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}>
                      {category.count}
                    </div>
                    <span className="text-sm text-slate-600">місць</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 text-center mb-4 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Expand/Collapse indicator */}
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-xs bg-gradient-to-r ${category.color} text-white hover:opacity-80`}
                    >
                      {isActive ? 'Згорнути ↑' : 'Детальніше ↓'}
                    </Button>
                  </div>

                  {/* Expanded Content */}
                  {isActive && (
                    <div className="mt-4 pt-4 border-t border-slate-200 animate-fade-in">
                      <p className="text-xs font-semibold text-slate-700 mb-2">🏆 Топ місця:</p>
                      <ul className="space-y-1">
                        {category.topPlaces.map((place, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            {place}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-700">{total.toLocaleString()}</div>
              <div className="text-sm text-slate-600">Всього місць</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-700">7</div>
              <div className="text-sm text-slate-600">Категорій</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-700">4</div>
              <div className="text-sm text-slate-600">Райони</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-amber-600 flex items-center justify-center gap-1">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                4.3
              </div>
              <div className="text-sm text-slate-600">Середній рейтинг</div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-lg text-slate-600 mb-6">
            Готові дослідити ці місця на карті?
          </p>
          <Button
            size="lg"
            onClick={() => {
              const mapSection = document.querySelector('section.py-12.bg-slate-50');
              if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xl px-10 py-7 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300"
          >
            <MapPin className="h-6 w-6 mr-2" />
            Переглянути на карті
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </section>
  );
};

export default BeautifulClustering;
