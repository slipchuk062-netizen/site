import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2, Save, MapPin, Calendar, Clock, Navigation } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import attractionsData from '../data/attractions.json';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const TripPlanner = () => {
  const [tripName, setTripName] = useState('');
  const [tripDescription, setTripDescription] = useState('');
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Load saved trips
  useEffect(() => {
    loadTrips();
  }, []);
  
  const loadTrips = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/trips`);
      const data = await response.json();
      setSavedTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };
  
  // Filter attractions by search
  const filteredAttractions = attractionsData.filter(attr =>
    attr.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !selectedPlaces.find(p => p.place_id === attr.id)
  );
  
  const addPlace = (attraction) => {
    setSelectedPlaces([...selectedPlaces, {
      place_id: attraction.id,
      name: attraction.name,
      address: attraction.address,
      coordinates: attraction.coordinates,
      category: attraction.category,
      order: selectedPlaces.length
    }]);
    setSearchQuery('');
    toast.success(`${attraction.name} додано до маршруту`);
  };
  
  const removePlace = (placeId) => {
    setSelectedPlaces(selectedPlaces.filter(p => p.place_id !== placeId));
    toast.info('Локацію видалено з маршруту');
  };
  
  const saveTripPlan = async () => {
    if (!tripName) {
      toast.error('Введіть назву маршруту');
      return;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error('Додайте хоча б одну локацію');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tripName,
          description: tripDescription,
          places: selectedPlaces
        })
      });
      
      if (response.ok) {
        toast.success('Маршрут збережено!');
        setTripName('');
        setTripDescription('');
        setSelectedPlaces([]);
        loadTrips();
      } else {
        toast.error('Помилка збереження маршруту');
      }
    } catch (error) {
      toast.error('Помилка збереження');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteTrip = async (tripId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/trips/${tripId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Маршрут видалено');
        loadTrips();
      }
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };
  
  const getCategoryColor = (category) => {
    const colors = {
      historical: '#f59e0b',
      parks: '#10b981',
      shopping: '#3b82f6',
      culture: '#8b5cf6',
      nature: '#14b8a6',
      gastro: '#f43f5e',
      hotels: '#6366f1',
    };
    return colors[category] || '#6b7280';
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Планувальник подорожей</h1>
          <p className="text-slate-600">Створіть свій унікальний маршрут по Житомирщині</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Trip Builder */}
          <div>
            <Card className="border-0 shadow-xl mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                  Новий маршрут
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Назва маршруту</label>
                  <Input
                    placeholder="Наприклад: Вихідні у Житомирі"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Опис (необов'язково)</label>
                  <Input
                    placeholder="Короткий опис вашого маршруту"
                    value={tripDescription}
                    onChange={(e) => setTripDescription(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Додати локацію</label>
                  <Input
                    placeholder="Пошук локацій..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  {searchQuery && (
                    <ScrollArea className="h-48 mt-2 border rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredAttractions.slice(0, 20).map((attr) => (
                          <button
                            key={attr.id}
                            onClick={() => addPlace(attr)}
                            className="w-full text-left p-3 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-3"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getCategoryColor(attr.category) }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">{attr.name}</p>
                              <p className="text-xs text-slate-500 truncate">{attr.address}</p>
                            </div>
                            <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
                
                {/* Selected Places */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Локації в маршруті ({selectedPlaces.length})
                  </label>
                  <ScrollArea className="h-64 border rounded-lg p-2">
                    {selectedPlaces.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        Почніть додавати локації до маршруту
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedPlaces.map((place, index) => (
                          <div
                            key={place.place_id}
                            className="p-3 bg-slate-50 rounded-lg flex items-start gap-3"
                          >
                            <div className="flex items-center justify-center w-6 h-6 bg-emerald-600 text-white rounded-full text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 truncate">{place.name}</p>
                              <p className="text-xs text-slate-500 truncate">{place.address}</p>
                            </div>
                            <button
                              onClick={() => removePlace(place.place_id)}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
                
                <Button
                  onClick={saveTripPlan}
                  disabled={loading || !tripName || selectedPlaces.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Збереження...' : 'Зберегти маршрут'}
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Saved Trips */}
          <div>
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Збережені маршрути
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {savedTrips.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Збережених маршрутів поки немає</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {savedTrips.map((trip) => (
                        <Card key={trip.id} className="border border-slate-200">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-slate-900 mb-1">{trip.name}</h3>
                                {trip.description && (
                                  <p className="text-sm text-slate-600">{trip.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {trip.places?.length || 0} локацій
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(trip.created_at).toLocaleDateString('uk-UA')}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => deleteTrip(trip.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="space-y-1 mt-3 pt-3 border-t border-slate-100">
                              {trip.places?.slice(0, 5).map((place, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <span className="text-emerald-600 font-semibold text-xs">{idx + 1}.</span>
                                  <span className="text-slate-700 truncate">{place.name}</span>
                                </div>
                              ))}
                              {trip.places?.length > 5 && (
                                <p className="text-xs text-slate-400 pl-4">та ще {trip.places.length - 5} локацій...</p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TripPlanner;