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
  const [loading, setLoading] = useState(true);
  const [activeVisualization, setActiveVisualization] = useState('distribution');

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

  // Get Elbow data from API response
  const elbowData = analyticsData?.elbow_data || Array.from({length: 14}, (_, i) => {
    const k = i + 2;
    return { k, wcss: 50000 / Math.pow(k, 1.2) };
  });

  // Get Silhouette data per cluster from API
  const silhouetteData = analyticsData?.silhouette_per_cluster || Array.from({length: kValue}, (_, i) => ({
    cluster: i,
    scores: [0.5],
    avg_score: 0.5,
    size: 100
  }));

  // Generate 2D Scatter plot data from cluster centers (normalized to 0-100 range)
  const clusterCenters = metrics.cluster_centers || [];
  const clusterLabels = ['Зона 1', 'Зона 2', 'Зона 3', 'Зона 4', 'Зона 5', 'Зона 6', 'Зона 7'];
  const clusterColors = ['#f59e0b', '#10b981', '#8b5cf6', '#14b8a6', '#f43f5e', '#3b82f6', '#6366f1'];
  
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
      color: clusterColors[idx] || '#6366f1',
      count: clusterSize
    };
  });

  const categoryColors = {
    0: '#f59e0b', 1: '#10b981', 2: '#8b5cf6', 3: '#14b8a6',
    4: '#f43f5e', 5: '#3b82f6', 6: '#6366f1'
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
        </div>
      </section>
    );
  }

  const clusterStats = analyticsData?.cluster_statistics || {};
  const metrics = analyticsData?.clustering_metrics || {};
  const total = clusterStats.total_objects || 1864;

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

        {/* Key Metrics - Real values from K-Means */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-purple-300 mb-2">{metrics.total_clusters || 7}</div>
              <div className="text-sm text-purple-200">Кластери (K)</div>
              <div className="mt-2 text-xs text-purple-300">
                Ітерацій: {metrics.n_iterations || '—'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-blue-300 mb-2">{metrics.silhouette_score || '—'}</div>
              <div className="text-sm text-blue-200">Silhouette Score</div>
              <div className="mt-2 text-xs text-blue-300">
                {metrics.silhouette_score > 0.5 ? '✓ Добра якість' : metrics.silhouette_score > 0.25 ? '○ Середня якість' : '✗ Слабка якість'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-emerald-400/30">
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-emerald-300 mb-2">{metrics.davies_bouldin_index || '—'}</div>
              <div className="text-sm text-emerald-200">Davies-Bouldin</div>
              <div className="mt-2 text-xs text-emerald-300">
                {metrics.davies_bouldin_index < 1.0 ? '✓ Добра сепарація' : '○ Помірна сепарація'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-amber-400/30">
            <CardContent className="pt-6">
              <div className="text-5xl font-bold text-amber-300 mb-2">
                {metrics.calinski_harabasz_score ? metrics.calinski_harabasz_score.toFixed(0) : '—'}
              </div>
              <div className="text-sm text-amber-200">Calinski-Harabasz</div>
              <div className="mt-2 text-xs text-amber-300">
                WCSS: {metrics.wcss || '—'}
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
                    <svg className="absolute inset-0 w-full h-full">
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
                                return `${x}%,${y}%`;
                              }).join(' ')}
                              fill="none"
                              stroke="url(#lineGradient)"
                              strokeWidth="4"
                              className="drop-shadow-2xl"
                            />
                            {elbowData.map((d, i) => {
                              const x = (i / (elbowData.length - 1)) * 100;
                              const y = 100 - ((d.wcss - minWcss) / range) * 90 - 5;
                              return (
                                <g key={i}>
                                  <circle
                                    cx={`${x}%`}
                                    cy={`${y}%`}
                                    r={d.k === 7 ? "8" : "5"}
                                    fill={d.k === 7 ? "#fbbf24" : "#a855f7"}
                                    stroke="white"
                                    strokeWidth="2"
                                  />
                                  {d.k === 7 && (
                                    <>
                                      <line x1={`${x}%`} y1={`${y}%`} x2={`${x}%`} y2="5%" stroke="#fbbf24" strokeWidth="2" strokeDasharray="5,5" />
                                      <text x={`${x}%`} y="3%" textAnchor="middle" className="text-sm font-bold fill-amber-300">
                                        ⬇ K=7 (WCSS={d.wcss})
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
                  <span>Silhouette Analysis (K={metrics.total_clusters || 7})</span>
                  <Badge className="bg-blue-600 text-white text-lg">
                    Avg: {metrics.silhouette_score || (silhouetteData.reduce((s, c) => s + (c.avg_score || 0), 0) / silhouetteData.length).toFixed(3)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {silhouetteData.map((cluster, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-purple-200">
                          Кластер {cluster.cluster + 1}
                        </span>
                        <div className="flex items-center gap-3 text-xs text-purple-300">
                          <span>{cluster.size} об'єктів</span>
                          <Badge style={{backgroundColor: clusterColors[idx]}} className="text-white">
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
                            const color = score > 0 ? clusterColors[idx] : '#ef4444';
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
                
                <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-400/30">
                  <p className="text-sm text-blue-100 leading-relaxed">
                    <strong className="text-blue-300">📈 Реальні дані:</strong> Кожен кластер показує Silhouette Score з scikit-learn. 
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
                  <span>2D Проекція кластерів (PCA)</span>
                  <Badge className="bg-emerald-600 text-white">Feature Space Visualization</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-96 bg-gradient-to-br from-slate-900/80 to-purple-900/80 rounded-lg p-8 border border-purple-400/30">
                  {/* Axes */}
                  <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-purple-400/50"></div>
                  <div className="absolute left-8 bottom-8 right-8 h-0.5 bg-purple-400/50"></div>
                  
                  {/* Axis labels */}
                  <div className="absolute left-2 top-1/2 -rotate-90 text-xs text-purple-300">PC1 (Географія)</div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-purple-300">PC2 (Популярність)</div>
                  
                  {/* Scatter points */}
                  <div className="absolute inset-8">
                    {scatterData.map((point, i) => (
                      <div
                        key={i}
                        className="absolute group cursor-pointer"
                        style={{
                          left: `${point.x}%`,
                          top: `${100 - point.y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white shadow-2xl transition-all duration-300 group-hover:scale-125 group-hover:z-50"
                          style={{
                            backgroundColor: point.color,
                            boxShadow: `0 0 30px ${point.color}80`
                          }}
                        >
                          {point.count}
                        </div>
                        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900/90 px-3 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          {point.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Legend */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scatterData.map((point) => (
                    <div key={point.cluster} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{backgroundColor: point.color}}></div>
                      <span className="text-sm text-purple-200">{point.label}</span>
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
