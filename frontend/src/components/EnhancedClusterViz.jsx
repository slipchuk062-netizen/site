import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, BarChart, Bar, Legend
} from 'recharts';
import { Users, MapPin, TrendingUp, Activity, Layers } from 'lucide-react';
import axios from 'axios';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#14b8a6', '#f43f5e', '#6366f1'];

const EnhancedClusterViz = () => {
  const [clusterData, setClusterData] = useState([]);
  const [densityData, setDensityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      const [statsRes, densityRes] = await Promise.all([
        axios.get(`${backendUrl}/api/clusters/statistics`),
        axios.get(`${backendUrl}/api/clusters/density`)
      ]);

      if (statsRes.data.success) {
        setClusterData(statsRes.data.data);
      }

      if (densityRes.data.success) {
        setDensityData(densityRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Prepare data for visualizations
  const scatterData = clusterData.map((cluster, index) => ({
    x: cluster.count,
    y: cluster.visit_percentage,
    z: cluster.popularity_score,
    name: cluster.name,
    color: COLORS[index % COLORS.length]
  }));

  const radarData = clusterData.map(cluster => ({
    cluster: cluster.name.split(' ')[0],
    'Кількість': cluster.count / 10, // Normalized
    'Відвідуваність': cluster.visit_percentage,
    'Популярність': cluster.popularity_score,
  }));

  const densityBarData = densityData.map(district => ({
    name: district.name.replace(' район', ''),
    'Щільність об\'єктів': parseFloat((district.density * 1000).toFixed(1)),
    'Кількість': district.count,
    'Популярність': district.popularity_index * 100
  }));

  // Calculate tourist density (mock data based on object density)
  const touristDensityData = densityData.map(district => ({
    name: district.name.replace(' район', ''),
    'Щільність туристів': parseFloat((district.density * district.popularity_index * 500).toFixed(0)),
    'Індекс популярності': district.popularity_index * 100
  }));

  return (
    <section className="py-20 bg-gradient-to-b from-white via-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-purple-700 border-purple-300 bg-purple-50">
            <Layers className="h-3 w-3 mr-1 inline" />
            Візуалізація кластеризації
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Глибинний аналіз туристичних кластерів
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Комплексна візуалізація щільності об'єктів, відвідуваності та туристичних потоків
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="border-2 border-purple-100 hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center">
              <MapPin className="h-10 w-10 text-purple-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-purple-900">
                {clusterData.reduce((sum, c) => sum + c.count, 0)}
              </p>
              <p className="text-sm text-slate-600 font-medium">Об'єктів</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-100 hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-emerald-900">
                {(clusterData.reduce((sum, c) => sum + c.visit_percentage, 0) / clusterData.length).toFixed(1)}%
              </p>
              <p className="text-sm text-slate-600 font-medium">Середня відвідуваність</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center">
              <Activity className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-blue-900">
                {(densityData.reduce((sum, d) => sum + d.density, 0) / densityData.length).toFixed(3)}
              </p>
              <p className="text-sm text-slate-600 font-medium">Середня щільність</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-100 hover:shadow-lg transition-all">
            <CardContent className="pt-6 text-center">
              <Users className="h-10 w-10 text-amber-600 mx-auto mb-3" />
              <p className="text-3xl font-bold text-amber-900">
                {touristDensityData.reduce((sum, d) => sum + d['Щільність туристів'], 0).toLocaleString()}
              </p>
              <p className="text-sm text-slate-600 font-medium">Туристів/рік</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="scatter" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="scatter">Scatter Plot</TabsTrigger>
            <TabsTrigger value="radar">Radar Chart</TabsTrigger>
            <TabsTrigger value="density">Щільність об'єктів</TabsTrigger>
            <TabsTrigger value="tourists">Щільність туристів</TabsTrigger>
          </TabsList>

          {/* Scatter Plot */}
          <TabsContent value="scatter" className="space-y-6">
            <Card className="shadow-xl border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Кореляція: Кількість об'єктів vs Відвідуваність
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 80, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Кількість об'єктів"
                      label={{ value: 'Кількість об\'єктів', position: 'bottom', offset: 10 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Відвідуваність %"
                      label={{ value: 'Відвідуваність %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-4 border-2 border-slate-200 rounded-lg shadow-lg">
                              <p className="font-bold text-slate-900 mb-2">{data.name}</p>
                              <p className="text-sm text-slate-600">Об'єктів: <strong>{data.x}</strong></p>
                              <p className="text-sm text-slate-600">Відвідуваність: <strong>{data.y}%</strong></p>
                              <p className="text-sm text-slate-600">Популярність: <strong>{data.z}</strong></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Кластери" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>

                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-2">Інсайт</h4>
                  <p className="text-sm text-slate-700">
                    Діаграма показує залежність між кількістю об'єктів в кластері та відвідуваністю. 
                    Розмір точок пропорційний показнику популярності.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Radar Chart */}
          <TabsContent value="radar" className="space-y-6">
            <Card className="shadow-xl border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-emerald-600" />
                  Багатовимірний аналіз кластерів
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={500}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="cluster" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Кількість"
                      dataKey="Кількість"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Відвідуваність"
                      dataKey="Відвідуваність"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Популярність"
                      dataKey="Популярність"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.3}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>

                <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-2">Інсайт</h4>
                  <p className="text-sm text-slate-700">
                    Radar chart дозволяє порівняти кластери за трьома параметрами одночасно: 
                    кількість об'єктів, відвідуваність та популярність.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Object Density */}
          <TabsContent value="density" className="space-y-6">
            <Card className="shadow-xl border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Щільність туристичних об'єктів по районах
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={densityBarData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="Щільність об'єктів" fill="#3b82f6" name="Щільність (об/1000км²)" />
                    <Bar yAxisId="right" dataKey="Кількість" fill="#10b981" name="Всього об'єктів" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {densityData.map((district, index) => (
                    <div key={district.id} className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <h4 className="font-bold text-blue-900 mb-2">{district.name}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-700">Об'єктів:</span>
                          <span className="font-bold text-blue-800">{district.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-700">Площа:</span>
                          <span className="font-bold text-blue-800">{district.area_km2} км²</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-700">Щільність:</span>
                          <span className="font-bold text-emerald-700">{district.density} об/км²</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-2">Формула розрахунку</h4>
                  <div className="font-mono text-sm bg-white p-3 rounded border border-blue-200">
                    ρ = N / A
                    <div className="text-xs text-slate-600 mt-1">
                      де ρ - щільність, N - кількість об'єктів, A - площа району
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tourist Density */}
          <TabsContent value="tourists" className="space-y-6">
            <Card className="shadow-xl border-2 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  Щільність туристичних потоків по районах
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={touristDensityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Щільність туристів" fill="#f59e0b" name="Туристів на рік" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {touristDensityData.map((district, index) => (
                    <div key={index} className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                      <h4 className="font-bold text-amber-900 mb-2">{district.name}</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-700">Туристів/рік:</span>
                          <span className="font-bold text-amber-800">
                            ~{district['Щільність туристів'].toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-700">Популярність:</span>
                          <span className="font-bold text-emerald-700">
                            {district['Індекс популярності'].toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-bold text-slate-900 mb-2">Методологія розрахунку</h4>
                  <p className="text-sm text-slate-700 mb-2">
                    Щільність туристичних потоків оцінюється на основі:
                  </p>
                  <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                    <li>Щільності туристичних об'єктів (ρ)</li>
                    <li>Індексу популярності району (P)</li>
                    <li>Коефіцієнта конверсії відвідувань (K = 500)</li>
                  </ul>
                  <div className="font-mono text-sm bg-white p-3 rounded border border-amber-200 mt-2">
                    Туристи = ρ × P × K
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default EnhancedClusterViz;
