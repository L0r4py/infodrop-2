// src/components/news/NewsCard.js

import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';

// Couleurs des orientations politiques
const POLITICAL_COLORS = {
    'extreme-left': '#dc3545',
    'left': '#e74c3c',
    'center-left': '#ec7063',
    'center': '#6c757d',
    'center-right': '#5dade2',
    'right': '#3498db',
    'extreme-right': '#2980b9'
};

// Composant Card d'actualité avec tags
const NewsCard = ({ news, onRead, darkMode }) => {
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const handleClick = () => {
        // Sauvegarder l'animation en attente AVANT de changer d'onglet
        localStorage.setItem('pendingAnimation', JSON.stringify({
            type: 'read',
            newsId: news.id,
            points: 5,
            timestamp: Date.now()
        }));

        // Appeler onRead pour mettre à jour les stats
        onRead(news.id);

        // Petit délai pour s'assurer que le localStorage est bien écrit
        setTimeout(() => {
            window.open(news.url, '_blank');
        }, 100);
    };

    return (
        <div
            id={`news-${news.id}`}
            className={`relative overflow-hidden rounded-lg ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                } border shadow-sm hover:shadow-md transform hover:scale-[1.01] transition-all duration-200 cursor-pointer mb-4`}
            onClick={handleClick}
        >
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Nom de la source sans badge coloré */}
                        <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {news.source}
                        </span>

                        {/* Badge d'orientation politique */}
                        <span
                            className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: POLITICAL_COLORS[news.orientation] }}
                        >
                            {news.orientation.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-50 text-gray-500" />
                </div>

                <h3 className={`font-semibold text-base mb-3 ${darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                    {news.title}
                </h3>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(news.timestamp)}
                        </span>
                        <span className="flex items-center gap-1">
                            👁️ {news.views}
                        </span>

                        {/* Tags déplacés ici, à côté du nombre de vues */}
                        {news.tags && news.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute -top-10 right-4 text-lg font-bold text-emerald-500 opacity-0 hover:opacity-100 transition-opacity">
                +5 IP
            </div>
        </div>
    );
};

export default NewsCard;