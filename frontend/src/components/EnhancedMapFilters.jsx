import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Filter, MapPin, Star, Layers, X } from 'lucide-react';

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

const districtColors = {
  "zhytomyr": "#10b981",
  "berdychiv": "#f59e0b",
  "korosten": "#3b82f6",
  "novohrad": "#8b5cf6"
};

const districtNames = {
  "zhytomyr": "Житомирський",
  "berdychiv": "Бердичівський",
  "korosten": "Коростенський",
  "novohrad": "Новоград-Волинський"
};

const EnhancedMapFilters = ({ 
  categoryFilter, 
  setCategoryFilter,
  ratingFilter,
  setRatingFilter,
  districtFilter,
  setDistrictFilter,
  showHeatmap,
  setShowHeatmap,
  totalAttractions,
  filteredCount
}) => {
  return (
    <Card className="mb-6 shadow-lg border-2 border-slate-200">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-900">Фільтри карти</h3>
            </div>
            <Badge variant="outline" className="text-emerald-700 border-emerald-300">
              {filteredCount} з {totalAttractions} об'єктів
            </Badge>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Категорії
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={categoryFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setCategoryFilter('all')}
                className={categoryFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Всі
              </Button>
              {Object.entries(categoryNames).map(([key, name]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={categoryFilter === key ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(key)}
                  style={{
                    backgroundColor: categoryFilter === key ? categoryColors[key] : 'transparent',
                    borderColor: categoryColors[key],
                    color: categoryFilter === key ? 'white' : categoryColors[key]
                  }}
                  className="hover:opacity-80"
                >
                  <span 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: categoryColors[key] }}
                  ></span>
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* District Filter */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Райони
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={districtFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setDistrictFilter('all')}
                className={districtFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              >
                Всі райони
              </Button>
              {Object.entries(districtNames).map(([key, name]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={districtFilter === key ? 'default' : 'outline'}
                  onClick={() => setDistrictFilter(key)}
                  style={{
                    backgroundColor: districtFilter === key ? districtColors[key] : 'transparent',
                    borderColor: districtColors[key],
                    color: districtFilter === key ? 'white' : districtColors[key]
                  }}
                  className="hover:opacity-80"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center gap-2">
              <Star className="h-4 w-4" />
              Мінімальний рейтинг
            </label>
            <div className="flex gap-2">
              {[0, 3, 3.5, 4, 4.5].map((rating) => (
                <Button
                  key={rating}
                  size="sm"
                  variant={ratingFilter === rating ? 'default' : 'outline'}
                  onClick={() => setRatingFilter(rating)}
                  className={ratingFilter === rating ? 'bg-amber-500 hover:bg-amber-600' : 'border-amber-300 text-amber-700'}
                >
                  {rating === 0 ? 'Всі' : `${rating}+ ⭐`}
                </Button>
              ))}
            </div>
          </div>

          {/* Heatmap Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-slate-900">Теплова карта щільності</p>
              <p className="text-xs text-slate-600">Показати концентрацію об'єктів</p>
            </div>
            <Button
              variant={showHeatmap ? 'default' : 'outline'}
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={showHeatmap ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {showHeatmap ? 'Вимкнути' : 'Увімкнути'}
            </Button>
          </div>

          {/* Clear Filters */}
          {(categoryFilter !== 'all' || ratingFilter !== 0 || districtFilter !== 'all') && (
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter('all');
                setRatingFilter(0);
                setDistrictFilter('all');
              }}
              className="w-full border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <X className="h-4 w-4 mr-2" />
              Скинути всі фільтри
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedMapFilters;
