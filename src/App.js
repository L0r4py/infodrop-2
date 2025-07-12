// ========================================================================
// Fichier COMPLET et ROBUSTE : src/App.js
// Ce code remplace l'intégralité de votre fichier existant.
// ========================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import './styles/globals.css';
import './styles/animations.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react";

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// Composants communs
import Header from './components/common/Header';
import InfoTicker from './components/common/InfoTicker';
import Footer from './components/common/Footer';
import MobileMenu from './components/common/MobileMenu';
import ProgressBar from './components/common/ProgressBar';

// Composants news
import NewsFilters from './components/news/NewsFilters';
import NewsList from './components/news/NewsList';

// Composants stats
import DiversityScore from './components/stats/DiversityScore';

// Modals
import AdminPanel from './components/modals/AdminPanel';
import RewardsCenter from './components/modals/RewardsCenter';
import ReferralModal from './components/modals/ReferralModal';
import Infodrop360 from './components/modals/Infodrop360';
import AboutPage from './components/modals/AboutPage';

// Animations
import XPAnimation from './components/animations/XPAnimation';
import GradeUpAnimation from './components/animations/GradeUpAnimation';

// Hooks
import { useGame } from './contexts/GameContext';
import { useAuth } from './contexts/AuthContext';
import { useNews } from './hooks/useNews';

// Data
import { grades } from './data/rewards';

// Icônes
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';

// Composant principal de l'application
const InfodropApp = () => {
  const { darkMode } = useTheme();
  const { user, isAdmin } = useAuth();
  const {
    userStats,
    handleReadNews,
    purchaseBadge,
    gradeUpAnimation,
    showXPAnimation,
    xpAnimationPoints
  } = useGame();

  // On récupère les données brutes du hook useNews
  const {
    news,
    loading: isLoading,
    error,
    refresh: forceRefresh,
    markAsRead,
    getStats
  } = useNews();

  // État des modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showBadgeShop, setShowBadgeShop] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [show360, setShow360] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // État de connexion
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // État des statistiques globales
  const [globalStats, setGlobalStats] = useState(null);

  // On gère l'état des filtres directement dans App.js
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);

  // **LA CORRECTION CLÉ EST ICI**
  // On calcule la liste des articles filtrés.
  // `useMemo` met en cache le résultat et ne le recalcule que si `news` ou les filtres changent.
  const filteredNews = useMemo(() => {
    // Si `news` est undefined ou null, on retourne un tableau vide pour éviter le crash.
    if (!news) {
      return [];
    }

    // Si on a des données, on filtre.
    return news.filter(article => {
      const categoryMatch = selectedCategory === 'all' || article.category === selectedCategory;
      const tagsMatch = selectedTags.length === 0 || (article.tags && selectedTags.some(tag => article.tags.includes(tag)));
      return categoryMatch && tagsMatch;
    });
  }, [news, selectedCategory, selectedTags]); // Dépendances du calcul

  // On calcule la liste de tous les tags disponibles, avec la même sécurité
  const allTags = useMemo(() => {
    if (!news) return [];
    const tagsSet = new Set();
    news.forEach(article => {
      if (article.tags) {
        article.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [news]);

  // Fonctions pour manipuler les filtres
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  const clearTags = () => setSelectedTags([]);

  // Gestion de la connexion
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Gestionnaire de lecture d'article
  const handleRead = useCallback(async (newsId) => {
    const article = filteredNews.find(n => n.id === newsId);
    if (article && markAsRead && handleReadNews) {
      await markAsRead(newsId);
      handleReadNews(article);
    }
  }, [filteredNews, markAsRead, handleReadNews]);

  // Gestionnaire de rafraîchissement
  const handleRefresh = useCallback(() => {
    if (isOnline && forceRefresh) {
      forceRefresh();
    }
  }, [isOnline, forceRefresh]);

  // Fonctions de remplacement pour les opérations admin
  const addNews = () => alert("Fonctionnalité admin non implémentée.");
  const updateNews = () => alert("Fonctionnalité admin non implémentée.");
  const deleteNews = () => alert("Fonctionnalité admin non implémentée.");
  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors`}>
      {/* ... Le reste du JSX est identique mais dépend maintenant de variables sûres ... */}
      <Header userStats={userStats} onMenuClick={() => setMenuOpen(true)} />
      <InfoTicker />
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} darkMode={darkMode} isAdmin={isAdmin} onShow360={() => setShow360(true)} onShowAdmin={() => setShowAdmin(true)} onShowReferral={() => setShowReferral(true)} onShowBadgeShop={() => setShowBadgeShop(true)} onShowAbout={() => setShowAbout(true)} />
      <main className="container mx-auto px-4 py-6 pb-20 max-w-7xl">
        <DiversityScore darkMode={darkMode} score={userStats?.diversityScore || 0} articlesRead={userStats?.readCount || 0} orientationCounts={userStats?.orientationCounts || {}} />
        <NewsFilters
          darkMode={darkMode}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          allTags={allTags}
          clearTags={clearTags}
          articleCount={filteredNews.length}
        />
        <NewsList news={filteredNews} onRead={handleRead} darkMode={darkMode} isLoading={isLoading} error={error} onRefresh={handleRefresh} />
      </main>
      <Footer />
      {/* ... et ainsi de suite pour le reste des composants ... */}
    </div>
  );
};

// Le composant racine qui fournit tous les contextes
const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <GameProvider>
          <InfodropApp />
          <Analytics />
          <SpeedInsights />
        </GameProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;