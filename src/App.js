// src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './styles/globals.css';
import './styles/animations.css';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/react"

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

  const {
    news,
    filteredNews,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    clearTags,
    allTags,
    isLoading,
    error,
    forceRefresh,
    addNews,
    updateNews,
    deleteNews,
    markAsRead,
    formatDate,
    getStats
  } = useNews();

  // État des modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showBadgeShop, setShowBadgeShop] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [show360, setShow360] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // État local pour l'animation XP en attente
  const [localShowXP, setLocalShowXP] = useState(false);
  const [localXPPoints, setLocalXPPoints] = useState(5);

  // État de connexion
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Statistiques globales
  const [globalStats, setGlobalStats] = useState(null);

  // Vérifier la connexion internet
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

  // Charger les stats globales
  useEffect(() => {
    const loadStats = async () => {
      const stats = await getStats();
      setGlobalStats(stats);
    };
    
    loadStats();
    // Rafraîchir les stats toutes les 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [getStats]);

  // Vérifier les animations en attente au chargement et au focus
  useEffect(() => {
    const checkPendingAnimation = () => {
      const pendingAnimation = localStorage.getItem('pendingAnimation');
      if (pendingAnimation) {
        try {
          const animation = JSON.parse(pendingAnimation);
          // Pas de limite de temps - on joue l'animation peu importe quand
          console.log('Animation XP en attente détectée');

          // Déclencher l'animation XP après un petit délai
          setTimeout(() => {
            setLocalXPPoints(animation.points || 5);
            setLocalShowXP(true);

            // Cacher après 3 secondes
            setTimeout(() => setLocalShowXP(false), 3000);
          }, 500);

          // Nettoyer après lecture
          localStorage.removeItem('pendingAnimation');
        } catch (error) {
          console.error('Erreur lors de la lecture de l\'animation en attente:', error);
          localStorage.removeItem('pendingAnimation');
        }
      }
    };

    // Vérifier au montage
    checkPendingAnimation();

    // Vérifier quand la fenêtre redevient active
    const handleFocus = () => {
      checkPendingAnimation();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Gestionnaire de lecture d'article
  const handleRead = useCallback(async (newsId) => {
    const article = filteredNews.find(n => n.id === newsId);
    if (article) {
      // Marquer comme lu dans la base
      await markAsRead(newsId);
      // Gérer les points et animations
      handleReadNews(article);
    }
  }, [filteredNews, handleReadNews, markAsRead]);

  // Gestionnaire de rafraîchissement
  const handleRefresh = useCallback(() => {
    if (isOnline) {
      forceRefresh();
    }
  }, [isOnline, forceRefresh]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors`}>
      {/* Indicateur de connexion */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-center py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">Mode hors ligne - Les articles peuvent ne pas être à jour</span>
        </div>
      )}

      {/* Header */}
      <Header
        userStats={userStats}
        onMenuClick={() => setMenuOpen(true)}
        globalStats={globalStats}
      />

      {/* Info Ticker */}
      <InfoTicker />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        darkMode={darkMode}
        isAdmin={isAdmin}
        onShow360={() => setShow360(true)}
        onShowAdmin={() => setShowAdmin(true)}
        onShowReferral={() => setShowReferral(true)}
        onShowBadgeShop={() => setShowBadgeShop(true)}
        onShowAbout={() => setShowAbout(true)}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-20 max-w-7xl">
        {/* Score de Diversité */}
        <DiversityScore
          darkMode={darkMode}
          score={userStats.diversityScore}
          articlesRead={userStats.readCount}
          orientationCounts={userStats.orientationCounts || {}}
        />

        {/* Statistiques rapides */}
        {globalStats && (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="text-2xl font-bold text-blue-500">{globalStats.total_articles}</div>
              <div className="text-sm">Articles aujourd'hui</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="text-2xl font-bold text-emerald-500">{globalStats.active_sources}</div>
              <div className="text-sm">Sources actives</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="text-2xl font-bold text-purple-500">{news.length}</div>
              <div className="text-sm">Articles affichés</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
              <div className="text-2xl font-bold text-orange-500">{userStats.readCount}</div>
              <div className="text-sm">Articles lus</div>
            </div>
          </div>
        )}

        {/* Filtres */}
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

        {/* Liste des actualités */}
        <NewsList
          news={filteredNews}
          onRead={handleRead}
          darkMode={darkMode}
          isLoading={isLoading}
          error={error}
          onRefresh={handleRefresh}
          showRefreshButton={true}
          showStats={true}
          formatDate={formatDate}
        />
      </main>

      {/* Bouton flottant de rafraîchissement (mobile) */}
      <button
        onClick={handleRefresh}
        disabled={isLoading || !isOnline}
        className={`
          md:hidden fixed bottom-24 right-4 z-40
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-200 transform
          ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}
          ${isLoading ? 'scale-95 opacity-75' : 'hover:scale-105'}
          ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={isOnline ? "Actualiser les articles" : "Hors ligne"}
      >
        {isOnline ? (
          <RefreshCw className={`w-6 h-6 text-white ${isLoading ? 'animate-spin' : ''}`} />
        ) : (
          <WifiOff className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Animations */}
      <XPAnimation 
        show={showXPAnimation || localShowXP} 
        points={localShowXP ? localXPPoints : xpAnimationPoints} 
      />
      <GradeUpAnimation
        show={gradeUpAnimation}
        oldGrade={userStats.gradeTitle}
        newGrade={grades[userStats.grade - 1]?.title}
        newLevel={userStats.grade}
      />

      {/* Progress Bar */}
      <ProgressBar userStats={userStats} grades={grades} />

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {showAdmin && (
        <AdminPanel
          darkMode={darkMode}
          news={filteredNews}
          onClose={() => setShowAdmin(false)}
          onAddNews={addNews}
          onUpdateNews={updateNews}
          onDeleteNews={deleteNews}
          formatDate={formatDate}
        />
      )}

      {showReferral && (
        <ReferralModal
          darkMode={darkMode}
          userStats={userStats}
          onClose={() => setShowReferral(false)}
        />
      )}

      {showBadgeShop && (
        <RewardsCenter
          darkMode={darkMode}
          userStats={userStats}
          onClose={() => setShowBadgeShop(false)}
          onPurchase={purchaseBadge}
        />
      )}

      {show360 && (
        <Infodrop360
          darkMode={darkMode}
          onClose={() => setShow360(false)}
          userStats={userStats}
        />
      )}

      {showAbout && (
        <AboutPage
          darkMode={darkMode}
          onClose={() => setShowAbout(false)}
        />
      )}

      {/* Notifications système (si besoin) */}
      {error && !isLoading && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
          <div className={`
            p-4 rounded-lg shadow-lg border
            ${darkMode 
              ? 'bg-red-900/90 border-red-700 text-red-100' 
              : 'bg-red-50 border-red-200 text-red-800'
            }
          `}>
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <p className="font-medium">Erreur de chargement</p>
                <p className="text-sm mt-1 opacity-90">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="text-sm underline hover:no-underline"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant racine avec les providers
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