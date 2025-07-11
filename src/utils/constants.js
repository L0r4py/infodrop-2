// src/utils/constants.js

// Configuration INFODROP
export const INFODROP_CONFIG = {
    name: 'INFODROP',
    tagline: 'Le Club privé de l\'actu gamifiée',
    theme: {
        primary: '#2c3e50',
        secondary: '#e74c3c',
        accent: '#f39c12',
        dark: '#1a1a2e',
        light: '#eef2f3'
    },
    version: '1.0.0',
    supportEmail: 'support@infodrop.fr'
};

// Couleurs des orientations politiques
export const POLITICAL_COLORS = {
    'extreme-left': '#dc3545',
    'left': '#e74c3c',
    'center-left': '#ec7063',
    'center': '#6c757d',
    'center-right': '#5dade2',
    'right': '#3498db',
    'extreme-right': '#2980b9'
};

// Ordre des orientations pour l'affichage
export const ORIENTATION_ORDER = [
    'extreme-left',
    'left',
    'center-left',
    'center',
    'center-right',
    'right',
    'extreme-right'
];

// Labels des orientations
export const ORIENTATION_LABELS = {
    'extreme-left': 'Extrême G.',
    'left': 'Gauche',
    'center-left': 'Centre G.',
    'center': 'Centre',
    'center-right': 'Centre D.',
    'right': 'Droite',
    'extreme-right': 'Extrême D.'
};

// Grades avec difficulté
export const GRADES = [
    { level: 1, title: "Recrue", ipRequired: 0 },
    { level: 2, title: "Analyste Junior", ipRequired: 200 },
    { level: 3, title: "Analyste Confirmé", ipRequired: 500 },
    { level: 4, title: "Analyste Senior", ipRequired: 1000 },
    { level: 5, title: "Spécialiste du Renseignement", ipRequired: 2000 },
    { level: 6, title: "Agent de Terrain", ipRequired: 3500 },
    { level: 7, title: "Agent Spécial", ipRequired: 5500 },
    { level: 8, title: "Chef de Section", ipRequired: 8000 },
    { level: 9, title: "Directeur Adjoint", ipRequired: 12000 },
    { level: 10, title: "Maître de l'Information", ipRequired: 20000 }
];

// Couleurs des catégories
export const CATEGORY_COLORS = {
    politique: 'bg-indigo-600',
    économie: 'bg-emerald-600',
    tech: 'bg-purple-600',
    société: 'bg-amber-600',
    environnement: 'bg-green-600'
};

// Configuration de la gamification
export const GAME_CONFIG = {
    POINTS_PER_ARTICLE: 5,
    BONUS_PARRAIN: 200,
    BONUS_FILLEUL: 50,
    MAX_DAILY_READS: 100,
    STREAK_RESET_HOURS: 48,
    DIVERSITY_ORIENTATIONS: 7,
    REFERRAL_CODES_PER_USER: 3
};

// Clés du localStorage
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'infodrop_auth_token',
    USER_STATS: 'infodrop_user_stats',
    DARK_MODE: 'infodrop_dark_mode',
    LAST_VISIT: 'infodrop_last_visit',
    PENDING_ANIMATION: 'infodrop_pending_animation',
    USER: 'user'
};

// Liens externes
export const EXTERNAL_LINKS = {
    STRIPE_SUPPORT: 'https://buy.stripe.com/7sYcN6fh6ez47u5ejh',
    TRADING_VIEW_BTC: 'https://www.tradingview.com/chart/?symbol=BTCUSD',
    TRADING_VIEW_ETH: 'https://www.tradingview.com/chart/?symbol=ETHUSD'
};

// Intervalles de mise à jour (en millisecondes)
export const UPDATE_INTERVALS = {
    TICKER: 14400000, // 4 heures
    STATS: 10000, // 10 secondes
    MEMBERS_COUNT: 10000 // 10 secondes
};

// Regex de validation
export const VALIDATION_REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    REFERRAL_CODE: /^[A-Z]{3}-[A-Z0-9]{4}$/
};