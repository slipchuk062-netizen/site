import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Activity, TrendingUp, Map as MapIcon, BarChart3, 
  Database, Layers, ChartScatter
} from 'lucide-react';
import axios from 'axios';

const COLORS = {
  amber: '#f59e0b',
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  rose: '#f43f5e',
  indigo: '#6366f1'
};

const ClusterAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.get(`${backendUrl}/api/clusters/analytics`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-20">Помилка завантаження даних</div>;
  }

  const { cluster_statistics, district_density, clustering_metrics, methodology } = analytics;

  // Prepare data for charts
  const pieChartData = cluster_statistics.map(cluster => ({
    name: cluster.name,
    value: cluster.count,
    color: COLORS[cluster.color]
  }));

  const barChartData = cluster_statistics.map(cluster => ({
    name: cluster.name.split(' ')[0],
    'Кількість об\'єктів': cluster.count,
    'Відвідуваність %': cluster.visit_percentage,
    color: COLORS[cluster.color]
  }));

  const densityData = district_density.map(district => ({
    name: district.name.replace(' район', ''),
    'Щільність': district.density,
    'Кількість': district.count,
    'Популярність': district.popularity_index * 100
  }));

  const radarData = cluster_statistics.slice(0, 7).map(cluster => ({
    subject: cluster.name.split(' ')[0],
    value: cluster.popularity_score,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-300 bg-emerald-50">
            Науковий підхід до кластеризації
          </Badge>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Аналітика туристичної кластеризації
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Комплексний аналіз розподілу туристичних об'єктів Житомирської області 
            з використанням алгоритмів машинного навчання та геопросторового аналізу
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-2 border-emerald-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Всього об'єктів</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {clustering_metrics.total_objects}
                  </p>
                </div>
                <Database className="h-10 w-10 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Кластерів</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {clustering_metrics.total_clusters}
                  </p>
                </div>
                <Layers className="h-10 w-10 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-violet-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Silhouette Score</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {clustering_metrics.silhouette_score}
                  </p>
                </div>
                <Activity className="h-10 w-10 text-violet-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Середньо/кластер</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {clustering_metrics.avg_objects_per_cluster}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Огляд</TabsTrigger>
            <TabsTrigger value="clusters">Кластери</TabsTrigger>
            <TabsTrigger value="density">Щільність</TabsTrigger>
            <TabsTrigger value="methodology">Методологія</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartScatter className="h-5 w-5 text-emerald-600" />
                    Розподіл об'єктів по кластерах
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-violet-600" />
                    Популярність кластерів
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="Популярність"
                        dataKey="value"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Metrics Table */}
            <Card>
              <CardHeader>
                <CardTitle>Метрики якості кластеризації</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Silhouette Score</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {clustering_metrics.silhouette_score}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Оцінка згуртованості кластерів
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Davies-Bouldin Index</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {clustering_metrics.davies_bouldin_index}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Індекс розподілу кластерів
                    </p>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Calinski-Harabasz Score</p>
                    <p className="text-2xl font-bold text-violet-700">
                      {clustering_metrics.calinski_harabasz_score}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Оцінка варіації між кластерами
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clusters Tab */}
          <TabsContent value="clusters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Порівняльний аналіз кластерів
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Кількість об'єктів" fill="#10b981" />
                    <Bar yAxisId="right" dataKey="Відвідуваність %" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cluster Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Детальна статистика кластерів</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Кластер</th>
                        <th className="text-right py-3 px-4">Об'єкти</th>
                        <th className="text-right py-3 px-4">%</th>
                        <th className="text-right py-3 px-4">Відвідування</th>
                        <th className="text-right py-3 px-4">Рейтинг</th>
                        <th className="text-right py-3 px-4">Популярність</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cluster_statistics.map((cluster) => (
                        <tr key={cluster.id} className="border-b hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[cluster.color] }}
                              />
                              {cluster.name}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-medium">{cluster.count}</td>
                          <td className="text-right py-3 px-4">{cluster.percentage}%</td>
                          <td className="text-right py-3 px-4">{cluster.visit_percentage}%</td>
                          <td className="text-right py-3 px-4">{cluster.avg_rating} ⭐</td>
                          <td className="text-right py-3 px-4">
                            <Badge variant="secondary">{cluster.popularity_score}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Density Tab */}
          <TabsContent value="density" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapIcon className="h-5 w-5 text-emerald-600" />
                  Щільність об'єктів по районах
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={densityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Щільність" fill="#10b981" />
                    <Bar dataKey="Популярність" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* District Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {district_density.map((district) => (
                <Card key={district.id} className="border-2 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{district.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Кількість об'єктів:</span>
                        <span className="font-bold">{district.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Площа:</span>
                        <span className="font-bold">{district.area_km2} км²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Щільність:</span>
                        <span className="font-bold text-emerald-600">
                          {district.density} об/км²
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Індекс популярності:</span>
                        <span className="font-bold text-amber-600">
                          {(district.popularity_index * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Methodology Tab */}
          <TabsContent value="methodology" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Методологія кластеризації</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {methodology.algorithm}
                </h3>
                <p className="text-slate-700 mb-6">{methodology.description}</p>

                <h4 className="text-lg font-semibold text-slate-900 mb-3">
                  Етапи розробки системи кластеризації:
                </h4>
                <ol className="space-y-2 mb-6">
                  {methodology.steps.map((step, index) => (
                    <li key={index} className="text-slate-700">
                      {step}
                    </li>
                  ))}
                </ol>

                <h4 className="text-lg font-semibold text-slate-900 mb-3">
                  Пояснення метрик:
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="font-semibold text-emerald-900">Silhouette Score</p>
                    <p className="text-sm text-slate-700">
                      {methodology.metrics_explanation.silhouette_score}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-900">Davies-Bouldin Index</p>
                    <p className="text-sm text-slate-700">
                      {methodology.metrics_explanation.davies_bouldin_index}
                    </p>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-lg">
                    <p className="font-semibold text-violet-900">Щільність</p>
                    <p className="text-sm text-slate-700">
                      {methodology.metrics_explanation.density}
                    </p>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-slate-900 mt-6 mb-3">
                  Формула розрахунку щільності:
                </h4>
                <div className="p-4 bg-slate-100 rounded-lg font-mono text-sm">
                  <p>ρ = N / A</p>
                  <p className="text-xs text-slate-600 mt-2">
                    де ρ - щільність, N - кількість об'єктів, A - площа району (км²)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClusterAnalytics;
