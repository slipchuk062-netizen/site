import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, MapPin, Activity } from 'lucide-react';
import axios from 'axios';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const VisitStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.get(`${backendUrl}/api/visits/statistics`);
      
      if (response.data.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const topAttractions = statistics.top_attractions.slice(0, 10);
  const pieData = statistics.top_attractions.slice(0, 7).map((attr, index) => ({
    name: attr.attraction_name?.substring(0, 20) || 'Unknown',
    value: attr.total_visits
  }));

  return (
    <section id="statistics" className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-blue-700 border-blue-300 bg-blue-50">
            <Activity className="h-3 w-3 mr-1 inline" />
            Статистика відвідувань
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Популярні туристичні об'єкти
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Реальна статистика відвідувань найпопулярніших місць Житомирської області
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-emerald-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Всього відвідувань</p>
                  <p className="text-3xl font-bold text-emerald-700">
                    {statistics.total_visits?.toLocaleString()}
                  </p>
                </div>
                <Users className="h-12 w-12 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Популярних об'єктів</p>
                  <p className="text-3xl font-bold text-blue-700">
                    {topAttractions.length}
                  </p>
                </div>
                <MapPin className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Середньо на об'єкт</p>
                  <p className="text-3xl font-bold text-purple-700">
                    {Math.round(statistics.total_visits / topAttractions.length)}
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Bar Chart */}
          <Card className="shadow-xl border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Топ-10 найвідвідуваніших місць
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topAttractions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="attraction_name" 
                    angle={-45}
                    textAnchor="end"
                    height={120}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total_visits" fill="#10b981" name="Відвідувань" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="shadow-xl border-2 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Розподіл відвідувань (Топ-7)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card className="shadow-xl border-2 border-slate-200">
          <CardHeader>
            <CardTitle>Детальна статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Назва</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Відвідувань</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">% від загальних</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">Тренд</th>
                  </tr>
                </thead>
                <tbody>
                  {topAttractions.map((attr, index) => {
                    const percentage = (attr.total_visits / statistics.total_visits * 100).toFixed(1);
                    
                    return (
                      <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-400 text-white' :
                            index === 1 ? 'bg-slate-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-slate-200 text-slate-700'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {attr.attraction_name}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {attr.total_visits.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge variant="secondary">{percentage}%</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <TrendingUp className="h-5 w-5 text-emerald-600 inline" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default VisitStatistics;
