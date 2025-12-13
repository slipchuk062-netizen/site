import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Search, MapPin, Clock, TrendingUp, Filter, Layers, Activity, Flame } from 'lucide-react';
import { districts, districtColors, districtNames, zhytomyrRegionBorder } from '../data/districts';
import axios from 'axios';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Category configuration
const categoryColors = {
  historical: '#f59e0b',
  parks: '#10b981',
  shopping: '#3b82f6',
  culture: '#8b5cf6',
  nature: '#14b8a6',
  gastro: '#f43f5e',
  hotels: '#6366f1',
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

// Create custom marker with visit percentage
const createCustomIcon = (category, visitPercentage) => {
  const color = categoryColors[category] || '#6b7280';
  const size = visitPercentage ? Math.max(20, Math.min(40, visitPercentage * 1.5)) : 24;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color}; 
        width: ${size}px; 
        height: ${size}px; 
        border-radius: 50%; 
        border: 3px solid white; 
        box-shadow: 0 2px 12px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      ">
        ${visitPercentage ? Math.round(visitPercentage) + '%' : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Heat map layer component
const HeatMapLayer = ({ attractions, clusterStats }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!map || !attractions.length) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Create heat map data with visit percentages
    const heatData = attractions
      .filter(attr => attr.coordinates?.lat && attr.coordinates?.lng)
      .map(attr => {
        const stats = clusterStats[attr.category] || {};
        const intensity = (stats.visit_percentage || 10) / 100;
        return [
          attr.coordinates.lat,
          attr.coordinates.lng,
          intensity
        ];
      });

    // Create heat layer
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 35,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: '#3b82f6',
        0.3: '#10b981',
        0.5: '#f59e0b',
        0.7: '#ef4444',
        1.0: '#dc2626'
      }
    }).addTo(map);

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, attractions, clusterStats]);

  return null;
};

// District boundaries layer with region border
const DistrictBoundaries = ({ showBoundaries, densityStats }) => {
  if (!showBoundaries) return null;

  // Region border style (outer boundary)
  const regionStyle = {
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#059669', // emerald-600
    weight: 5,
    opacity: 1,
    dashArray: 'none',
    className: 'region-border-animation'
  };

  // District style
  const districtStyle = (feature) => ({
    fillColor: districtColors[feature.properties.id] || '#6b7280',
    fillOpacity: 0.12,
    color: districtColors[feature.properties.id] || '#6b7280',
    weight: 3,
    opacity: 0.9,
    dashArray: '8, 5',
    className: 'district-border-pulse'
  });

  const onEachDistrict = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      const districtId = feature.properties.id;
      const stats = densityStats.find(d => d.id === districtId);
      
      layer.bindPopup(
        `<div class="p-4 min-w-[200px]">
          <h3 class="font-bold text-lg text-slate-900 mb-3">${feature.properties.name}</h3>
          ${stats ? `
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-600">Об'єктів:</span>
                <span class="font-bold text-emerald-700">${stats.count}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-600">Щільність:</span>
                <span class="font-bold text-blue-700">${stats.density} об/км²</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-600">Популярність:</span>
                <span class="font-bold text-amber-700">${(stats.popularity_index * 100).toFixed(0)}%</span>
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2 mt-2">
                <div class="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500" 
                     style="width: ${(stats.popularity_index * 100).toFixed(0)}%"></div>
              </div>
            </div>
          ` : '<p class="text-sm text-slate-600">Немає статистики</p>'}
        </div>`
      );

      // Hover effects
      layer.on('mouseover', function() {
        this.setStyle({
          fillOpacity: 0.25,
          weight: 4,
          opacity: 1
        });
      });

      layer.on('mouseout', function() {
        this.setStyle({
          fillOpacity: 0.12,
          weight: 3,
          opacity: 0.9
        });
      });
    }
  };

  const onRegionHover = (feature, layer) => {
    layer.bindPopup(
      `<div class="p-4">
        <h2 class="font-bold text-xl text-emerald-700 mb-2">🗺️ Житомирська область</h2>
        <p class="text-sm text-slate-600">Туристична карта регіону</p>
        <div class="mt-2 text-xs text-slate-500">
          ${districts.length} районів • ${densityStats.reduce((sum, d) => sum + d.count, 0)} об'єктів
        </div>
      </div>`
    );

    layer.on('mouseover', function() {
      this.setStyle({
        color: '#10b981', // emerald-500
        weight: 6,
        opacity: 1
      });
    });

    layer.on('mouseout', function() {
      this.setStyle({
        color: '#059669', // emerald-600
        weight: 5,
        opacity: 1
      });
    });
  };

  return (
    <>
      {/* Region outer boundary */}
      <GeoJSON
        key="region-border"
        data={zhytomyrRegionBorder}
        style={regionStyle}
        onEachFeature={onRegionHover}
      />
      
      {/* District boundaries */}
      {districts.map(district => (
        <GeoJSON
          key={district.id}
          data={district.bounds}
          style={districtStyle}
          onEachFeature={onEachDistrict}
        />
      ))}
    </>
  );
};

const EnhancedInteractiveMap = ({ attractions = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [clusterStats, setClusterStats] = useState({});
  const [densityStats, setDensityStats] = useState([]);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'heatmap'
  const mapRef = useRef(null);

  // Fetch cluster statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        
        // Get cluster stats
        const statsRes = await axios.get(`${backendUrl}/api/clusters/statistics`);
        if (statsRes.data.success) {
          const statsMap = {};
          statsRes.data.data.forEach(stat => {
            statsMap[stat.id] = stat;
          });
          setClusterStats(statsMap);
        }

        // Get density stats
        const densityRes = await axios.get(`${backendUrl}/api/clusters/density`);
        if (densityRes.data.success) {
          setDensityStats(densityRes.data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Filter attractions
  const filteredAttractions = useMemo(() => {
    return attractions.filter((attr) => {
      const matchesCategory = selectedCategory === 'all' || attr.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        attr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.address?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && attr.coordinates?.lat && attr.coordinates?.lng;
    });
  }, [attractions, selectedCategory, searchTerm]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalObjects = filteredAttractions.length;
    const categoryCounts = {};
    filteredAttractions.forEach(attr => {
      categoryCounts[attr.category] = (categoryCounts[attr.category] || 0) + 1;
    });
    
    return {
      total: totalObjects,
      byCategory: categoryCounts
    };
  }, [filteredAttractions]);

  const handleAttractionClick = (attraction) => {
    setSelectedAttraction(attraction);
    if (mapRef.current) {
      mapRef.current.flyTo(
        [attraction.coordinates.lat, attraction.coordinates.lng],
        14,
        { duration: 1 }
      );
    }
  };

  const categories = [
    { id: 'all', name: 'Всі об\'єкти', icon: '🗺️' },
    { id: 'historical', name: categoryNames.historical, icon: '🏛️' },
    { id: 'culture', name: categoryNames.culture, icon: '🎭' },
    { id: 'nature', name: categoryNames.nature, icon: '🏞️' },
    { id: 'parks', name: categoryNames.parks, icon: '🌳' },
    { id: 'shopping', name: categoryNames.shopping, icon: '🛍️' },
    { id: 'gastro', name: categoryNames.gastro, icon: '🍽️' },
    { id: 'hotels', name: categoryNames.hotels, icon: '🏨' },
  ];

  return (
    <section id="map" className="py-20 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-300 bg-emerald-50">
            Інтерактивна карта
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Візуалізація туристичних об'єктів
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Географічний розподіл з heat map популярних зон та межами районів
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2 border-emerald-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{statistics.total}</p>
                <p className="text-sm text-slate-600">Об'єктів на карті</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <Layers className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{Object.keys(statistics.byCategory).length}</p>
                <p className="text-sm text-slate-600">Активних категорій</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <Activity className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">{densityStats.length}</p>
                <p className="text-sm text-slate-600">Районів</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-rose-100">
            <CardContent className="pt-6">
              <div className="text-center">
                <Flame className="h-8 w-8 text-rose-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900">
                  {Object.values(clusterStats).reduce((acc, stat) => acc + (stat.visit_percentage || 0), 0) > 0 ? 'ON' : 'OFF'}
                </p>
                <p className="text-sm text-slate-600">Heat Map</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar with filters and legend */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Фільтри та легенда
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Пошук об'єктів
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Назва або адреса..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* View Mode */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Режим відображення
                </label>
                <Tabs value={viewMode} onValueChange={setViewMode}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="map">Маркери</TabsTrigger>
                    <TabsTrigger value="heatmap">Heat Map</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Layer controls */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 block">
                  Шари карти
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHeatMap}
                    onChange={(e) => setShowHeatMap(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm">Теплова карта популярності</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBoundaries}
                    onChange={(e) => setShowBoundaries(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm">Межі районів</span>
                </label>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Категорії
                </label>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {categories.map((cat) => {
                      const count = cat.id === 'all' ? statistics.total : (statistics.byCategory[cat.id] || 0);
                      const stats = clusterStats[cat.id];
                      
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            selectedCategory === cat.id
                              ? 'bg-emerald-100 text-emerald-900 border-2 border-emerald-500'
                              : 'hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span className="text-sm font-medium">{cat.name}</span>
                            </div>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                          {stats && cat.id !== 'all' && (
                            <div className="mt-1 flex gap-2 text-xs">
                              <span className="text-emerald-600">
                                📈 {stats.visit_percentage}%
                              </span>
                              <span className="text-amber-600">
                                ⭐ {stats.popularity_score}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Legend */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Легенда Heat Map
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500"></div>
                    <span className="text-xs">0-30% відвідуваність</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-emerald-500"></div>
                    <span className="text-xs">30-50% відвідуваність</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-500"></div>
                    <span className="text-xs">50-70% відвідуваність</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-xs">70-100% відвідуваність</span>
                  </div>
                </div>
              </div>

              {/* District density info */}
              {densityStats.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Щільність по районах
                  </label>
                  <div className="space-y-2">
                    {densityStats.map(district => (
                      <div key={district.id} className="text-xs p-2 bg-slate-50 rounded">
                        <div className="font-medium">{district.name}</div>
                        <div className="text-slate-600">
                          Щільність: {district.density} об/км²
                        </div>
                        <div className="text-emerald-600">
                          Популярність: {(district.popularity_index * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="lg:col-span-3">
            <CardContent className="p-0">
              <div className="h-[700px] rounded-lg overflow-hidden">
                <MapContainer
                  center={[50.5, 28.6]}
                  zoom={9}
                  className="h-full w-full"
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  {/* District boundaries */}
                  <DistrictBoundaries showBoundaries={showBoundaries} />

                  {/* Heat map */}
                  {showHeatMap && viewMode === 'heatmap' && (
                    <HeatMapLayer attractions={filteredAttractions} clusterStats={clusterStats} />
                  )}

                  {/* Markers */}
                  {viewMode === 'map' && filteredAttractions.map((attraction) => {
                    const stats = clusterStats[attraction.category] || {};
                    
                    return (
                      <Marker
                        key={attraction.id}
                        position={[attraction.coordinates.lat, attraction.coordinates.lng]}
                        icon={createCustomIcon(attraction.category, stats.visit_percentage)}
                      >
                        <Popup>
                          <div className="p-2 min-w-[250px]">
                            <h3 className="font-bold text-lg mb-2">{attraction.name}</h3>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge style={{ backgroundColor: categoryColors[attraction.category] }}>
                                  {categoryNames[attraction.category]}
                                </Badge>
                              </div>

                              {attraction.address && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-700">{attraction.address}</span>
                                </div>
                              )}

                              {attraction.workingHours && (
                                <div className="flex items-start gap-2">
                                  <Clock className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-slate-700">{attraction.workingHours}</span>
                                </div>
                              )}

                              {stats.visit_percentage && (
                                <div className="mt-3 p-2 bg-emerald-50 rounded">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-700">Відвідуваність</span>
                                    <span className="text-sm font-bold text-emerald-700">
                                      {stats.visit_percentage}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-700">Популярність</span>
                                    <span className="text-sm font-bold text-amber-700">
                                      {stats.popularity_score}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info panel */}
        <Card className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-2 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-600 rounded-full">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-2">
                  Науковий підхід до візуалізації
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed">
                  Карта використовує алгоритм теплової візуалізації для відображення популярних зон 
                  на основі відсотка відвідуваності об'єктів. Розмір маркерів пропорційний відвідуваності. 
                  Межі районів показують географічний розподіл туристичної інфраструктури Житомирської області.
                  Heat map gradient від синього (низька активність) до червоного (висока активність) 
                  дозволяє туристам швидко ідентифікувати найпопулярніші зони для відвідування.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default EnhancedInteractiveMap;
