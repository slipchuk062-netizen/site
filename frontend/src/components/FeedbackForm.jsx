import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { MessageSquare, AlertCircle, Lightbulb, Star, Send } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FeedbackForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    place_name: '',
    feedback_type: 'suggestion',
    message: '',
    rating: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  
  const feedbackTypes = [
    { value: 'suggestion', label: 'Побажання', icon: Lightbulb, color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 'complaint', label: 'Скарга', icon: AlertCircle, color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 'review', label: 'Відгук', icon: MessageSquare, color: 'bg-green-100 text-green-700 border-green-300' }
  ];
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        toast.success('Дякуємо за ваш відгук!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          place_name: '',
          feedback_type: 'suggestion',
          message: '',
          rating: 0
        });
      } else {
        toast.error('Помилка відправлення. Спробуйте ще раз.');
      }
    } catch (error) {
      toast.error('Помилка з\'єднання');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Header />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-4 text-emerald-700 border-emerald-300 bg-emerald-50">
            Зворотний зв'язок
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Поділіться своєю думкою
          </h1>
          <p className="text-lg text-slate-600">
            Ваші побажання та відгуки допомагають нам стати кращими
          </p>
        </div>
        
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle>Форма зворотного зв'язку</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback Type */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">Тип звернення</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {feedbackTypes.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleChange('feedback_type', value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                        formData.feedback_type === value
                          ? color
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="font-medium text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Ім'я *</label>
                  <Input
                    placeholder="Ваше ім'я"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email *</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Телефон</label>
                  <Input
                    type="tel"
                    placeholder="+380..."
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Назва локації</label>
                  <Input
                    placeholder="Якщо стосується конкретного об'єкту"
                    value={formData.place_name}
                    onChange={(e) => handleChange('place_name', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Rating (only for reviews) */}
              {formData.feedback_type === 'review' && (
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Оцінка</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleChange('rating', star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || formData.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Message */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Повідомлення *</label>
                <textarea
                  placeholder="Розкажіть детальніше..."
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Відправлення...' : 'Відправити'}
              </Button>
              
              <p className="text-xs text-slate-500 text-center">
                * - обов'язкові поля
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default FeedbackForm;