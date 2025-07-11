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
    filteredNews,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    clearTags,
    allTags,
    addNews,
    updateNews,
    deleteNews
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
  const handleRead = useCallback((newsId) => {
    const article = filteredNews.find(n => n.id === newsId);
    if (article) {
      handleReadNews(article);
    }
  }, [filteredNews, handleReadNews]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors`}>
      {/* Header */}
      <Header
        userStats={userStats}
        onMenuClick={() => setMenuOpen(true)}
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
      <main className="container mx-auto px-4 py-6 pb-20">
        {/* Score de Diversité */}
        <DiversityScore
          darkMode={darkMode}
          score={userStats.diversityScore}
          articlesRead={userStats.readCount}
          orientationCounts={userStats.orientationCounts || {}}
        />

        {/* Filtres */}
        <NewsFilters
          darkMode={darkMode}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTags={selectedTags}
          toggleTag={toggleTag}
          allTags={allTags}
          clearTags={() => clearTags()}
        />

        {/* Liste des actualités */}
        <NewsList
          news={filteredNews}
          onRead={handleRead}
          darkMode={darkMode}
        />
      </main>

      {/* Animations */}
      <XPAnimation show={showXPAnimation || localShowXP} points={localShowXP ? localXPPoints : xpAnimationPoints} />
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
        />
      )}

      {showAbout && (
        <AboutPage
          darkMode={darkMode}
          onClose={() => setShowAbout(false)}
        />
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