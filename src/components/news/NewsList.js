// src/components/news/NewsList.js

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import NewsCard from './NewsCard';
import { useNews } from '../../hooks/useNews';

// Composant de liste des actualités
const NewsList = ({
    news,
    onRead,
    darkMode,
    isLoading = false,
    error = null,
    showRefreshButton = true,
    onRefresh,
    gridView = false,
    showStats = true
}) => {
    const { formatDate } = useNews();
    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

    // Mettre à jour l'heure du dernier rafraîchissement
    useEffect(() => {
        setLastUpdateTime(new Date());
    }, [news]);

    // Calculer le temps écoulé depuis la dernière mise à jour
    const getTimeSinceUpdate = () => {
        const now = new Date();
        const diff = Math.floor((now - lastUpdateTime) / 1000); // en secondes

        if (diff < 60) return 'À l\'instant';
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
        return `Il y a ${Math.floor(diff / 86400)}j`;
    };

    // État de chargement
    if (isLoading && news.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chargement des actualités...
                </p>
            </div>
        );
    }

    // État d'erreur
    if (error) {
        return (
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-red-900/20' : 'bg-red-50'} border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                        <h3 className={`font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                            Erreur de chargement
                        </h3>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                            {error}
                        </p>
                    </div>
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        Réessayer
                    </button>
                )}
            </div>
        );
    }

    // Aucun article
    if (!news || news.length === 0) {
        return (
            <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="mb-4">
                    <Calendar className="w-16 h-16 mx-auto opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Aucun article disponible</h3>
                <p className="text-sm">
                    Les articles apparaîtront ici dès qu'ils seront disponibles.
                </p>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Actualiser
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* En-tête avec stats et bouton refresh */}
            {(showStats || showRefreshButton) && (
                <div className={`flex items-center justify-between mb-4 pb-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-4">
                        {showStats && (
                            <>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <strong className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        {news.length}
                                    </strong> article{news.length > 1 ? 's' : ''}
                                </span>
                                <span className={`text-sm flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                    <Clock className="w-3 h-3" />
                                    {getTimeSinceUpdate()}
                                </span>
                            </>
                        )}
                    </div>

                    {showRefreshButton && onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium
                                transition-all duration-200 
                                flex items-center gap-2
                                ${darkMode
                                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }
                                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            title="Actualiser les articles"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Actualisation...' : 'Actualiser'}
                        </button>
                    )}
                </div>
            )}

            {/* Indicateur de chargement en cours */}
            {isLoading && news.length > 0 && (
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} border ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                    <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                        <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            Recherche de nouveaux articles...
                        </span>
                    </div>
                </div>
            )}

            {/* Liste des articles */}
            <div className={gridView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {news.map((item, index) => (
                    <div
                        key={item.id}
                        className="animate-fadeIn"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <NewsCard
                            news={item}
                            onRead={onRead}
                            darkMode={darkMode}
                            formatDate={formatDate}
                            showSource={true}
                            showTags={true}
                        />
                    </div>
                ))}
            </div>

            {/* Indicateur de fin de liste */}
            {news.length > 20 && (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <div className={`w-16 h-px mx-auto mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                    <p className="text-sm">
                        Fin des articles • {news.length} articles affichés
                    </p>
                </div>
            )}
        </div>
    );
};

// Styles CSS pour les animations
const styles = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
}
`;

// Ajouter les styles au document
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

export default NewsList;