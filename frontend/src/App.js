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
import ClusteringAnalytics from './components/ClusteringAnalytics';
import TopPlaces from './components/TopPlaces';
import EnhancedMapFilters from './components/EnhancedMapFilters';
import MapLegend from './components/MapLegend';
import attractionsData from './data/attractions.json';
import './App.css';

const HomePage = () => {
  const [attractions, setAttractions] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [districtFilter, setDistrictFilter] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    // Load attractions from JSON
    setAttractions(attractionsData);
  }, []);

  // Filter attractions
  const filteredAttractions = attractions.filter(attr => {
    if (categoryFilter !== 'all' && attr.category !== categoryFilter) return false;
    if (ratingFilter > 0 && (!attr.rating || attr.rating < ratingFilter)) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <DynamicHeroSection attractionsCount={attractions.length} />
        <AdvancedClusterVisualization />
        <ClusteringHeroSection />
        
        {/* Map Section with Filters */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EnhancedMapFilters
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              ratingFilter={ratingFilter}
              setRatingFilter={setRatingFilter}
              districtFilter={districtFilter}
              setDistrictFilter={setDistrictFilter}
              showHeatmap={showHeatmap}
              setShowHeatmap={setShowHeatmap}
              totalAttractions={attractions.length}
              filteredCount={filteredAttractions.length}
            />
            <OptimizedMap attractions={filteredAttractions} showHeatmap={showHeatmap} />
          </div>
        </section>
        <TopPlaces />
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
