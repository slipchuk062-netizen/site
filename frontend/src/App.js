import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Header from './components/Header';
import DynamicHeroSection from './components/DynamicHeroSection';
import ClusteringHeroSection from './components/ClusteringHeroSection';
import ClustersSection from './components/ClustersSection';
import OptimizedMap from './components/OptimizedMap';
import TestimonialsSection from './components/TestimonialsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import MessagesPage from './components/MessagesPage';
import AdminPanel from './components/AdminPanel';
import TripPlanner from './components/TripPlanner';
import FeedbackForm from './components/FeedbackForm';
import AiAssistant from './components/AiAssistant';
import ClusterAnalytics from './components/ClusterAnalytics';
import PersonalizedRecommendations from './components/PersonalizedRecommendations';
import VisitStatistics from './components/VisitStatistics';
import DataUploadSection from './components/DataUploadSection';
import EnhancedClusterViz from './components/EnhancedClusterViz';
import AdvancedClusterVisualization from './components/AdvancedClusterVisualization';
import EnhancedMapFilters from './components/EnhancedMapFilters';
import MapLegend from './components/MapLegend';
import attractionsData from './data/attractions.json';
import './App.css';

const HomePage = () => {
  const [attractions, setAttractions] = useState([]);

  useEffect(() => {
    // Load attractions from JSON
    setAttractions(attractionsData);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <DynamicHeroSection attractionsCount={attractions.length} />
        <AdvancedClusterVisualization />
        <ClusteringHeroSection />
        <OptimizedMap attractions={attractions} />
        <VisitStatistics />
        <PersonalizedRecommendations />
        <DataUploadSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <Footer />
      <AiAssistant />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/trip-planner" element={<TripPlanner />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          <Route path="/analytics" element={<ClusterAnalytics />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
