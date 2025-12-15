import React from 'react';
import { Card, CardContent } from './ui/card';
import { Info } from 'lucide-react';

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
  historical: "Історичні",
  parks: 'Парки',
  shopping: 'Торгівля',
  culture: 'Культура',
  nature: "Природа",
  gastro: 'Гастро',
  hotels: 'Готелі',
};

const districtColors = {
  "zhytomyr": "#10b981",
  "berdychiv": "#f59e0b",
  "korosten": "#3b82f6",
  "zviahel": "#8b5cf6"
};

const districtNames = {
  "zhytomyr": "Житомирський",
  "berdychiv": "Бердичівський",
  "korosten": "Коростенський",
  "zviahel": "Звягельський"
};

const MapLegend = () => {
  return (
    <Card className="absolute bottom-6 left-6 z-[1000] shadow-xl border-2 border-slate-200 bg-white/95 backdrop-blur-sm max-w-xs">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Info className="h-4 w-4 text-emerald-600" />
            <h4 className="font-bold text-sm text-slate-900">Легенда</h4>
          </div>

          {/* Districts */}
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Райони області:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(districtNames).map(([key, name]) => (
                <div key={key} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border-2 border-white shadow-sm"
                    style={{ backgroundColor: districtColors[key] }}
                  ></div>
                  <span className="text-xs text-slate-700">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Категорії об'єктів:</p>
            <div className="space-y-1.5">
              {Object.entries(categoryNames).map(([key, name]) => (
                <div key={key} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: categoryColors[key] }}
                  ></div>
                  <span className="text-xs text-slate-700">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cluster Info */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                10+
              </div>
              <span className="text-xs text-slate-700">Кластер об'єктів</span>
            </div>
            <p className="text-xs text-slate-500 ml-8">Натисніть для розгортання</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapLegend;
