import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Search, MapPin, Clock, Phone, Globe, X, Filter, List, Map as MapIcon } from 'lucide-react';
import { districts, getDistrictByCoords, districtColors, districtNames } from '../data/districts';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons by category
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

const createCustomIcon = (category) => {
  const color = categoryColors[category] || '#6b7280';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

// Map controller component
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, { duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
};

const InteractiveMap = ({ attractions }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState(Object.keys(categoryColors));
  const [activeDistricts, setActiveDistricts] = useState(districts.map(d => d.id));
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const mapRef = useRef(null);

  // Zhytomyr oblast center coordinates
  const defaultCenter = [50.75, 28.5];
  const defaultZoom = 8;

  // Add district info to attractions
  const attractionsWithDistrict = useMemo(() => {
    return attractions.map(attr => ({
      ...attr,
      district: getDistrictByCoords(attr.coordinates.lat, attr.coordinates.lng)
    }));
  }, [attractions]);

  // Filter attractions
  const filteredAttractions = useMemo(() => {
    return attractionsWithDistrict.filter((attr) => {
      const matchesCategory = activeCategories.includes(attr.category);
      const matchesDistrict = activeDistricts.includes(attr.district);
      const matchesSearch = !searchQuery || 
        attr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attr.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesDistrict && matchesSearch;
    });
  }, [attractionsWithDistrict, activeCategories, activeDistricts, searchQuery]);

  const toggleCategory = (category) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleDistrict = (districtId) => {
    setActiveDistricts((prev) =>
      prev.includes(districtId)
        ? prev.filter((d) => d !== districtId)
        : [...prev, districtId]
    );
  };

  const selectAllCategories = () => {
    setActiveCategories(Object.keys(categoryColors));
  };

  const clearAllCategories = () => {
    setActiveCategories([]);
  };

  const selectAllDistricts = () => {
    setActiveDistricts(districts.map(d => d.id));
  };

  const handleAttractionClick = (attr) => {
    setSelectedAttraction(attr);
    setMapCenter([attr.coordinates.lat, attr.coordinates.lng]);
    setViewMode('map');
  };

  // Group attractions by category for stats
  const categoryCounts = useMemo(() => {
    const counts = {};
    attractionsWithDistrict.forEach((attr) => {
      counts[attr.category] = (counts[attr.category] || 0) + 1;
    });
    return counts;
  }, [attractionsWithDistrict]);

  // District counts
  const districtCounts = useMemo(() => {
    const counts = {};
    attractionsWithDistrict.forEach((attr) => {
      counts[attr.district] = (counts[attr.district] || 0) + 1;
    });
    return counts;
  }, [attractionsWithDistrict]);

  // GeoJSON style for districts
  const getDistrictStyle = (feature) => {
    const districtId = feature.properties.id;
    const isActive = activeDistricts.includes(districtId);
    return {
      fillColor: districtColors[districtId] || '#gray',
      fillOpacity: isActive ? 0.3 : 0.1,
      color: districtColors[districtId] || '#gray',
      weight: isActive ? 3 : 1,
      opacity: isActive ? 1 : 0.5
    };
  };

  const onEachDistrict = (feature, layer) => {
    const districtId = feature.properties.id;
    const name = feature.properties.name;
    const count = districtCounts[districtId] || 0;
    
    layer.bindTooltip(`${name}: ${count} об'єктів`, {
      permanent: false,
      direction: 'center',
      className: 'district-tooltip'
    });
    
    layer.on({
      click: () => {
        toggleDistrict(districtId);
      }
    });
  };

  return (
    <section id="map" className="py-20 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-300 bg-emerald-50">
            Інтерактивна карта
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Дослідіть Житомирщину
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {filteredAttractions.length} об'єктів на карті. Оберіть категорії та знайдіть цікаві місця
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Пошук за назвою або адресою..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* View toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
                className={viewMode === 'map' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <MapIcon className="w-4 h-4 mr-2" />
                Карта
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                <List className="w-4 h-4 mr-2" />
                Список
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Category filters */}
          <div className={`mt-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Districts filter */}
            <div className="flex flex-wrap gap-2 items-center mb-3 pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 mr-2">Райони:</span>
              {districts.map((district) => (
                <button
                  key={district.id}
                  onClick={() => toggleDistrict(district.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeDistricts.includes(district.id)
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: activeDistricts.includes(district.id) ? district.color : undefined,
                  }}
                >
                  {district.name}
                  <span className="text-xs opacity-80">({districtCounts[district.id] || 0})</span>
                </button>
              ))}
              <button
                onClick={selectAllDistricts}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium ml-auto"
              >
                Усі райони
              </button>
            </div>

            {/* Categories filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-slate-500 mr-2">Категорії:</span>
              {Object.entries(categoryNames).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeCategories.includes(key)
                      ? 'text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  style={{
                    backgroundColor: activeCategories.includes(key) ? categoryColors[key] : undefined,
                  }}
                >
                  {name}
                  <span className="text-xs opacity-80">({categoryCounts[key] || 0})</span>
                </button>
              ))}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={selectAllCategories}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Усі
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={clearAllCategories}
                  className="text-sm text-slate-500 hover:text-slate-700 font-medium"
                >
                  Очистити
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Map and List Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar with list */}
          <div className={`lg:col-span-1 ${viewMode === 'list' ? 'block' : 'hidden lg:block'}`}>
            <Card className="border-0 shadow-xl h-[600px]">
              <CardContent className="p-0 h-full">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    {filteredAttractions.slice(0, 100).map((attr) => (
                      <div
                        key={attr.id}
                        onClick={() => handleAttractionClick(attr)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                          selectedAttraction?.id === attr.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-transparent bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: categoryColors[attr.category] }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">{attr.name}</h4>
                            <p className="text-sm text-slate-500 truncate">{attr.address}</p>
                            {attr.workingHours && (
                              <p className="text-xs text-slate-400 mt-1">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {attr.workingHours}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredAttractions.length > 100 && (
                      <p className="text-center text-sm text-slate-500 py-4">
                        Показано 100 з {filteredAttractions.length} об'єктів. Використайте пошук для уточнення.
                      </p>
                    )}
                    {filteredAttractions.length === 0 && (
                      <p className="text-center text-slate-500 py-8">
                        Об'єкти не знайдено. Спробуйте змінити фільтри.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className={`lg:col-span-2 ${viewMode === 'map' ? 'block' : 'hidden lg:block'}`}>
            <Card className="border-0 shadow-xl overflow-hidden h-[600px]">
              <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                className="h-full w-full"
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* District boundaries */}
                {districts.map((district) => (
                  <GeoJSON
                    key={`${district.id}-${activeDistricts.includes(district.id)}`}
                    data={district.bounds}
                    style={{
                      fillColor: district.color,
                      fillOpacity: activeDistricts.includes(district.id) ? 0.15 : 0.05,
                      color: district.color,
                      weight: activeDistricts.includes(district.id) ? 4 : 2,
                      opacity: activeDistricts.includes(district.id) ? 0.9 : 0.5
                    }}
                    onEachFeature={(feature, layer) => {
                      layer.bindTooltip(`${district.name}: ${districtCounts[district.id] || 0} об'єктів`, {
                        permanent: false,
                        direction: 'center',
                        className: 'district-tooltip'
                      });
                      layer.on({
                        click: () => toggleDistrict(district.id)
                      });
                    }}
                  />
                ))}

                {mapCenter && <MapController center={mapCenter} zoom={15} />}
                {filteredAttractions.map((attr) => (
                  <Marker
                    key={attr.id}
                    position={[attr.coordinates.lat, attr.coordinates.lng]}
                    icon={createCustomIcon(attr.category)}
                    eventHandlers={{
                      click: () => setSelectedAttraction(attr),
                    }}
                  >
                    <Popup maxWidth={300}>
                      <div className="p-1">
                        <div
                          className="w-full h-2 rounded-t-lg -mt-1 -mx-1 mb-2"
                          style={{ backgroundColor: categoryColors[attr.category], width: 'calc(100% + 8px)' }}
                        />
                        <h3 className="font-bold text-slate-900 text-base mb-1">{attr.name}</h3>
                        <div className="flex gap-1 mb-2">
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: categoryColors[attr.category], color: 'white' }}
                          >
                            {categoryNames[attr.category]}
                          </Badge>
                          <Badge
                            className="text-xs"
                            style={{ backgroundColor: districtColors[attr.district], color: 'white' }}
                          >
                            {districtNames[attr.district]}
                          </Badge>
                        </div>
                        {attr.description && (
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{attr.description}</p>
                        )}
                        <div className="space-y-1 text-sm">
                          {attr.address && attr.address !== 'Житомирська область' && (
                            <div className="flex items-start gap-2 text-slate-600">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                              <span>{attr.address}</span>
                            </div>
                          )}
                          {attr.workingHours && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                              <span>{attr.workingHours}</span>
                            </div>
                          )}
                          {attr.phone && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Phone className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                              <a href={`tel:${attr.phone}`} className="hover:text-emerald-600">
                                {attr.phone}
                              </a>
                            </div>
                          )}
                          {attr.website && (
                            <div className="flex items-center gap-2 text-slate-600">
                              <Globe className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                              <a
                                href={attr.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-emerald-600 truncate"
                              >
                                Вебсайт
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveMap;
