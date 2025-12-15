import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Star, MapPin, TrendingUp, Award } from 'lucide-react';

const TopPlaces = () => {
  // Мок даних топ-10
  const topPlaces = [
    { id: 1, name: "Замкова гора", category: "historical", rating: 4.8, visits: 15420, district: "Житомирський", image: "🏰" },
    { id: 2, name: "Михайлівський собор", category: "culture", rating: 4.7, visits: 12350, district: "Житомирський", image: "⛪" },
    { id: 3, name: "Парк культури", category: "parks", rating: 4.6, visits: 11200, district: "Житомирський", image: "🌳" },
    { id: 4, name: "Бердичівський монастир", category: "historical", rating: 4.9, visits: 10800, district: "Бердичівський", image: "🏛️" },
    { id: 5, name: "Коростенський краєзнавчий музей", category: "culture", rating: 4.5, visits: 9500, district: "Коростенський", image: "🎨" },
    { id: 6, name: "Новоград-Волинський замок", category: "historical", rating: 4.7, visits: 8900, district: "Новоград-Волинський", image: "🏰" },
    { id: 7, name: "Гідропарк", category: "nature", rating: 4.4, visits: 8200, district: "Житомирський", image: "🏞️" },
    { id: 8, name: "Ботанічний сад", category: "parks", rating: 4.6, visits: 7800, district: "Житомирський", image: "🌸" },
    { id: 9, name: "Театр ім. Кропивницького", category: "culture", rating: 4.7, visits: 7500, district: "Житомирський", image: "🎭" },
    { id: 10, name: "Історичний музей", category: "culture", rating: 4.5, visits: 7200, district: "Житомирський", image: "📜" }
  ];

  const categoryColors = {
    historical: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-600" },
    culture: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", badge: "bg-purple-600" },
    parks: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-600" },
    nature: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", badge: "bg-teal-600" },
  };

  const categoryNames = {
    historical: "Історія",
    culture: "Культура",
    parks: "Парки",
    nature: "Природа",
  };

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xl px-8 py-3">
            <Award className="h-6 w-6 mr-2 inline" />
            Найкращі місця
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-amber-800 to-orange-800 bg-clip-text text-transparent">
            Топ-10 місць Житомирщини
          </h2>
          <p className="text-xl sm:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Ці місця найбільше подобаються туристам. Рейтинги та відвідуваність оновлюються щодня
          </p>
        </div>

        {/* Top 3 - Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topPlaces.slice(0, 3).map((place, index) => {
            const colors = categoryColors[place.category] || categoryColors.historical;
            const medals = ["🥇", "🥈", "🥉"];
            
            return (
              <Card key={place.id} className={`border-2 ${colors.border} hover:shadow-2xl transition-all duration-300 hover:scale-105 ${colors.bg}`}>
                <CardContent className="p-6">
                  {/* Medal and Number */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-6xl">{medals[index]}</div>
                    <div className="text-6xl">{place.image}</div>
                  </div>

                  {/* Name */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    {place.name}
                  </h3>

                  {/* Category */}
                  <Badge className={`${colors.badge} text-white mb-3`}>
                    {categoryNames[place.category]}
                  </Badge>

                  {/* Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-lg">{place.rating}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <span className="font-bold">{place.visits.toLocaleString()}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-slate-600 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{place.district}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Remaining 4-10 - Compact List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topPlaces.slice(3).map((place, index) => {
            const colors = categoryColors[place.category] || categoryColors.historical;
            const actualIndex = index + 4;
            
            return (
              <Card key={place.id} className={`border ${colors.border} hover:shadow-lg transition-all duration-300 hover:scale-102 ${colors.bg}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Number and Icon */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="text-3xl font-bold text-slate-400">#{actualIndex}</div>
                      <div className="text-4xl">{place.image}</div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-slate-900 mb-1 truncate">
                        {place.name}
                      </h4>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${colors.badge} text-white text-xs`}>
                          {categoryNames[place.category]}
                        </Badge>
                        <span className="text-xs text-slate-600">{place.district}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{place.rating}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-semibold">{(place.visits / 1000).toFixed(1)}k</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-slate-600 mb-4">
            Хочете знайти щось особливе? Скористайтеся фільтрами на карті!
          </p>
          <button 
            onClick={() => {
              const mapSection = document.querySelector('section.py-12.bg-slate-50');
              if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🗺️ Переглянути на карті
          </button>
        </div>
      </div>
    </section>
  );
};

export default TopPlaces;
