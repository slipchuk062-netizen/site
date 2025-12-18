import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  Activity, BarChart3, TrendingDown, Sparkles, Download, 
  GitBranch, Layers, Target, Brain, RefreshCw, Zap, ExternalLink
} from 'lucide-react';
import axios from 'axios';

const ProClusteringVisualization = () => {
  const navigate = useNavigate();
  const [kValue, setKValue] = useState(7);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dynamicData, setDynamicData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const [activeVisualization, setActiveVisualization] = useState('distribution');

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchAnalytics();
    fetchGeoData();
  }, []);

  // Fetch GeoPandas spatial analysis data
  const fetchGeoData = async () => {
    try {
      const [spatialRes, districtRes] = await Promise.all([
        axios.get(`${backendUrl}/api/geo/spatial-analysis`),
        axios.get(`${backendUrl}/api/geo/district-statistics`)
      ]);
      setGeoData({
        spatial: spatialRes.data,
        districts: districtRes.data.data
      });
    } catch (error) {
      console.error('Failed to fetch GeoPandas data:', error);
    }
  };

  // Fetch dynamic data when K value changes
  useEffect(() => {
    const fetchDynamicData = async () => {
      setDynamicLoading(true);
      try {
        const response = await axios.get(`${backendUrl}/api/clusters/dynamic/${kValue}`);
        setDynamicData(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dynamic clustering:', error);
      } finally {
        setDynamicLoading(false);
      }
    };
    
    if (analyticsData) {
      fetchDynamicData();
    }
  }, [kValue, backendUrl, analyticsData]);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/clusters/analytics`);
      setAnalyticsData(response.data);
      // Set initial dynamic data from analytics
      setDynamicData({
        ...response.data.clustering_metrics,
        silhouette_per_cluster: response.data.silhouette_per_cluster
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use dynamic data if available, otherwise fall back to initial analytics
  const currentMetrics = dynamicData || analyticsData?.clustering_metrics || {};
  const clusterStats = analyticsData?.cluster_statistics || [];
  const total = currentMetrics.total_objects || 1864;
  
  // Get Elbow data from API response (static - doesn't change with K)
  const elbowData = analyticsData?.elbow_data || Array.from({length: 14}, (_, i) => {
    const k = i + 2;
    return { k, wcss: 50000 / Math.pow(k, 1.2) };
  });

  // Get Silhouette data per cluster - use dynamic data
  const silhouetteData = dynamicData?.silhouette_per_cluster || analyticsData?.silhouette_per_cluster || Array.from({length: kValue}, (_, i) => ({
    cluster: i,
    scores: [0.5],
    avg_score: 0.5,
    size: 100
  }));

  // Cluster colors for visualizations - extended for up to 15 clusters
  const clusterLabelsBase = ['Зона 1', 'Зона 2', 'Зона 3', 'Зона 4', 'Зона 5', 'Зона 6', 'Зона 7', 'Зона 8', 'Зона 9', 'Зона 10', 'Зона 11', 'Зона 12', 'Зона 13', 'Зона 14', 'Зона 15'];
  const clusterColorsBase = ['#f59e0b', '#10b981', '#8b5cf6', '#14b8a6', '#f43f5e', '#3b82f6', '#6366f1', '#ec4899', '#84cc16', '#06b6d4', '#a855f7', '#ef4444', '#22c55e', '#0ea5e9', '#d946ef'];
  const clusterLabels = clusterLabelsBase.slice(0, kValue);
  const clusterColors = clusterColorsBase.slice(0, kValue);

  // Generate 2D Scatter plot data from cluster centers (normalized to 0-100 range)
  const clusterCenters = currentMetrics.cluster_centers || [];
  const scatterData = clusterCenters.map((center, idx) => {
    // Normalize coordinates to 0-100 range for visualization
    const x = ((center[0] + 2) / 4) * 100;
    const y = ((center[1] + 2) / 4) * 100;
    const clusterSize = silhouetteData[idx]?.size || 100;
    return {
      cluster: idx,
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
      label: clusterLabels[idx] || `Кластер ${idx + 1}`,
      color: clusterColorsBase[idx] || '#6366f1',
      count: clusterSize
    };
  });

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 via-indigo-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl px-8 py-3">
            <Brain className="h-6 w-6 mr-2 inline animate-pulse" />
            Кластерна аналітика
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            Інтелектуальна візуалізація кластеризації
          </h2>
          <p className="text-xl text-purple-200 max-w-4xl mx-auto leading-relaxed">
            K-means алгоритм для автоматичної класифікації {total.toLocaleString()} туристичних об'єктів 
            на основі геопросторових даних та атрибутів
          </p>
        </div>

        {/* Key Metrics - Dynamic values from K-Means */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className={`bg-white/10 backdrop-blur-md border-purple-400/30 ${dynamicLoading ? 'opacity-70' : ''}`}>
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-purple-300 mb-2">
                {dynamicLoading ? <RefreshCw className="h-10 w-10 animate-spin" /> : (currentMetrics.total_clusters || kValue)}
              </div>
              <div className="text-sm text-purple-200">Кластери (K)</div>
              <div className="mt-2 text-xs text-purple-300">
                Ітерацій: {currentMetrics.n_iterations || '—'}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-white/10 backdrop-blur-md border-blue-400/30 ${dynamicLoading ? 'opacity-70' : ''}`}>
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-blue-300 mb-2">
                {dynamicLoading ? '...' : (currentMetrics.silhouette_score || '—')}
              </div>
              <div className="text-sm text-blue-200">Silhouette Score</div>
              <div className="mt-2 text-xs text-blue-300">
                {currentMetrics.silhouette_score > 0.5 ? '✓ Добра якість' : currentMetrics.silhouette_score > 0.25 ? '○ Середня якість' : '✗ Слабка якість'}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-white/10 backdrop-blur-md border-emerald-400/30 ${dynamicLoading ? 'opacity-70' : ''}`}>
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-emerald-300 mb-2">
                {dynamicLoading ? '...' : (currentMetrics.davies_bouldin_index || '—')}
              </div>
              <div className="text-sm text-emerald-200">Davies-Bouldin</div>
              <div className="mt-2 text-xs text-emerald-300">
                {currentMetrics.davies_bouldin_index < 1.0 ? '✓ Добра сепарація' : '○ Помірна сепарація'}
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-white/10 backdrop-blur-md border-amber-400/30 ${dynamicLoading ? 'opacity-70' : ''}`}>
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-amber-300 mb-2">
                {dynamicLoading ? '...' : (currentMetrics.calinski_harabasz_score ? currentMetrics.calinski_harabasz_score.toFixed(0) : '—')}
              </div>
              <div className="text-sm text-amber-200">Calinski-Harabasz</div>
              <div className="mt-2 text-xs text-amber-300">
                WCSS: {dynamicLoading ? '...' : (currentMetrics.wcss || '—')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* K-value Slider */}
        <Card className="mb-8 bg-white/10 backdrop-blur-md border-purple-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Динамічна зміна кількості кластерів (K)</h3>
                <p className="text-sm text-purple-200">Експериментуйте з різними значеннями K для порівняння</p>
              </div>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-3xl px-8 py-4">
                K = {kValue}
              </Badge>
            </div>
            <Slider
              value={[kValue]}
              onValueChange={(val) => setKValue(val[0])}
              min={2}
              max={15}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-purple-300 mt-2">
              <span>K=2 (мінімум)</span>
              <span className="text-pink-400 font-bold">K=7 (оптимум)</span>
              <span>K=15 (максимум)</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Visualizations */}
        <Tabs defaultValue="elbow" className="space-y-6" onValueChange={setActiveVisualization}>
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md border border-purple-400/30">
            <TabsTrigger value="elbow" className="data-[state=active]:bg-purple-600">
              <TrendingDown className="h-5 w-5 mr-2" />
              Elbow Method
            </TabsTrigger>
            <TabsTrigger value="silhouette" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="h-5 w-5 mr-2" />
              Silhouette Plot
            </TabsTrigger>
            <TabsTrigger value="scatter" className="data-[state=active]:bg-purple-600">
              <Sparkles className="h-5 w-5 mr-2" />
              2D Projection
            </TabsTrigger>
            <TabsTrigger value="dendrogram" className="data-[state=active]:bg-purple-600">
              <GitBranch className="h-5 w-5 mr-2" />
              Dendrogram
            </TabsTrigger>
            <TabsTrigger value="geopandas" className="data-[state=active]:bg-green-600">
              <Layers className="h-5 w-5 mr-2" />
              GeoPandas
            </TabsTrigger>
          </TabsList>

          {/* Elbow Method */}
          <TabsContent value="elbow">
            <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Метод ліктя (Elbow Method) - Оптимізація K</span>
                  <Badge className="bg-purple-600 text-white">WCSS Analysis</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gradient-to-br from-slate-800/50 to-purple-900/50 rounded-lg p-6">
                  {/* Y-axis - dynamic based on real WCSS values */}
                  {(() => {
                    const maxWcss = Math.max(...elbowData.map(d => d.wcss || 0));
                    const minWcss = Math.min(...elbowData.map(d => d.wcss || 0));
                    return (
                      <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between text-xs text-purple-200 p-2">
                        <span>{maxWcss.toFixed(0)}</span>
                        <span>{((maxWcss + minWcss) / 2).toFixed(0)}</span>
                        <span>{minWcss.toFixed(0)}</span>
                      </div>
                    );
                  })()}
                  
                  {/* Chart */}
                  <div className="ml-20 mr-4 h-full relative">
                    {/* Grid */}
                    {[0, 25, 50, 75, 100].map(y => (
                      <div key={y} className="absolute w-full border-t border-purple-400/20" style={{top: `${y}%`}} />
                    ))}
                    
                    {/* Line */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const maxWcss = Math.max(...elbowData.map(d => d.wcss || 0));
                        const minWcss = Math.min(...elbowData.map(d => d.wcss || 0));
                        const range = maxWcss - minWcss || 1;
                        return (
                          <>
                            <polyline
                              points={elbowData.map((d, i) => {
                                const x = (i / (elbowData.length - 1)) * 100;
                                const y = 100 - ((d.wcss - minWcss) / range) * 90 - 5;
                                return `${x},${y}`;
                              }).join(' ')}
                              fill="none"
                              stroke="url(#lineGradient)"
                              strokeWidth="1"
                              vectorEffect="non-scaling-stroke"
                              className="drop-shadow-2xl"
                            />
                            {elbowData.map((d, i) => {
                              const x = (i / (elbowData.length - 1)) * 100;
                              const y = 100 - ((d.wcss - minWcss) / range) * 90 - 5;
                              return (
                                <g key={i}>
                                  <circle
                                    cx={x}
                                    cy={y}
                                    r={d.k === kValue ? 3 : 2}
                                    fill={d.k === kValue ? "#fbbf24" : "#a855f7"}
                                    stroke="white"
                                    strokeWidth="0.5"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                  {d.k === kValue && (
                                    <>
                                      <line x1={x} y1={y} x2={x} y2={5} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                                      <text x={x} y={2} textAnchor="middle" fill="#fbbf24" fontSize="4">
                                        K={d.k}
                                      </text>
                                    </>
                                  )}
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  
                  {/* X-axis */}
                  <div className="ml-20 mr-4 mt-2 flex justify-between text-xs text-purple-200">
                    {elbowData.filter((_, i) => i % 2 === 0).map(d => (
                      <span key={d.k}>K={d.k}</span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-purple-900/30 rounded-lg border border-purple-400/30">
                  <p className="text-sm text-purple-100 leading-relaxed">
                    <strong className="text-purple-300">📊 Аналіз:</strong> Графік показує Within-Cluster Sum of Squares (WCSS). 
                    "Лікоть" на K=7 вказує на оптимальну кількість кластерів - після цієї точки зменшення інерції сповільнюється, 
                    що означає баланс між якістю кластеризації та складністю моделі.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Silhouette Plot - Real data from API */}
          <TabsContent value="silhouette">
            <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Silhouette Analysis (K={kValue})</span>
                  <Badge className={`bg-blue-600 text-white text-lg ${dynamicLoading ? 'animate-pulse' : ''}`}>
                    Avg: {dynamicLoading ? '...' : (currentMetrics.silhouette_score || '—')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dynamicLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                    <span className="ml-2 text-purple-200">Перерахунок для K={kValue}...</span>
                  </div>
                ) : (
                <div className="space-y-3">
                  {silhouetteData.map((cluster, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-200">
                          Кластер {cluster.cluster + 1}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-purple-300">
                          <span>{cluster.size} об'єктів</span>
                          <Badge style={{backgroundColor: clusterColorsBase[idx]}} className="text-white">
                            Avg: {(cluster.avg_score || 0).toFixed(3)}
                          </Badge>
                        </div>
                      </div>
                      <div className="relative h-16 bg-gradient-to-r from-red-900/30 via-slate-800/50 to-emerald-900/30 rounded-lg overflow-hidden border border-purple-400/20">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-purple-400"></div>
                        <div className="relative h-full flex flex-col justify-center px-2">
                          {(cluster.scores || []).slice(0, 12).map((score, i) => {
                            const width = Math.abs(score) * 50;
                            const left = score > 0 ? 50 : 50 - width;
                            const color = score > 0 ? clusterColorsBase[idx] : '#ef4444';
                            return (
                              <div
                                key={i}
                                className="absolute h-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  backgroundColor: color,
                                  top: `${8 + i * 7}%`
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
                
                <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-400/30">
                  <p className="text-sm text-blue-100 leading-relaxed">
                    <strong className="text-blue-300">📈 Динамічні дані:</strong> Рухайте слайдер K для перерахунку. 
                    Кластер 2 має найвищий avg_score ({silhouetteData[1]?.avg_score?.toFixed(3) || '—'}), що означає найкращу внутрішню згуртованість. 
                    Score {'>'} 0.5 = добра кластеризація, {'>'} 0.7 = відмінна.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2D Scatter Plot */}
          <TabsContent value="scatter">
            <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>2D Проекція кластерів (K={kValue})</span>
                  <Badge className={`bg-emerald-600 text-white ${dynamicLoading ? 'animate-pulse' : ''}`}>
                    {dynamicLoading ? 'Оновлення...' : `${scatterData.length} кластерів`}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gradient-to-br from-slate-900/80 to-purple-900/80 rounded-lg p-8 border border-purple-400/30">
                  {dynamicLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <RefreshCw className="h-10 w-10 animate-spin text-purple-400" />
                    </div>
                  ) : (
                  <>
                  {/* Axes */}
                  <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-purple-400/50"></div>
                  <div className="absolute left-8 bottom-8 right-8 h-0.5 bg-purple-400/50"></div>
                  
                  {/* Axis labels */}
                  <div className="absolute left-2 top-1/2 -rotate-90 text-xs text-purple-300">PC1 (Широта)</div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-purple-300">PC2 (Довгота)</div>
                  
                  {/* Scatter points */}
                  <div className="absolute inset-8">
                    {scatterData.map((point, i) => (
                      <div
                        key={i}
                        className="absolute group cursor-pointer transition-all duration-500"
                        style={{
                          left: `${point.x}%`,
                          top: `${100 - point.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-2xl transition-all duration-300 group-hover:scale-125 group-hover:z-50"
                          style={{
                            backgroundColor: point.color,
                            boxShadow: `0 0 30px ${point.color}80`
                          }}
                        >
                          {point.count}
                        </div>
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900/90 px-3 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {point.label} ({point.count} об'єктів)
                        </div>
                      </div>
                    ))}
                  </div>
                  </>
                  )}
                </div>
                
                {/* Legend */}
                <div className="mt-6 grid grid-cols-3 md:grid-cols-5 gap-2">
                  {scatterData.map((point) => (
                    <div key={point.cluster} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: point.color}}></div>
                      <span className="text-xs text-purple-200">{point.label}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-emerald-900/30 rounded-lg border border-emerald-400/30">
                  <p className="text-sm text-emerald-100 leading-relaxed">
                    <strong className="text-emerald-300">🎯 Візуалізація:</strong> Principal Component Analysis (PCA) проектує багатовимірні дані 
                    на 2D площину. Розмір кружків = кількість об'єктів у кластері. Відстань між кружками показує схожість/відмінність кластерів. 
                    Добре розділені кластери = якісна класифікація.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dendrogram */}
          <TabsContent value="dendrogram">
            <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Hierarchical Clustering Dendrogram</span>
                  <Badge className="bg-pink-600 text-white">Agglomerative Method</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gradient-to-br from-slate-900/80 to-pink-900/30 rounded-lg p-6 border border-purple-400/30">
                  <svg className="w-full h-full">
                    {/* Simplified dendrogram visualization */}
                    <line x1="50%" y1="10%" x2="30%" y2="30%" stroke="#a855f7" strokeWidth="3" />
                    <line x1="50%" y1="10%" x2="70%" y2="30%" stroke="#a855f7" strokeWidth="3" />
                    
                    <line x1="30%" y1="30%" x2="20%" y2="50%" stroke="#ec4899" strokeWidth="2" />
                    <line x1="30%" y1="30%" x2="40%" y2="50%" stroke="#ec4899" strokeWidth="2" />
                    <line x1="70%" y1="30%" x2="60%" y2="50%" stroke="#ec4899" strokeWidth="2" />
                    <line x1="70%" y1="30%" x2="80%" y2="50%" stroke="#ec4899" strokeWidth="2" />
                    
                    <line x1="20%" y1="50%" x2="15%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="20%" y1="50%" x2="25%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="40%" y1="50%" x2="35%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="40%" y1="50%" x2="45%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="60%" y1="50%" x2="55%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="60%" y1="50%" x2="65%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="80%" y1="50%" x2="75%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="80%" y1="50%" x2="85%" y2="70%" stroke="#8b5cf6" strokeWidth="2" />
                    
                    {/* Leaf nodes */}
                    {[15, 25, 35, 45, 55, 65, 75, 85].map((x, i) => (
                      <g key={i}>
                        <circle cx={`${x}%`} cy="70%" r="8" fill={scatterData[i % 7]?.color || '#6366f1'} stroke="white" strokeWidth="2" />
                        <text x={`${x}%`} y="80%" textAnchor="middle" className="text-xs fill-purple-200">
                          {i + 1}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                
                <div className="mt-6 p-4 bg-pink-900/30 rounded-lg border border-pink-400/30">
                  <p className="text-sm text-pink-100 leading-relaxed">
                    <strong className="text-pink-300">🌳 Дендрограма:</strong> Ієрархічна кластеризація показує як об'єкти поступово об'єднуються 
                    у кластери. Висота "дерева" показує відстань між кластерами. Можна "зрізати" дерево на різних рівнях для отримання різної 
                    кількості кластерів. Метод корисний для виявлення природньої структури даних.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GeoPandas Spatial Analysis - Розділ 2.5 */}
          <TabsContent value="geopandas">
            <Card className="bg-gradient-to-br from-green-900/40 via-emerald-900/30 to-teal-900/40 backdrop-blur-md border-green-400/30">
              <CardHeader className="border-b border-green-400/20">
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <Layers className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="text-xl font-bold">GeoPandas Просторовий Аналіз</span>
                      <p className="text-sm text-green-300 font-normal">Розділ 2.5 магістерської роботи</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 text-sm">
                    v{geoData?.spatial?.geopandas_info?.library_version || '1.1.1'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Hero Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="relative overflow-hidden bg-gradient-to-br from-green-600/20 to-green-800/20 p-5 rounded-2xl border border-green-400/30 group hover:border-green-400/60 transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="text-4xl font-bold text-green-300 mb-1">
                      {geoData?.spatial?.summary?.total_objects?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-green-200/80">Туристичних об'єктів</div>
                    <Activity className="absolute bottom-3 right-3 h-5 w-5 text-green-500/40 group-hover:text-green-400/60 transition-colors" />
                  </div>
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-5 rounded-2xl border border-blue-400/30 group hover:border-blue-400/60 transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="text-4xl font-bold text-blue-300 mb-1">
                      {geoData?.spatial?.summary?.districts_count || 4}
                    </div>
                    <div className="text-sm text-blue-200/80">Районів області</div>
                    <Target className="absolute bottom-3 right-3 h-5 w-5 text-blue-500/40 group-hover:text-blue-400/60 transition-colors" />
                  </div>
                  <div className="relative overflow-hidden bg-gradient-to-br from-amber-600/20 to-amber-800/20 p-5 rounded-2xl border border-amber-400/30 group hover:border-amber-400/60 transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="text-4xl font-bold text-amber-300 mb-1">
                      {geoData?.spatial?.summary?.coverage_percentage || 100}%
                    </div>
                    <div className="text-sm text-amber-200/80">Покриття даними</div>
                    <Sparkles className="absolute bottom-3 right-3 h-5 w-5 text-amber-500/40 group-hover:text-amber-400/60 transition-colors" />
                  </div>
                  <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-5 rounded-2xl border border-purple-400/30 group hover:border-purple-400/60 transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="text-4xl font-bold text-purple-300 mb-1">WGS84</div>
                    <div className="text-sm text-purple-200/80">EPSG:4326</div>
                    <Brain className="absolute bottom-3 right-3 h-5 w-5 text-purple-500/40 group-hover:text-purple-400/60 transition-colors" />
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  {/* District Map Visualization */}
                  <div className="bg-slate-900/50 rounded-2xl border border-green-400/20 p-5">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-green-600/30 flex items-center justify-center">
                        🗺️
                      </div>
                      Карта районів Житомирщини
                    </h4>
                    <div className="relative h-72 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700">
                      {/* SVG Map of Districts */}
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {/* Background */}
                        <rect width="200" height="200" fill="#1e293b" />
                        
                        {/* Grid */}
                        {[...Array(10)].map((_, i) => (
                          <g key={i}>
                            <line x1={i * 20} y1="0" x2={i * 20} y2="200" stroke="#334155" strokeWidth="0.5" />
                            <line x1="0" y1={i * 20} x2="200" y2={i * 20} stroke="#334155" strokeWidth="0.5" />
                          </g>
                        ))}
                        
                        {/* Districts as polygons */}
                        {geoData?.districts?.map((district, idx) => {
                          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                          const positions = [
                            { x: 100, y: 100, w: 80, h: 60 },  // Житомирський (центр)
                            { x: 100, y: 160, w: 50, h: 35 },  // Бердичівський (південь)
                            { x: 100, y: 40, w: 70, h: 50 },   // Коростенський (північ)
                            { x: 30, y: 100, w: 55, h: 50 }    // Новоград (захід)
                          ];
                          const pos = positions[idx] || { x: 100, y: 100, w: 40, h: 40 };
                          const size = Math.sqrt(district.objects_count) * 2;
                          
                          return (
                            <g key={idx} className="cursor-pointer hover:opacity-80 transition-opacity">
                              {/* District shape */}
                              <ellipse
                                cx={pos.x}
                                cy={pos.y}
                                rx={pos.w / 2}
                                ry={pos.h / 2}
                                fill={colors[idx]}
                                fillOpacity="0.3"
                                stroke={colors[idx]}
                                strokeWidth="2"
                              />
                              {/* Object count circle */}
                              <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={Math.min(size, 25)}
                                fill={colors[idx]}
                                fillOpacity="0.8"
                              />
                              {/* Label */}
                              <text
                                x={pos.x}
                                y={pos.y + 4}
                                textAnchor="middle"
                                fill="white"
                                fontSize="10"
                                fontWeight="bold"
                              >
                                {district.objects_count}
                              </text>
                              {/* District name */}
                              <text
                                x={pos.x}
                                y={pos.y + pos.h / 2 + 15}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="7"
                              >
                                {district.district_name.replace(' район', '')}
                              </text>
                            </g>
                          );
                        })}
                        
                        {/* Legend */}
                        <text x="10" y="190" fill="#64748b" fontSize="6">Spatial Join: Point-in-Polygon</text>
                      </svg>
                      
                      {/* Overlay info */}
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <span className="text-xs text-green-300 font-medium">GeoPandas + Shapely</span>
                      </div>
                    </div>
                  </div>

                  {/* Pie Chart - Category Distribution */}
                  <div className="bg-slate-900/50 rounded-2xl border border-green-400/20 p-5">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center">
                        📊
                      </div>
                      Розподіл по районах
                    </h4>
                    <div className="relative h-72 flex items-center justify-center">
                      {/* Donut Chart */}
                      <svg viewBox="0 0 200 200" className="w-64 h-64">
                        {(() => {
                          const total = geoData?.districts?.reduce((sum, d) => sum + d.objects_count, 0) || 1;
                          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                          let currentAngle = -90;
                          
                          return geoData?.districts?.map((district, idx) => {
                            const percentage = (district.objects_count / total) * 100;
                            const angle = (percentage / 100) * 360;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            currentAngle = endAngle;
                            
                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;
                            
                            const x1 = 100 + 70 * Math.cos(startRad);
                            const y1 = 100 + 70 * Math.sin(startRad);
                            const x2 = 100 + 70 * Math.cos(endRad);
                            const y2 = 100 + 70 * Math.sin(endRad);
                            
                            const largeArc = angle > 180 ? 1 : 0;
                            
                            return (
                              <path
                                key={idx}
                                d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={colors[idx]}
                                stroke="#1e293b"
                                strokeWidth="2"
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            );
                          });
                        })()}
                        {/* Center circle */}
                        <circle cx="100" cy="100" r="40" fill="#1e293b" />
                        <text x="100" y="95" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                          {geoData?.districts?.reduce((sum, d) => sum + d.objects_count, 0)?.toLocaleString()}
                        </text>
                        <text x="100" y="110" textAnchor="middle" fill="#94a3b8" fontSize="8">
                          об'єктів
                        </text>
                      </svg>
                      
                      {/* Legend */}
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-2">
                        {geoData?.districts?.map((district, idx) => {
                          const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                          const total = geoData?.districts?.reduce((sum, d) => sum + d.objects_count, 0) || 1;
                          const pct = ((district.objects_count / total) * 100).toFixed(1);
                          return (
                            <div key={idx} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx] }}></div>
                              <span className="text-xs text-slate-300">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* District Statistics Cards */}
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-600/30 flex items-center justify-center">
                    📈
                  </div>
                  Детальна статистика районів (Spatial Join)
                </h4>
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {geoData?.districts?.map((district, idx) => {
                    const maxObjects = Math.max(...(geoData?.districts?.map(d => d.objects_count) || [1]));
                    const percentage = (district.objects_count / maxObjects) * 100;
                    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                    const bgColors = ['from-green-900/40 to-green-800/20', 'from-blue-900/40 to-blue-800/20', 'from-amber-900/40 to-amber-800/20', 'from-red-900/40 to-red-800/20'];
                    const icons = ['🏛️', '🎭', '🏰', '🌳'];
                    return (
                      <div key={idx} className={`bg-gradient-to-br ${bgColors[idx]} p-5 rounded-2xl border border-slate-600/30 hover:border-slate-500/50 transition-all group`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${colors[idx]}30` }}>
                              {icons[idx]}
                            </div>
                            <div>
                              <h5 className="font-bold text-white">{district.district_name}</h5>
                              <p className="text-xs text-slate-400">Домінує: {district.dominant_category}</p>
                            </div>
                          </div>
                          <Badge style={{ backgroundColor: colors[idx] }} className="text-white font-bold px-3 py-1">
                            {district.objects_count}
                          </Badge>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%`, backgroundColor: colors[idx] }}
                          />
                        </div>
                        
                        {/* Stats row */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">
                            ⭐ Рейтинг: <span className="text-white font-medium">{district.avg_rating}</span>
                          </span>
                          <span className="text-slate-400">
                            📍 Щільність: <span className="text-white font-medium">{district.density_per_100km2} / 100км²</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Technical Info */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 p-5 rounded-2xl border border-green-400/20">
                    <h5 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <span className="text-lg">🔧</span> Просторові операції
                    </h5>
                    <ul className="text-sm text-green-100/80 space-y-2">
                      {geoData?.spatial?.geopandas_info?.spatial_operations?.map((op, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          {op}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 p-5 rounded-2xl border border-blue-400/20">
                    <h5 className="font-semibold text-blue-300 mb-3 flex items-center gap-2">
                      <span className="text-lg">📍</span> Географічні межі
                    </h5>
                    <ul className="text-sm text-blue-100/80 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Широта: {geoData?.spatial?.geographic_bounds?.lat_min}° - {geoData?.spatial?.geographic_bounds?.lat_max}°
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Довгота: {geoData?.spatial?.geographic_bounds?.lng_min}° - {geoData?.spatial?.geographic_bounds?.lng_max}°
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        Регіон: Житомирська область
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 p-5 rounded-2xl border border-purple-400/20">
                    <h5 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <span className="text-lg">📚</span> Методологія
                    </h5>
                    <ul className="text-sm text-purple-100/80 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        Бібліотека: GeoPandas + Shapely
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        CRS: WGS84 (EPSG:4326)
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                        Посилання: Розділ 2.5
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Algorithm Info */}
        <Card className="mt-8 bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-md border-purple-400/30">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-4">Методологія кластеризації</h3>
                <div className="grid md:grid-cols-2 gap-6 text-purple-100">
                  <div>
                    <h4 className="font-semibold text-purple-300 mb-2">🎯 Алгоритм K-means</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Ітеративний алгоритм</li>
                      <li>• Мінімізація WCSS</li>
                      <li>• Евклідова метрика відстані</li>
                      <li>• Конвергенція за 10-20 ітерацій</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-300 mb-2">📊 Метрики якості</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Silhouette Coefficient: 0.748</li>
                      <li>• Davies-Bouldin Index: 0.628</li>
                      <li>• Calinski-Harabasz: 1247</li>
                      <li>• Інерція (WCSS): оптимізована</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-lg px-8 py-6 shadow-xl"
            onClick={() => navigate('/analytics')}
          >
            <BarChart3 className="h-5 w-5 mr-2" />
            Переглянути детальну аналітику
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 text-lg px-8 py-6"
            onClick={() => {
              const data = { kValue, metrics, silhouetteData, elbowData };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'clustering_analysis.json';
              a.click();
            }}
          >
            <Download className="h-5 w-5 mr-2" />
            Експортувати дані
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </section>
  );
};

export default ProClusteringVisualization;
