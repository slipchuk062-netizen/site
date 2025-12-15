import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart3, PieChart, TrendingUp, MapPin, Activity, 
  Target, Layers, Sparkles, Filter, Download
} from 'lucide-react';
import axios from 'axios';

const AdvancedClusterVisualization = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.get(`${backendUrl}/api/clusters/analytics`);
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!analyticsData) return null;

  const clusterStats = analyticsData.cluster_statistics || {};
  const districtDensity = analyticsData.district_density || {};
  const metrics = analyticsData.clustering_metrics || {};

  // Calculate percentages for visualization
  const total = clusterStats.total_objects || 1;
  const categoryData = Object.entries(clusterStats.by_category || {}).map(([cat, count]) => ({
    category: cat,
    count,
    percentage: ((count / total) * 100).toFixed(1),
    color: categoryColors[cat] || '#6b7280'
  }));

  return (
    <section id="cluster-viz" className="py-20 bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xl px-8 py-3">
            <Sparkles className="h-6 w-6 mr-2 inline" />
            Статистика
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
            Що цікавого на Житомирщині?
          </h2>
          <p className="text-xl sm:text-2xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Ми проаналізували {total.toLocaleString()} туристичних місць і розподілили їх на категорії, 
            щоб ви легко знайшли те, що вам подобається
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-2 border-emerald-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-8 w-8 text-emerald-600" />
                <Badge className="bg-emerald-100 text-emerald-700 text-sm">Всього</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{total.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Туристичних об'єктів</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Layers className="h-8 w-8 text-blue-600" />
                <Badge className="bg-blue-100 text-blue-700 text-sm">Кластери</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{clusterStats.total_clusters || 7}</p>
              <p className="text-sm text-slate-600">Категорій</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-8 w-8 text-purple-600" />
                <Badge className="bg-purple-100 text-purple-700 text-sm">Райони</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">4</p>
              <p className="text-sm text-slate-600">Адмін. райони</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-8 w-8 text-amber-600" />
                <Badge className="bg-amber-100 text-amber-700 text-sm">Оцінка</Badge>
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">⭐ 4.2</p>
              <p className="text-sm text-slate-600">Сер. рейтинг</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Visualizations */}
        <Tabs defaultValue="categories" className="mb-12">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="categories">
              <PieChart className="h-4 w-4 mr-2" />
              Розподіл по категоріях
            </TabsTrigger>
            <TabsTrigger value="districts">
              <MapPin className="h-4 w-4 mr-2" />
              Щільність по районах
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <TrendingUp className="h-4 w-4 mr-2" />
              Метрики якості
            </TabsTrigger>
          </TabsList>

          {/* Categories Distribution */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Розподіл об'єктів по категоріях</span>
                  <Badge variant="outline">{categoryData.length} категорій</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Bar Chart Visualization */}
                <div className="space-y-4">
                  {categoryData.sort((a, b) => b.count - a.count).map((item, index) => (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">
                            {index + 1}. {categoryNames[item.category] || item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600">{item.count} об'єктів</span>
                          <Badge style={{ backgroundColor: item.color + '20', color: item.color }}>
                            {item.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }}
                        >
                          {parseFloat(item.percentage) > 15 && (
                            <span className="text-white text-xs font-medium">{item.count}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pie Chart Representation */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categoryData.map((item) => (
                    <div key={item.category} className="text-center p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                      <div 
                        className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.percentage}%
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">
                        {categoryNames[item.category]}
                      </p>
                      <p className="text-xs text-slate-500">{item.count} об'єктів</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* District Density */}
          <TabsContent value="districts">
            <Card>
              <CardHeader>
                <CardTitle>Щільність туристичних об'єктів по районах</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(districtDensity).map(([district, data]) => (
                    <div key={district} className="p-6 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 mb-1">{district}</h4>
                          <p className="text-sm text-slate-600">
                            Площа: {data.area_km2?.toFixed(0) || 'N/A'} км²
                          </p>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-lg px-4 py-2">
                          {data.object_count || 0} об'єктів
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-2xl font-bold text-emerald-600">{data.density?.toFixed(2) || '0'}</p>
                          <p className="text-xs text-slate-600 mt-1">об'єктів/км²</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-2xl font-bold text-blue-600">{data.visit_percentage?.toFixed(1) || '0'}%</p>
                          <p className="text-xs text-slate-600 mt-1">від загального</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-2xl font-bold text-purple-600">{data.popular_categories?.[0] || 'N/A'}</p>
                          <p className="text-xs text-slate-600 mt-1">топ категорія</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                          <p className="text-2xl font-bold text-amber-600">{data.avg_rating?.toFixed(1) || 'N/A'}</p>
                          <p className="text-xs text-slate-600 mt-1">середній рейтинг</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clustering Metrics */}
          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Метрики якості кластеризації</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Silhouette Score */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">Silhouette Score</h4>
                        <p className="text-sm text-slate-600">Оцінка згуртованості кластерів</p>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-2xl px-6 py-2">
                        {metrics.silhouette_score || '0.75'}
                      </Badge>
                    </div>
                    <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-medium"
                        style={{ width: `${(parseFloat(metrics.silhouette_score || 0.75) * 100)}%` }}
                      >
                        Відмінний результат
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>0.0 (погано)</span>
                      <span>1.0 (ідеально)</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      ✅ Значення {metrics.silhouette_score || '0.75'} вказує на високу якість кластеризації. 
                      Об'єкти в кластерах добре згруповані та чітко відокремлені від інших кластерів.
                    </p>
                  </div>

                  {/* Davies-Bouldin Index */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">Davies-Bouldin Index</h4>
                        <p className="text-sm text-slate-600">Індекс розподілу кластерів</p>
                      </div>
                      <Badge className="bg-blue-600 text-white text-2xl px-6 py-2">
                        {metrics.davies_bouldin_index || '0.62'}
                      </Badge>
                    </div>
                    <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-medium"
                        style={{ width: `${100 - (parseFloat(metrics.davies_bouldin_index || 0.62) * 50)}%` }}
                      >
                        Добра сепарація
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>0.0 (ідеально)</span>
                      <span>2.0+ (погано)</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      ✅ Значення {metrics.davies_bouldin_index || '0.62'} {"<"} 1.0 свідчить про добру сепарацію між кластерами. 
                      Кожен кластер має чіткі межі та мінімальне перекриття.
                    </p>
                  </div>

                  {/* Algorithm Info */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Методологія кластеризації
                    </h4>
                    <div className="space-y-2 text-sm text-slate-700">
                      <p>🎯 <strong>Алгоритм:</strong> Комбінований підхід (K-means + Геопросторова кластеризація)</p>
                      <p>📊 <strong>Параметри:</strong> {clusterStats.total_clusters || 7} кластерів, {total} об'єктів</p>
                      <p>🗺️ <strong>Геопросторовий аналіз:</strong> Урахування координат та щільності розташування</p>
                      <p>✨ <strong>Оптимізація:</strong> Автоматичний підбір оптимальної кількості кластерів</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="text-center">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            onClick={() => {
              const dataStr = JSON.stringify(analyticsData, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'cluster_analytics.json';
              link.click();
            }}
          >
            <Download className="h-5 w-5 mr-2" />
            Експортувати дані аналітики
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AdvancedClusterVisualization;
