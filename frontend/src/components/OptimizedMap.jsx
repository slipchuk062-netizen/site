import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import './EnhancedMap.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Search, MapPin, Layers, Activity, Flame, Filter, Zap } from 'lucide-react';
import { districts, zhytomyrRegionBorder, districtColors } from '../data/districts';
import axios from 'axios';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Category colors
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

// Create custom icon for markers
const createCategoryIcon = (category) => {
  const color = categoryColors[category] || '#6b7280';
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        background-color: ${color}; 
        width: 12px; 
        height: 12px; 
        border-radius: 50%; 
        border: 2px solid white; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
  });
};

// Create custom cluster icon
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = 40;
  let className = 'marker-cluster-small';
  
  if (count >= 100) {
    size = 60;
    className = 'marker-cluster-large';
  } else if (count >= 30) {
    size = 50;
    className = 'marker-cluster-medium';
  }

  return L.divIcon({
    html: `<div><span>${count}</span></div>`,
    className: `marker-cluster ${className}`,
    iconSize: L.point(size, size, true),
  });
};

// District boundaries component
const DistrictBoundaries = ({ showBoundaries, densityStats }) => {
  if (!showBoundaries) return null;

  const regionStyle = {
    fillColor: 'transparent',
    fillOpacity: 0,
    color: '#059669',
    weight: 4,
    opacity: 1,
    dashArray: 'none',
  };

  const districtStyle = (feature) => ({
    fillColor: districtColors[feature.properties.id] || '#6b7280',
    fillOpacity: 0.08,
    color: districtColors[feature.properties.id] || '#6b7280',
    weight: 2,
    opacity: 0.7,
    dashArray: '5, 5',
  });

  const onEachDistrict = (feature, layer) => {
    const districtId = feature.properties.id;
    const stats = densityStats.find(d => d.id === districtId);
    
    layer.bindPopup(
      `<div class="p-3">
        <h3 class="font-bold text-base mb-2">${feature.properties.name}</h3>
        ${stats ? `
          <div class="text-sm space-y-1">
            <div><strong>Об'єктів:</strong> ${stats.count}</div>
            <div><strong>Щільність:</strong> ${stats.density} об/км²</div>
          </div>
        ` : ''}
      </div>`
    );

    layer.on('mouseover', function() {
      this.setStyle({ fillOpacity: 0.15, weight: 3 });
    });

    layer.on('mouseout', function() {
      this.setStyle({ fillOpacity: 0.08, weight: 2 });
    });
  };

  return (
    <>
      <GeoJSON key="region-border" data={zhytomyrRegionBorder} style={regionStyle} />
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

const OptimizedMap = ({ attractions = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [clusterStats, setClusterStats] = useState({});
  const [densityStats, setDensityStats] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        
        const statsRes = await axios.get(`${backendUrl}/api/clusters/statistics`);
        if (statsRes.data.success) {
          const statsMap = {};
          statsRes.data.data.forEach(stat => {
            statsMap[stat.id] = stat;
          });
          setClusterStats(statsMap);
        }

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

  const filteredAttractions = useMemo(() => {
    return attractions.filter((attr) => {
      const matchesCategory = selectedCategory === 'all' || attr.category === selectedCategory;
      const matchesSearch = !searchTerm || 
        attr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attr.address?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch && attr.coordinates?.lat && attr.coordinates?.lng;
    });
  }, [attractions, selectedCategory, searchTerm]);

  const statistics = useMemo(() => {
    const categoryCounts = {};
    filteredAttractions.forEach(attr => {
      categoryCounts[attr.category] = (categoryCounts[attr.category] || 0) + 1;
    });
    
    return {
      total: filteredAttractions.length,
      byCategory: categoryCounts
    };
  }, [filteredAttractions]);

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
            <Zap className="h-3 w-3 mr-1 inline" />
            Оптимізована карта
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Інтерактивна візуалізація кластерів
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Marker Clustering для плавної роботи з тисячами об'єктів
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="stat-card border-2 border-emerald-100">
            <CardContent className="pt-6 text-center">
              <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-3xl font-bold gradient-text">{statistics.total}</p>
              <p className="text-sm text-slate-600">Об'єктів</p>
            </CardContent>
          </Card>

          <Card className="stat-card border-2 border-blue-100">
            <CardContent className="pt-6 text-center">
              <Layers className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-3xl font-bold gradient-text">{Object.keys(statistics.byCategory).length}</p>
              <p className="text-sm text-slate-600">Категорій</p>
            </CardContent>
          </Card>

          <Card className="stat-card border-2 border-purple-100">
            <CardContent className="pt-6 text-center">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold gradient-text">{densityStats.length}</p>
              <p className="text-sm text-slate-600">Районів</p>
            </CardContent>
          </Card>

          <Card className="stat-card border-2 border-amber-100">
            <CardContent className="pt-6 text-center">
              <Flame className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold gradient-text">Smart</p>
              <p className="text-sm text-slate-600">Clustering</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <Card className="lg:col-span-1 h-fit filter-sidebar shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-600" />
                Фільтри
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Пошук
                </label>
                <div className="relative search-box">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Назва об'єкта..."
                    className="w-full pl-9 pr-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Boundaries Toggle */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBoundaries}
                    onChange={(e) => setShowBoundaries(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium">Показати межі районів</span>
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
                          className={`category-button w-full text-left px-3 py-2 rounded-lg transition-all ${
                            selectedCategory === cat.id
                              ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 border-2 border-emerald-500'
                              : 'hover:bg-slate-50 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              <span className="text-sm font-medium">{cat.name}</span>
                            </span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                          {stats && cat.id !== 'all' && (
                            <div className="mt-1 text-xs text-emerald-600">
                              📊 {stats.visit_percentage}% відвідуваність
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card className="lg:col-span-3 map-container shadow-2xl border-2">
            <CardContent className="p-0">
              <div className="h-[700px] rounded-xl overflow-hidden relative">
                <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border-2 border-emerald-200">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-slate-700">
                      {filteredAttractions.length} об'єктів
                    </span>
                  </div>
                </div>

                <MapContainer
                  center={[50.5, 28.6]}
                  zoom={9}
                  className="h-full w-full"
                  ref={mapRef}
                  maxZoom={18}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />

                  <DistrictBoundaries showBoundaries={showBoundaries} densityStats={densityStats} />

                  <MarkerClusterGroup
                    chunkedLoading
                    iconCreateFunction={createClusterCustomIcon}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                    zoomToBoundsOnClick={true}
                    maxClusterRadius={60}
                  >
                    {filteredAttractions.map((attraction) => (
                      <Marker
                        key={attraction.id}
                        position={[attraction.coordinates.lat, attraction.coordinates.lng]}
                        icon={createCategoryIcon(attraction.category)}
                      >
                        <Popup>
                          <div className="p-2 min-w-[200px]">
                            <h3 className="font-bold text-base mb-2">{attraction.name}</h3>
                            
                            <Badge 
                              className="mb-2"
                              style={{ backgroundColor: categoryColors[attraction.category] }}
                            >
                              {categoryNames[attraction.category]}
                            </Badge>

                            {attraction.address && (
                              <div className="flex items-start gap-2 text-sm text-slate-700 mb-2">
                                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>{attraction.address}</span>
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MarkerClusterGroup>
                </MapContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <Card className="mt-6 bg-gradient-to-r from-emerald-50 via-blue-50 to-violet-50 border-2 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-slate-900 mb-2">
                  ⚡ Smart Clustering Technology
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  Використовується <strong>Marker Clustering</strong> для групування близьких об'єктів. 
                  При наближенні кластери автоматично розгортаються (spiderfy), показуючи окремі маркери. 
                  Це забезпечує плавну роботу навіть з 1,864 об'єктами на карті.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default OptimizedMap;
