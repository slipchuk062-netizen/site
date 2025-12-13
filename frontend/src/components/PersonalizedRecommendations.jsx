import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Sparkles, MapPin, Star, TrendingUp, Heart, Clock,
  ThumbsUp, MessageSquare, Calendar, Filter
} from 'lucide-react';
import axios from 'axios';

const categoryIcons = {
  historical: '🏛️',
  culture: '🎭',
  nature: '🏞️',
  parks: '🌳',
  shopping: '🛍️',
  gastro: '🍽️',
  hotels: '🏨'
};

const categoryNames = {
  historical: "Історичні пам'ятки",
  parks: 'Парки та сквери',
  shopping: 'Торгівельні центри',
  culture: 'Культурні заклади',
  nature: "Природні об'єкти",
  gastro: 'Гастрономія',
  hotels: 'Готелі',
};

const PersonalizedRecommendations = () => {
  const [preferences, setPreferences] = useState({
    historical: 0.7,
    culture: 0.8,
    nature: 0.6,
    parks: 0.5,
    shopping: 0.3,
    gastro: 0.6,
    hotels: 0.4
  });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visitedIds, setVisitedIds] = useState([]);
  const [selectedAttr, setSelectedAttr] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.post(`${backendUrl}/api/recommendations/personalized`, {
        preferences,
        visited_ids: visitedIds
      });

      if (response.data.success) {
        setRecommendations(response.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (category, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const markAsVisited = (attrId) => {
    setVisitedIds(prev => [...prev, attrId]);
    setRecommendations(prev => prev.filter(r => r.id !== attrId));
  };

  const categories = Object.keys(preferences);

  return (
    <section id="recommendations" className="py-20 bg-gradient-to-b from-white via-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-purple-700 border-purple-300 bg-purple-50">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            AI-рекомендації
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Персоналізовані рекомендації
            </span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Налаштуйте свої вподобання, і ми підберемо найкращі місця спеціально для вас
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preferences Panel */}
          <Card className="lg:col-span-1 shadow-xl border-2 border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                Ваші вподобання
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {categories.map(category => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <span>{categoryIcons[category]}</span>
                      <span>{categoryNames[category]}</span>
                    </label>
                    <Badge variant="secondary">
                      {Math.round(preferences[category] * 100)}%
                    </Badge>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={preferences[category]}
                    onChange={(e) => handlePreferenceChange(category, parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              ))}

              <Button 
                onClick={fetchRecommendations}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Оновлення...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Оновити рекомендації
                  </>
                )}
              </Button>

              {visitedIds.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800">
                    ✅ Відвідано: {visitedIds.length} місць
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations List */}
          <Card className="lg:col-span-2 shadow-xl border-2 border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Топ-10 рекомендацій
                </span>
                <Badge className="bg-purple-600">
                  {recommendations.length} місць
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-20">
                  <Sparkles className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Налаштуйте вподобання для отримання рекомендацій</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <Card 
                      key={rec.id}
                      className="hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200 cursor-pointer"
                      onClick={() => setSelectedAttr(rec)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Rank Badge */}
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                              index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                              index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                              'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700'
                            }`}>
                              #{index + 1}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-lg text-slate-900 mb-1">
                                  {rec.name}
                                </h3>
                                <Badge className="mb-2">
                                  {categoryIcons[rec.category]} {categoryNames[rec.category]}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 mb-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="font-bold text-lg text-slate-900">
                                    {rec.score}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">Match Score</p>
                              </div>
                            </div>

                            {rec.address && (
                              <div className="flex items-start gap-2 text-sm text-slate-600 mb-2">
                                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>{rec.address}</span>
                              </div>
                            )}

                            <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                              <p className="text-sm text-purple-800 font-medium">
                                💡 {rec.match_reason}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsVisited(rec.id);
                            }}
                            className="flex-1"
                          >
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Відвідав
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to map with this location
                              const mapSection = document.getElementById('map');
                              if (mapSection) {
                                mapSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            Показати на карті
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <Sparkles className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">AI-алгоритм</h3>
                <p className="text-sm text-slate-600">
                  Використовує машинне навчання для персоналізації
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-10 w-10 text-pink-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Динамічне оновлення</h3>
                <p className="text-sm text-slate-600">
                  Рекомендації змінюються на основі ваших вподобань
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="text-center">
                <Heart className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">100% персоналізовано</h3>
                <p className="text-sm text-slate-600">
                  Кожна рекомендація підібрана спеціально для вас
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PersonalizedRecommendations;
