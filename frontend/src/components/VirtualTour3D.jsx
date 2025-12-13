import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Play, Pause, RotateCw, Maximize2, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Camera, Navigation, MapPin
} from 'lucide-react';

const VirtualTour3D = () => {
  const [currentSpot, setCurrentSpot] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [rotation, setRotation] = useState(0);

  // Віртуальні локації Житомира
  const tourSpots = [
    {
      id: 1,
      name: "Площа Корольова",
      description: "Центральна площа міста з історичними будівлями",
      panorama: "https://streetviewpixels-pa.googleapis.com/v1/panorama?panoid=YOUR_PANO_ID&size=1024x512&key=YOUR_KEY",
      category: "Історичний центр",
      facts: [
        "Заснована у 18 столітті",
        "Популярне місце для міських заходів",
        "Архітектурний ансамбль епохи класицизму"
      ]
    },
    {
      id: 2,
      name: "Замкова гора",
      description: "Історична пам'ятка з панорамним видом на місто",
      panorama: "https://via.placeholder.com/1024x512/10b981/ffffff?text=Zamkova+Gora+360",
      category: "Історична пам'ятка",
      facts: [
        "Висота 283 метри над рівнем моря",
        "Руїни Житомирського замку",
        "Оглядовий майданчик"
      ]
    },
    {
      id: 3,
      name: "Михайлівська площа",
      description: "Історичний центр з собором",
      panorama: "https://via.placeholder.com/1024x512/3b82f6/ffffff?text=Mihaylivska+Square+360",
      category: "Релігійна споруда",
      facts: [
        "Михайлівський собор 18 століття",
        "Красива архітектура",
        "Культурний центр"
      ]
    }
  ];

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setRotation((prev) => (prev + 1) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const nextSpot = () => {
    setCurrentSpot((prev) => (prev + 1) % tourSpots.length);
    setRotation(0);
  };

  const prevSpot = () => {
    setCurrentSpot((prev) => (prev - 1 + tourSpots.length) % tourSpots.length);
    setRotation(0);
  };

  const currentLocation = tourSpots[currentSpot];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-purple-600 text-white text-lg px-6 py-2">
            <Camera className="h-5 w-5 mr-2 inline" />
            Віртуальний тур 360°
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Досліджуйте Житомир не виходячи з дому
          </h2>
          <p className="text-lg text-purple-200 max-w-2xl mx-auto">
            Інтерактивні 360° панорами найкрасивіших локацій міста з аудіогідом
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main 360 Viewer */}
          <Card className="lg:col-span-2 bg-slate-800 border-2 border-purple-500 shadow-2xl">
            <CardContent className="p-0">
              <div className="relative h-[500px] bg-slate-900 rounded-t-lg overflow-hidden">
                {/* 360° Panorama */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-100"
                  style={{ 
                    backgroundImage: `url(${currentLocation.panorama})`,
                    transform: `translateX(-${rotation * 2}px)`
                  }}
                />

                {/* Overlay Controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <Badge className="bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2">
                    <Navigation className="h-4 w-4 mr-2 inline" />
                    {currentLocation.category}
                  </Badge>
                  
                  <Button
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className="bg-black/60 backdrop-blur-sm hover:bg-black/80"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Navigation Arrows */}
                <Button
                  onClick={prevSpot}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-full w-12 h-12"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  onClick={nextSpot}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-full w-12 h-12"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {currentLocation.name}
                  </h3>
                  <p className="text-purple-200">
                    {currentLocation.description}
                  </p>
                </div>
              </div>

              {/* Control Panel */}
              <div className="p-4 bg-slate-800 border-t border-slate-700">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Зупинити
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Авто-огляд
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => setRotation(0)}
                    variant="outline"
                    className="border-purple-400 text-purple-200 hover:bg-purple-900"
                  >
                    <RotateCw className="h-5 w-5 mr-2" />
                    Reset
                  </Button>

                  <Button
                    variant="outline"
                    className="border-purple-400 text-purple-200 hover:bg-purple-900"
                  >
                    <Maximize2 className="h-5 w-5 mr-2" />
                    Повний екран
                  </Button>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 flex gap-2 justify-center">
                  {tourSpots.map((spot, index) => (
                    <button
                      key={spot.id}
                      onClick={() => setCurrentSpot(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentSpot 
                          ? 'w-8 bg-purple-500' 
                          : 'w-2 bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Panel */}
          <Card className="bg-slate-800 border-2 border-purple-500 shadow-2xl">
            <CardHeader className="border-b border-slate-700">
              <CardTitle className="text-white">
                Про локацію
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Location Name */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {currentLocation.name}
                  </h3>
                  <Badge className="bg-purple-600">
                    {currentLocation.category}
                  </Badge>
                </div>

                {/* Facts */}
                <div>
                  <h4 className="font-semibold text-purple-300 mb-3">
                    Цікаві факти:
                  </h4>
                  <div className="space-y-2">
                    {currentLocation.facts.map((fact, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        </div>
                        <p className="text-sm text-purple-100">{fact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All Locations */}
                <div>
                  <h4 className="font-semibold text-purple-300 mb-3">
                    Всі локації туру:
                  </h4>
                  <div className="space-y-2">
                    {tourSpots.map((spot, index) => (
                      <button
                        key={spot.id}
                        onClick={() => setCurrentSpot(index)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          index === currentSpot
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-700 text-purple-200 hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{spot.name}</span>
                          {index === currentSpot && (
                            <Camera className="h-4 w-4" />
                          )}
                        </div>
                        <p className="text-xs mt-1 opacity-80">{spot.category}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <MapPin className="h-5 w-5 mr-2" />
                  Показати на карті
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tour Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card className="bg-gradient-to-br from-purple-900 to-purple-800 border-purple-600 text-white">
            <CardContent className="pt-6 text-center">
              <Camera className="h-12 w-12 mx-auto mb-3 text-purple-300" />
              <p className="text-3xl font-bold mb-1">{tourSpots.length}</p>
              <p className="text-sm text-purple-200">Локацій в турі</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-600 text-white">
            <CardContent className="pt-6 text-center">
              <Navigation className="h-12 w-12 mx-auto mb-3 text-blue-300" />
              <p className="text-3xl font-bold mb-1">360°</p>
              <p className="text-sm text-blue-200">Панорамний огляд</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-900 to-pink-800 border-pink-600 text-white">
            <CardContent className="pt-6 text-center">
              <Volume2 className="h-12 w-12 mx-auto mb-3 text-pink-300" />
              <p className="text-3xl font-bold mb-1">Аудіо</p>
              <p className="text-sm text-pink-200">Гід-розповідь</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default VirtualTour3D;
