import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Sun, Cloud, CloudRain, CloudSnow, Wind, Thermometer, 
  Droplets, MapPin, RefreshCw
} from 'lucide-react';
import { Button } from './ui/button';

// Zhytomyr region districts with coordinates
const districts = [
  { id: 'zhytomyr', name: 'Житомир', lat: 50.2547, lng: 28.6587 },
  { id: 'berdychiv', name: 'Бердичів', lat: 49.8933, lng: 28.6028 },
  { id: 'korosten', name: 'Коростень', lat: 50.9553, lng: 28.6494 },
  { id: 'zviahel', name: 'Звягель', lat: 50.5885, lng: 27.6210 },
];

// Weather code to icon mapping
const getWeatherIcon = (code) => {
  if (code === 0) return <Sun className="h-8 w-8 text-yellow-500" />;
  if (code <= 3) return <Cloud className="h-8 w-8 text-gray-400" />;
  if (code <= 49) return <Cloud className="h-8 w-8 text-gray-500" />;
  if (code <= 69) return <CloudRain className="h-8 w-8 text-blue-500" />;
  if (code <= 79) return <CloudSnow className="h-8 w-8 text-blue-200" />;
  if (code <= 99) return <CloudRain className="h-8 w-8 text-blue-600" />;
  return <Cloud className="h-8 w-8 text-gray-400" />;
};

// Weather code to description
const getWeatherDescription = (code) => {
  if (code === 0) return 'Ясно';
  if (code === 1) return 'Переважно ясно';
  if (code === 2) return 'Хмарно з проясненнями';
  if (code === 3) return 'Похмуро';
  if (code <= 49) return 'Туман';
  if (code <= 55) return 'Мряка';
  if (code <= 65) return 'Дощ';
  if (code <= 67) return 'Дощ зі снігом';
  if (code <= 75) return 'Сніг';
  if (code <= 77) return 'Снігова крупа';
  if (code <= 82) return 'Злива';
  if (code <= 86) return 'Снігопад';
  if (code <= 99) return 'Гроза';
  return 'Невідомо';
};

const WeatherSection = () => {
  const [weatherData, setWeatherData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = {};
      
      // Fetch weather for all districts using Open-Meteo API (free, no key needed)
      for (const district of districts) {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${district.lat}&longitude=${district.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=Europe%2FKyiv`
        );
        
        if (response.ok) {
          const data = await response.json();
          results[district.id] = {
            name: district.name,
            temperature: Math.round(data.current.temperature_2m),
            humidity: data.current.relative_humidity_2m,
            windSpeed: Math.round(data.current.wind_speed_10m),
            weatherCode: data.current.weather_code
          };
        }
      }
      
      setWeatherData(results);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Не вдалося завантажити дані про погоду');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-sky-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 text-sky-700 border-sky-300 bg-sky-50">
            <Sun className="h-4 w-4 mr-1 inline" />
            Погода в реальному часі
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Погода в Житомирській області
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Актуальна погода в основних районах області для планування подорожей
          </p>
          {lastUpdate && (
            <p className="text-xs text-slate-400 mt-2">
              Оновлено: {lastUpdate.toLocaleTimeString('uk-UA')}
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchWeather} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Спробувати знову
            </Button>
          </div>
        )}

        {/* Weather Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {districts.map((district) => {
            const weather = weatherData[district.id];
            
            return (
              <Card 
                key={district.id} 
                className="border-2 border-sky-100 hover:border-sky-300 hover:shadow-lg transition-all duration-300"
              >
                <CardContent className="pt-6">
                  {loading ? (
                    <div className="flex flex-col items-center animate-pulse">
                      <div className="h-8 w-8 bg-slate-200 rounded-full mb-2"></div>
                      <div className="h-4 w-20 bg-slate-200 rounded mb-2"></div>
                      <div className="h-8 w-16 bg-slate-200 rounded"></div>
                    </div>
                  ) : weather ? (
                    <div className="flex flex-col items-center">
                      {/* Weather Icon */}
                      {getWeatherIcon(weather.weatherCode)}
                      
                      {/* City Name */}
                      <div className="flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-slate-900">
                          {weather.name}
                        </span>
                      </div>
                      
                      {/* Temperature */}
                      <div className="flex items-center gap-1 mt-2">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span className="text-3xl font-bold text-slate-900">
                          {weather.temperature}°
                        </span>
                      </div>
                      
                      {/* Weather Description */}
                      <p className="text-sm text-slate-600 mt-1">
                        {getWeatherDescription(weather.weatherCode)}
                      </p>
                      
                      {/* Additional Info */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Droplets className="h-3 w-3 text-blue-400" />
                          {weather.humidity}%
                        </div>
                        <div className="flex items-center gap-1">
                          <Wind className="h-3 w-3 text-slate-400" />
                          {weather.windSpeed} км/г
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 py-4">
                      Немає даних
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Refresh Button */}
        <div className="text-center mt-6">
          <Button 
            onClick={fetchWeather} 
            variant="outline" 
            disabled={loading}
            className="border-sky-300 text-sky-700 hover:bg-sky-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Оновити погоду
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WeatherSection;
