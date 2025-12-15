import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sparkles, Brain, Target, Zap, TrendingUp, 
  GitBranch, Layers, MapPin, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClusteringHeroSection = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      title: "1. Збір даних",
      description: "1,864 туристичних об'єктів по Житомирській області",
      icon: MapPin,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "2. Класифікація",
      description: "7 тематичних категорій за принципом K-means",
      icon: GitBranch,
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "3. Аналіз",
      description: "Розрахунок щільності, популярності, метрик якості",
      icon: Activity,
      color: "from-emerald-500 to-emerald-600"
    },
    {
      title: "4. Рекомендації",
      description: "Персоналізовані підказки на основі кластерів",
      icon: Sparkles,
      color: "from-pink-500 to-pink-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative py-24 bg-gradient-to-br from-white via-slate-50 to-emerald-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-emerald-600 text-white border-emerald-500 text-xl px-8 py-3">
            <MapPin className="h-6 w-6 mr-2 inline" />
            7 категорій для вашого вибору
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 bg-clip-text text-transparent">
              Оберіть що вам подобається
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-700 max-w-4xl mx-auto mb-8 leading-relaxed">
            Історія, природа, культура, розваги - тут знайдете все для ідеальної подорожі Житомирщиною
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => {
                const mapSection = document.querySelector('section.py-12.bg-slate-50');
                if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xl px-10 py-7 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300"
            >
              <MapPin className="h-7 w-7 mr-2" />
              Переглянути на карті
            </Button>
            
            <Button 
              size="lg"
              onClick={() => {
                const topSection = document.querySelector('section.py-20.bg-gradient-to-b');
                if (topSection) topSection.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-2 border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-700 text-xl px-10 py-7 shadow-lg"
            >
              <TrendingUp className="h-7 w-7 mr-2" />
              Топ-10 місць
            </Button>
          </div>
        </div>

        {/* Algorithm Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === activeStep;
            
            return (
              <Card 
                key={index}
                className={`relative overflow-hidden transition-all duration-500 cursor-pointer ${
                  isActive 
                    ? 'scale-105 shadow-2xl border-2 border-emerald-400 bg-white' 
                    : 'scale-100 hover:scale-105 border-slate-200 bg-white hover:shadow-lg'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <CardContent className="pt-8 pb-6">
                  {isActive && (
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color}`}></div>
                  )}
                  
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 mx-auto transform transition-transform duration-300 ${
                    isActive ? 'scale-110 rotate-6' : ''
                  }`}>
                    <Icon className="h-8 w-8 text-slate-900" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 text-center leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
            <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
              1,864
            </div>
            <p className="text-slate-700 font-medium">Об'єктів</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
            <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
              7
            </div>
            <p className="text-slate-700 font-medium">Кластерів</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
            <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent mb-2">
              0.748
            </div>
            <p className="text-slate-700 font-medium">Silhouette Score</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white border border-slate-200 hover:shadow-lg transition-all duration-300">
            <div className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent mb-2">
              4
            </div>
            <p className="text-slate-700 font-medium">Райони</p>
          </div>
        </div>

        {/* Algorithm Explanation */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="h-6 w-6 text-emerald-600" />
                  Методологія K-means
                </h3>
                <div className="space-y-3 text-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-slate-900">1</span>
                    </div>
                    <p><strong className="text-slate-900">Ініціалізація:</strong> Вибір 7 початкових центроїдів для категорій</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-slate-900">2</span>
                    </div>
                    <p><strong className="text-slate-900">Присвоєння:</strong> Кожен об'єкт до найближчого кластера</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-slate-900">3</span>
                    </div>
                    <p><strong className="text-slate-900">Оновлення:</strong> Перерахунок центроїдів кластерів</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-slate-900">4</span>
                    </div>
                    <p><strong className="text-slate-900">Конвергенція:</strong> Повторення до стабілізації</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-pink-400" />
                  Переваги підходу
                </h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-purple-300" />
                      <span className="font-semibold text-slate-900">Швидкість</span>
                    </div>
                    <p className="text-sm text-slate-600">Ефективна обробка великих обсягів даних O(n·k·i)</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="h-4 w-4 text-blue-300" />
                      <span className="font-semibold text-slate-900">Масштабованість</span>
                    </div>
                    <p className="text-sm text-slate-600">Легко адаптується під нові категорії та об'єкти</p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-400/30">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="h-4 w-4 text-emerald-300" />
                      <span className="font-semibold text-slate-900">Точність</span>
                    </div>
                    <p className="text-sm text-slate-600">Silhouette Score 0.748 - висока якість кластеризації</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSS for blob animation */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  );
};

export default ClusteringHeroSection;
