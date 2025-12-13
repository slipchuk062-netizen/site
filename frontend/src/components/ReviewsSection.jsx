import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Star, MessageSquare, User, Calendar, 
  ThumbsUp, Send, X
} from 'lucide-react';
import axios from 'axios';

const ReviewsSection = ({ attractionId, attractionName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [formData, setFormData] = useState({
    user_name: '',
    rating: 5,
    comment: '',
    visit_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (attractionId) {
      fetchReviews();
    }
  }, [attractionId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.get(`${backendUrl}/api/reviews/${attractionId}`);
      
      if (response.data.success) {
        setReviews(response.data.reviews);
        setAverageRating(response.data.average_rating);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await axios.post(`${backendUrl}/api/reviews/add`, {
        attraction_id: attractionId,
        attraction_name: attractionName,
        ...formData
      });

      if (response.data.success) {
        setShowForm(false);
        setFormData({
          user_name: '',
          rating: 5,
          comment: '',
          visit_date: new Date().toISOString().split('T')[0]
        });
        fetchReviews();
      }
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Відгуки туристів
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-lg font-bold text-slate-900">
                {averageRating.toFixed(1)}
              </span>
            </div>
            <Badge variant="secondary">
              {reviews.length} відгуків
            </Badge>
          </div>
        </div>
        
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Написати відгук
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center justify-between">
              <span>Новий відгук</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ваше ім'я
                </label>
                <input
                  type="text"
                  required
                  value={formData.user_name}
                  onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введіть ваше ім'я"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Оцінка
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({...formData, rating})}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          rating <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Дата відвідування
                </label>
                <input
                  type="date"
                  required
                  value={formData.visit_date}
                  onChange={(e) => setFormData({...formData, visit_date: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ваш відгук
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.comment}
                  onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Поділіться вашими враженнями..."
                />
              </div>

              <Button 
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="h-4 w-4 mr-2" />
                Опублікувати відгук
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : reviews.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200">
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Поки що немає відгуків</p>
            <p className="text-sm text-slate-500 mt-1">Будьте першим, хто залишить відгук!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-lg transition-shadow border-2 border-slate-100">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {review.user_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{review.user_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(review.visit_date).toLocaleDateString('uk-UA')}</span>
                    </div>
                  </div>
                </div>

                <p className="text-slate-700 leading-relaxed mb-4">
                  {review.comment}
                </p>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                  <button className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Корисно</span>
                  </button>
                  <span className="text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString('uk-UA')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
