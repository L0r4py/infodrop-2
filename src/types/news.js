// src/types/news.js

/**
 * Types spécifiques aux actualités
 */

/**
 * @typedef {Object} NewsArticle
 * @property {number} id - ID unique de l'article
 * @property {string} title - Titre de l'article
 * @property {string} source - Source de l'article
 * @property {NewsCategory} category - Catégorie de l'article
 * @property {PoliticalOrientation} orientation - Orientation politique
 * @property {string[]} tags - Tags associés
 * @property {string} url - URL de l'article original
 * @property {number} timestamp - Timestamp de publication
 * @property {number} views - Nombre de vues
 * @property {string} [excerpt] - Extrait de l'article
 * @property {string} [imageUrl] - URL de l'image de couverture
 * @property {string} [author] - Auteur de l'article
 * @property {string} [userId] - ID de l'utilisateur qui a ajouté l'article
 * @property {Date} createdAt - Date d'ajout dans INFODROP
 * @property {Date} [updatedAt] - Date de dernière mise à jour
 */

/**
 * @typedef {'all' | 'politique' | 'économie' | 'tech' | 'société' | 'environnement'} NewsCategory
 */

/**
 * @typedef {'extreme-left' | 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'extreme-right'} PoliticalOrientation
 */

/**
 * @typedef {Object} NewsSource
 * @property {string} name - Nom de la source
 * @property {PoliticalOrientation} orientation - Orientation politique
 * @property {string} category - Catégorie principale
 * @property {string} [logoUrl] - URL du logo
 * @property {string} [website] - Site web officiel
 * @property {boolean} [isActive] - Si la source est active
 */

/**
 * @typedef {Object} NewsFilters
 * @property {NewsCategory} [category] - Filtrer par catégorie
 * @property {PoliticalOrientation} [orientation] - Filtrer par orientation
 * @property {string[]} [tags] - Filtrer par tags
 * @property {string} [search] - Recherche textuelle
 * @property {number} [limit] - Limite de résultats
 * @property {number} [offset] - Décalage pour pagination
 * @property {'latest' | 'popular' | 'diverse'} [sortBy] - Tri des résultats
 * @property {Date} [dateFrom] - Date de début
 * @property {Date} [dateTo] - Date de fin
 */

/**
 * @typedef {Object} NewsStats
 * @property {number} total - Nombre total d'articles
 * @property {Object.<NewsCategory, number>} byCategory - Articles par catégorie
 * @property {Object.<PoliticalOrientation, number>} byOrientation - Articles par orientation
 * @property {number} last24h - Articles des dernières 24h
 * @property {number} activeSources - Nombre de sources actives
 * @property {string[]} topTags - Tags les plus populaires
 * @property {number} averageViews - Moyenne de vues par article
 */

/**
 * @typedef {Object} ArticleRead
 * @property {string} userId - ID de l'utilisateur
 * @property {number} articleId - ID de l'article
 * @property {PoliticalOrientation} orientation - Orientation de l'article lu
 * @property {Date} readAt - Date de lecture
 * @property {number} [readingTime] - Temps de lecture en secondes
 * @property {boolean} [completed] - Si l'article a été lu entièrement
 */

/**
 * @typedef {Object} DiversityMetrics
 * @property {number} score - Score de diversité (0-100)
 * @property {Object.<PoliticalOrientation, number>} orientationCounts - Nombre d'articles par orientation
 * @property {PoliticalOrientation[]} missingOrientations - Orientations non lues
 * @property {number} uniqueSourcesCount - Nombre de sources uniques
 * @property {number} balanceIndex - Index d'équilibre (0-1)
 */

// Constantes pour les catégories
export const NEWS_CATEGORIES = {
    ALL: 'all',
    POLITIQUE: 'politique',
    ECONOMIE: 'économie',
    TECH: 'tech',
    SOCIETE: 'société',
    ENVIRONNEMENT: 'environnement'
};

// Constantes pour les orientations
export const POLITICAL_ORIENTATIONS = {
    EXTREME_LEFT: 'extreme-left',
    LEFT: 'left',
    CENTER_LEFT: 'center-left',
    CENTER: 'center',
    CENTER_RIGHT: 'center-right',
    RIGHT: 'right',
    EXTREME_RIGHT: 'extreme-right'
};

// Configuration des catégories
export const CATEGORY_CONFIG = {
    [NEWS_CATEGORIES.ALL]: {
        label: 'Toutes',
        color: 'bg-blue-600',
        icon: 'newspaper'
    },
    [NEWS_CATEGORIES.POLITIQUE]: {
        label: 'Politique',
        color: 'bg-indigo-600',
        icon: 'landmark'
    },
    [NEWS_CATEGORIES.ECONOMIE]: {
        label: 'Économie',
        color: 'bg-emerald-600',
        icon: 'trending-up'
    },
    [NEWS_CATEGORIES.TECH]: {
        label: 'Tech',
        color: 'bg-purple-600',
        icon: 'cpu'
    },
    [NEWS_CATEGORIES.SOCIETE]: {
        label: 'Société',
        color: 'bg-amber-600',
        icon: 'users'
    },
    [NEWS_CATEGORIES.ENVIRONNEMENT]: {
        label: 'Environnement',
        color: 'bg-green-600',
        icon: 'leaf'
    }
};

// Configuration des orientations
export const ORIENTATION_CONFIG = {
    [POLITICAL_ORIENTATIONS.EXTREME_LEFT]: {
        label: 'Extrême Gauche',
        shortLabel: 'Extrême G.',
        color: '#dc3545'
    },
    [POLITICAL_ORIENTATIONS.LEFT]: {
        label: 'Gauche',
        shortLabel: 'Gauche',
        color: '#e74c3c'
    },
    [POLITICAL_ORIENTATIONS.CENTER_LEFT]: {
        label: 'Centre Gauche',
        shortLabel: 'Centre G.',
        color: '#ec7063'
    },
    [POLITICAL_ORIENTATIONS.CENTER]: {
        label: 'Centre',
        shortLabel: 'Centre',
        color: '#6c757d'
    },
    [POLITICAL_ORIENTATIONS.CENTER_RIGHT]: {
        label: 'Centre Droit',
        shortLabel: 'Centre D.',
        color: '#5dade2'
    },
    [POLITICAL_ORIENTATIONS.RIGHT]: {
        label: 'Droite',
        shortLabel: 'Droite',
        color: '#3498db'
    },
    [POLITICAL_ORIENTATIONS.EXTREME_RIGHT]: {
        label: 'Extrême Droite',
        shortLabel: 'Extrême D.',
        color: '#2980b9'
    }
};

// Helpers pour les types
export const isValidCategory = (category) => {
    return Object.values(NEWS_CATEGORIES).includes(category);
};

export const isValidOrientation = (orientation) => {
    return Object.values(POLITICAL_ORIENTATIONS).includes(orientation);
};

export const getOrientationOrder = () => [
    POLITICAL_ORIENTATIONS.EXTREME_LEFT,
    POLITICAL_ORIENTATIONS.LEFT,
    POLITICAL_ORIENTATIONS.CENTER_LEFT,
    POLITICAL_ORIENTATIONS.CENTER,
    POLITICAL_ORIENTATIONS.CENTER_RIGHT,
    POLITICAL_ORIENTATIONS.RIGHT,
    POLITICAL_ORIENTATIONS.EXTREME_RIGHT
];