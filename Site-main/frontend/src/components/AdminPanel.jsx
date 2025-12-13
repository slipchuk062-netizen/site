import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, BarChart3, MapPin, MessageSquare, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Admin data
  const [stats, setStats] = useState({});
  const [feedback, setFeedback] = useState([]);
  const [places, setPlaces] = useState([]);
  const [authToken, setAuthToken] = useState(null);
  
  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAuthToken(data.token);
        setIsAuthenticated(true);
        toast.success('Успішний вхід!');
      } else {
        toast.error('Невірний пароль');
      }
    } catch (error) {
      toast.error('Помилка входу');
    } finally {
      setLoading(false);
    }
  };
  
  // Load admin data
  useEffect(() => {
    if (isAuthenticated && authToken) {
      loadStats();
      loadFeedback();
    }
  }, [isAuthenticated, authToken]);
  
  const loadStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error('Помилка завантаження статистики');
    }
  };
  
  const loadFeedback = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/feedback`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      setFeedback(data);
    } catch (error) {
      toast.error('Помилка завантаження відгуків');
    }
  };
  
  const updateFeedbackStatus = async (feedbackId, newStatus) => {
    try {
      await fetch(`${BACKEND_URL}/api/feedback/${feedbackId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      toast.success('Статус оновлено');
      loadFeedback();
    } catch (error) {
      toast.error('Помилка оновлення статусу');
    }
  };
  
  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'complaint': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'suggestion': return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'review': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };
  
  const getStatusBadge = (status) => {
    const variants = {
      'new': { text: 'Нове', className: 'bg-blue-100 text-blue-800' },
      'reviewed': { text: 'Переглянуто', className: 'bg-yellow-100 text-yellow-800' },
      'resolved': { text: 'Вирішено', className: 'bg-green-100 text-green-800' }
    };
    
    const variant = variants[status] || variants.new;
    return <Badge className={variant.className}>{variant.text}</Badge>;
  };
  
  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">Адмін-панель</CardTitle>
              <p className="text-slate-600 mt-2">Введіть пароль для доступу</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? 'Завантаження...' : 'Увійти'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  // Admin dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Адміністративна панель</h1>
          <p className="text-slate-600">Керування контентом та відгуками</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Локацій</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total_places || 0}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Повідомлень</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.contact_messages || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Відгуків</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.feedback_total || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-800">Нових відгуків</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.feedback_new || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Card className="border-0 shadow-xl">
          <Tabs defaultValue="feedback" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="feedback">Відгуки та скарги</TabsTrigger>
                <TabsTrigger value="places">Локації</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              {/* Feedback Tab */}
              <TabsContent value="feedback" className="mt-0">
                <ScrollArea className="h-[600px] pr-4">
                  {feedback.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Відгуків поки немає</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedback.map((item) => (
                        <Card key={item.id} className="border border-slate-200">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start gap-3">
                                {getFeedbackIcon(item.feedback_type)}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-slate-900">{item.name}</h4>
                                    {getStatusBadge(item.status)}
                                  </div>
                                  <p className="text-sm text-slate-600">{item.email}</p>
                                  {item.place_name && (
                                    <p className="text-sm text-slate-500 mt-1">
                                      <MapPin className="w-3 h-3 inline mr-1" />
                                      {item.place_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400">
                                {new Date(item.created_at).toLocaleDateString('uk-UA')}
                              </p>
                            </div>
                            
                            <p className="text-slate-700 mb-4">{item.message}</p>
                            
                            <div className="flex gap-2">
                              {item.status === 'new' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateFeedbackStatus(item.id, 'reviewed')}
                                >
                                  Позначити як переглянуте
                                </Button>
                              )}
                              {item.status !== 'resolved' && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                                >
                                  Вирішено
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              {/* Places Tab */}
              <TabsContent value="places" className="mt-0">
                <div className="text-center py-12 text-slate-600">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Тут буде можливість редагувати локації</p>
                  <p className="text-sm text-slate-500">Функціонал буде доступний незабаром</p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;