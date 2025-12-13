import React, { useState, useMemo, useEffect } from 'react';
import { clusters } from '../data/mock';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Landmark, Trees, ShoppingBag, Theater, Mountain, UtensilsCrossed, Bed, ArrowRight, TrendingUp, Activity } from 'lucide-react';
import axios from 'axios';

const iconMap = {
  Landmark,
  Trees,
  ShoppingBag,
  Theater,
  Mountain,
  UtensilsCrossed,
  Bed,
};

const colorMap = {
  amber: 'from-amber-500 to-orange-500 bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'from-emerald-500 to-green-500 bg-emerald-50 text-emerald-700 border-emerald-200',
  sky: 'from-sky-500 to-blue-500 bg-sky-50 text-sky-700 border-sky-200',
  violet: 'from-violet-500 to-purple-500 bg-violet-50 text-violet-700 border-violet-200',
  teal: 'from-teal-500 to-cyan-500 bg-teal-50 text-teal-700 border-teal-200',
  rose: 'from-rose-500 to-pink-500 bg-rose-50 text-rose-700 border-rose-200',
  indigo: 'from-indigo-500 to-blue-500 bg-indigo-50 text-indigo-700 border-indigo-200',
};

const categoryIdMap = {
  historical: 'historical',
  parks: 'parks',
  shopping: 'shopping',
  culture: 'culture',
  nature: 'nature',
  gastro: 'gastro',
  hotels: 'hotels',
};

const ClustersSection = ({ attractions = [] }) => {
  const [activeCluster, setActiveCluster] = useState(null);
  const [clusterStats, setClusterStats] = useState({});

  // Calculate counts from real data
  const clusterCounts = useMemo(() => {
    const counts = {};
    attractions.forEach((attr) => {
      counts[attr.category] = (counts[attr.category] || 0) + 1;
    });
    return counts;
  }, [attractions]);

  // Fetch cluster statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await axios.get(`${backendUrl}/api/clusters/statistics`);
        if (response.data.success) {
          const statsMap = {};
          response.data.data.forEach(stat => {
            statsMap[stat.id] = stat;
          });
          setClusterStats(statsMap);
        }
      } catch (error) {
        console.error('Error fetching cluster stats:', error);
      }
    };
    fetchStats();
  }, []);

  const getClusterAttractions = (clusterId) => {
    return attractions.filter((a) => a.category === categoryIdMap[clusterId]).slice(0, 5);
  };

  const scrollToMap = () => {
    const element = document.querySelector('#map');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="clusters" className="py-20 lg:py-32 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-300 bg-emerald-50">
            Туристичні кластери
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Оберіть свою пригоду
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Житомирщина пропонує різноманітні можливості для відпочинку —
            від історичних екскурсій до активного туризму
          </p>
        </div>

        {/* Clusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clusters.map((cluster) => {
            const IconComponent = iconMap[cluster.icon];
            const colors = colorMap[cluster.color];
            const clusterAttractions = getClusterAttractions(cluster.id);
            const isActive = activeCluster === cluster.id;
            const count = clusterCounts[categoryIdMap[cluster.id]] || 0;

            return (
              <Card
                key={cluster.id}
                className={`group cursor-pointer overflow-hidden transition-all duration-500 hover:shadow-2xl border-2 ${
                  isActive ? 'ring-2 ring-emerald-500 shadow-xl' : 'hover:border-slate-200'
                }`}
                onClick={() => setActiveCluster(isActive ? null : cluster.id)}
              >
                <CardContent className="p-6">
                  {/* Icon & Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colors.split(' ')[0]} ${colors.split(' ')[1]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {IconComponent && <IconComponent className="w-7 h-7 text-white" />}
                    </div>
                    <Badge className={`${colors.split(' ')[2]} ${colors.split(' ')[3]} ${colors.split(' ')[4]}`}>
                      {count} об'єктів
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {cluster.name}
                  </h3>
                  <p className="text-slate-600 mb-4 text-sm">{cluster.description}</p>

                  {/* Expanded content */}
                  <div className={`overflow-hidden transition-all duration-500 ${
                    isActive ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-700 mb-3">Популярні місця:</p>
                      <div className="space-y-2">
                        {clusterAttractions.map((attr) => (
                          <div
                            key={attr.id}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span className="truncate">{attr.name}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToMap();
                        }}
                        className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        Переглянути на карті
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center gap-2 mt-4 text-sm font-medium text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Дізнатися більше</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ClustersSection;
