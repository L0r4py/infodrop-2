// src/components/news/NewsCard.js

import React, { useState } from 'react';
import { ExternalLink, Clock, Eye, Tag, Calendar } from 'lucide-react';

// Couleurs des orientations politiques
const POLITICAL_COLORS = {
    'extrême-gauche': '#8B0000',     // Rouge foncé
    'gauche': '#DC143C',             // Rouge
    'centre-gauche': '#FF6B6B',      // Rouge clair
    'centre': '#6C757D',             // Gris
    'neutre': '#6C757D',             // Gris (alias)
    'centre-droit': '#4DABF7',       // Bleu clair
    'droite': '#1971C2',             // Bleu
    'extrême-droite': '#1C3A57',     // Bleu foncé
    'gouvernement': '#28A745',       // Vert
    'international': '#9C27B0',      // Violet
};

// Obtenir le label lisible de l'orientation
const getOrientationLabel = (orientation) => {
    const labels = {
        'extrême-gauche': 'Extrême Gauche',
        'gauche': 'Gauche',
        'centre-gauche': 'Centre Gauche',
        'centre': 'Centre',
        'neutre': 'Neutre',
        'centre-droit': 'Centre Droit',
        'droite': 'Droite',
        'extrême-droite': 'Extrême Droite',
        'gouvernement': 'Gouvernement',
        'international': 'International'
    };
    return labels[orientation] || orientation;
};

// Composant Card d'actualité avec tags
const NewsCard = ({
    news,
    onRead,
    darkMode,
    formatDate,
    showSource = true,
    showTags = true,
    showSummary = false,
    compact = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Formatage du temps relatif
    const getRelativeTime = (timestamp) => {
        const now = new Date();
        const articleDate = new Date(timestamp);
        const diffInSeconds = Math.floor((now - articleDate) / 1000);

        if (diffInSeconds < 60) return 'À l\'instant';
        if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
        if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
        return formatDate ? formatDate(timestamp) : articleDate.toLocaleDateString('fr-FR');
    };

    // Formater l'heure simple
    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Gestion du clic
    const handleClick = (e) => {
        e.preventDefault();

        // Sauvegarder l'animation en attente
        localStorage.setItem('pendingAnimation', JSON.stringify({
            type: 'read',
            newsId: news.id,
            points: 5,
            timestamp: Date.now()
        }));

        // Appeler onRead pour mettre à jour les stats
        if (onRead) {
            onRead(news.id);
        }

        // Ouvrir dans un nouvel onglet avec un petit délai
        setTimeout(() => {
            window.open(news.url, '_blank', 'noopener,noreferrer');
        }, 100);
    };

    // Obtenir la couleur de l'orientation
    const orientationColor = POLITICAL_COLORS[news.orientation] || POLITICAL_COLORS['neutre'];

    return (
        <article
            id={`news-${news.id}`}
            className={`
                relative overflow-hidden rounded-lg 
                ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} 
                border shadow-sm hover:shadow-lg 
                transform transition-all duration-200 
                ${isHovered ? 'scale-[1.02]' : 'scale-100'}
                cursor-pointer
                ${compact ? 'p-3' : 'p-4'}
            `}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Barre colorée d'orientation */}
            <div
                className="absolute top-0 left-0 w-1 h-full transition-all duration-200"
                style={{
                    backgroundColor: orientationColor,
                    width: isHovered ? '3px' : '2px'
                }}
            />

            {/* En-tête avec source et orientation */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Source */}
                    {showSource && (
                        <span className={`
                            text-xs font-semibold
                            ${darkMode ? 'text-gray-400' : 'text-gray-600'}
                        `}>
                            {news.source}
                        </span>
                    )}

                    {/* Badge d'orientation */}
                    <span
                        className="px-2 py-1 text-xs font-medium rounded-full text-white shadow-sm"
                        style={{ backgroundColor: orientationColor }}
                    >
                        {getOrientationLabel(news.orientation)}
                    </span>

                    {/* Tags principaux (max 2 sur mobile) */}
                    {showTags && news.tags && news.tags.length > 0 && (
                        <div className="hidden sm:flex gap-1">
                            {news.tags.slice(0, 2).map((tag, index) => (
                                <span
                                    key={index}
                                    className={`
                                        px-2 py-0.5 text-xs rounded
                                        ${darkMode
                                            ? 'bg-gray-700 text-gray-300'
                                            : 'bg-gray-100 text-gray-700'
                                        }
                                    `}
                                >
                                    #{tag}
                                </span>
                            ))}
                            {news.tags.length > 2 && (
                                <span className="text-xs text-gray-500">
                                    +{news.tags.length - 2}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Icône lien externe */}
                <ExternalLink className={`
                    w-4 h-4 transition-all duration-200
                    ${darkMode ? 'text-gray-600' : 'text-gray-400'}
                    ${isHovered ? 'opacity-100 transform translate-x-0' : 'opacity-50 transform -translate-x-2'}
                `} />
            </div>

            {/* Titre */}
            <h3 className={`
                font-semibold mb-3 line-clamp-2
                ${compact ? 'text-sm' : 'text-base'}
                ${darkMode ? 'text-gray-100' : 'text-gray-900'}
                ${isHovered ? 'text-blue-600 dark:text-blue-400' : ''}
                transition-colors duration-200
            `}>
                {news.title}
            </h3>

            {/* Résumé (optionnel) */}
            {showSummary && news.summary && !compact && (
                <p className={`
                    text-sm mb-3 line-clamp-2
                    ${darkMode ? 'text-gray-400' : 'text-gray-600'}
                `}>
                    {news.summary}
                </p>
            )}

            {/* Footer avec métadonnées */}
            <div className="flex items-center justify-between mt-auto">
                <div className={`
                    flex items-center gap-3 text-xs 
                    ${darkMode ? 'text-gray-500' : 'text-gray-500'}
                `}>
                    {/* Heure de publication */}
                    <span className="flex items-center gap-1" title={formatDate ? formatDate(news.publishedAt) : ''}>
                        <Clock className="w-3 h-3" />
                        {getRelativeTime(news.publishedAt || news.timestamp)}
                    </span>

                    {/* Nombre de vues */}
                    {news.views > 0 && (
                        <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {news.views}
                        </span>
                    )}

                    {/* Tags sur mobile */}
                    {showTags && news.tags && news.tags.length > 0 && (
                        <div className="flex sm:hidden items-center gap-1">
                            <Tag className="w-3 h-3" />
                            <span>{news.tags.length}</span>
                        </div>
                    )}
                </div>

                {/* Indicateur de catégorie */}
                {news.category && (
                    <span className={`
                        text-xs px-2 py-0.5 rounded
                        ${darkMode
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-gray-100 text-gray-600'
                        }
                    `}>
                        {news.category}
                    </span>
                )}
            </div>

            {/* Animation +5 IP au survol */}
            <div className={`
                absolute top-2 right-2
                px-2 py-1 rounded-full
                bg-emerald-500 text-white text-xs font-bold
                transform transition-all duration-300
                ${isHovered
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 -translate-y-2 scale-95'
                }
            `}>
                +5 IP
            </div>

            {/* Effet de survol lumineux */}
            <div
                className={`
                    absolute inset-0 rounded-lg pointer-events-none
                    transition-opacity duration-300
                    ${isHovered ? 'opacity-100' : 'opacity-0'}
                `}
                style={{
                    background: darkMode
                        ? 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.1) 0%, transparent 60%)'
                        : 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.05) 0%, transparent 60%)'
                }}
            />
        </article>
    );
};

export default NewsCard;