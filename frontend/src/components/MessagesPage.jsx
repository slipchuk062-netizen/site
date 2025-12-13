import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ArrowLeft, Mail, Phone, Clock, User, MessageSquare, RefreshCw, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/contact`);
      // Sort by date descending (newest first)
      const sorted = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setMessages(sorted);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">На сайт</span>
              </Link>
              <div className="h-6 w-px bg-slate-200" />
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Inbox className="w-5 h-5 text-emerald-600" />
                Повідомлення
              </h1>
              <Badge className="bg-emerald-100 text-emerald-700">
                {messages.length}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMessages}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Оновити
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-20 text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">Поки немає повідомлень</h3>
              <p className="text-slate-500">Нові повідомлення від відвідувачів з'являться тут</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="divide-y divide-slate-100">
                      {messages.map((msg) => (
                        <button
                          key={msg.id}
                          onClick={() => setSelectedMessage(msg)}
                          className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                            selectedMessage?.id === msg.id ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-semibold text-slate-900 truncate">{msg.name}</span>
                            {!msg.is_read && (
                              <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-2" />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 truncate mb-1">{msg.email}</p>
                          <p className="text-sm text-slate-600 line-clamp-2">{msg.message}</p>
                          <p className="text-xs text-slate-400 mt-2">{formatDate(msg.created_at)}</p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Message Detail */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-100">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">{selectedMessage.name}</h2>
                        <p className="text-slate-500">{formatDate(selectedMessage.created_at)}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Email</p>
                          <a 
                            href={`mailto:${selectedMessage.email}`}
                            className="text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            {selectedMessage.email}
                          </a>
                        </div>
                      </div>
                      {selectedMessage.phone && (
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Phone className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Телефон</p>
                            <a 
                              href={`tel:${selectedMessage.phone}`}
                              className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              {selectedMessage.phone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div className="bg-slate-50 rounded-xl p-6">
                      <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Повідомлення
                      </h3>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-6">
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: Повідомлення з сайту Житомир Туризм`}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Відповісти на Email
                      </Button>
                      {selectedMessage.phone && (
                        <Button 
                          variant="outline"
                          onClick={() => window.location.href = `tel:${selectedMessage.phone}`}
                        >
                          <Phone className="w-4 h-4 mr-2" />
                          Зателефонувати
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-lg h-full min-h-[400px] flex items-center justify-center">
                  <CardContent className="text-center py-20">
                    <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">Оберіть повідомлення</h3>
                    <p className="text-slate-500">Натисніть на повідомлення зліва для перегляду</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
