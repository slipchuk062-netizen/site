import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Upload, FileJson, Download, CheckCircle, AlertCircle,
  TrendingUp, BarChart3, MapPin, Sparkles
} from 'lucide-react';
import axios from 'axios';

const DataUploadSection = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json' || selectedFile.name.endsWith('.json')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Будь ласка, завантажте JSON файл');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // Read file content
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);

      // Send to backend for analysis
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.post(`${backendUrl}/api/upload-data`, {
        data: Array.isArray(data) ? data : data.attractions || [],
        filename: file.name
      });

      if (response.data.success) {
        setAnalysisResult(response.data);
      } else {
        setError('Помилка обробки даних на сервері');
      }
    } catch (err) {
      setError('Помилка аналізу файлу. Перевірте формат даних.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        id: 1,
        name: "Назва об'єкта",
        category: "historical",
        address: "Адреса об'єкта",
        coordinates: {
          lat: 50.2547,
          lng: 28.6587
        },
        description: "Опис об'єкта (опціонально)",
        workingHours: "9:00-18:00 (опціонально)",
        website: "https://example.com (опціонально)"
      }
    ];

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tourism_data_template.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-purple-700 border-purple-300 bg-purple-50">
            <Upload className="h-3 w-3 mr-1 inline" />
            Аналіз даних
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            Проаналізуйте туристичний потенціал вашого регіону
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Завантажте дані про туристичні об'єкти вашої області у форматі JSON 
            та отримайте професійний аналіз з рекомендаціями
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="shadow-xl border-2 border-purple-100">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                Завантаження даних
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Template Download */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <FileJson className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1">Формат даних</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Завантажте шаблон JSON файлу з прикладом структури даних
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadTemplate}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Завантажити шаблон
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Виберіть JSON файл
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
                {file && (
                  <p className="mt-2 text-sm text-emerald-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {file.name}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Upload Button */}
              <Button 
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Аналіз...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Проаналізувати дані
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-xl border-2 border-emerald-100">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Результати аналізу
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!analysisResult ? (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">Завантажте файл для отримання аналізу</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg">
                      <p className="text-sm text-emerald-700 mb-1">Всього об'єктів</p>
                      <p className="text-3xl font-bold text-emerald-900">
                        {analysisResult.totalObjects}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-blue-700 mb-1">Категорій</p>
                      <p className="text-3xl font-bold text-blue-900">
                        {analysisResult.clusterCount}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <p className="text-sm text-purple-700 mb-1">Середньо/кластер</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {analysisResult.avgPerCluster}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
                      <p className="text-sm text-amber-700 mb-1">З координатами</p>
                      <p className="text-3xl font-bold text-amber-900">
                        {analysisResult.coordinatesPercentage}%
                      </p>
                    </div>
                  </div>

                  {/* Quality Metrics */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3">Метрики якості кластеризації</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Silhouette Score:</span>
                        <span className="font-bold text-emerald-700">{analysisResult.silhouetteScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Davies-Bouldin Index:</span>
                        <span className="font-bold text-blue-700">{analysisResult.daviesBouldinIndex}</span>
                      </div>
                    </div>
                  </div>

                  {/* Categories Breakdown */}
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-bold text-slate-900 mb-3">Розподіл по категоріях</h4>
                    <div className="space-y-2">
                      {Object.entries(analysisResult.categories).map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-slate-700 capitalize">{category}</span>
                          <Badge variant="secondary">{count} об'єктів</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-slate-900 mb-3">Рекомендації</h4>
                    <div className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <p key={index} className="text-sm text-slate-700 leading-relaxed">
                          {rec}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="border-2 border-emerald-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <MapPin className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Геопросторовий аналіз</h3>
              <p className="text-sm text-slate-600">
                Аналіз розподілу об'єктів, розрахунок щільності та покриття території
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-10 w-10 text-blue-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Кластерний аналіз</h3>
              <p className="text-sm text-slate-600">
                K-means кластеризація з розрахунком метрик якості Silhouette та Davies-Bouldin
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 text-center">
              <Sparkles className="h-10 w-10 text-purple-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">AI-рекомендації</h3>
              <p className="text-sm text-slate-600">
                Інтелектуальні підказки щодо покращення структури та наповнення даних
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DataUploadSection;
