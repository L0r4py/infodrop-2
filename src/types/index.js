// src/types/index.js

/**
 * Types principaux de l'application INFODROP
 * Utilisation de JSDoc pour la documentation des types
 */

/**
 * @typedef {Object} User
 * @property {string} id - ID unique de l'utilisateur
 * @property {string} email - Email de l'utilisateur
 * @property {string} [referralCode] - Code de parrainage de l'utilisateur
 * @property {string} [referredBy] - Code du parrain
 * @property {Date} createdAt - Date de création du compte
 * @property {boolean} [isAdmin] - Si l'utilisateur est admin
 */

/**
 * @typedef {Object} UserStats
 * @property {number} ip - Points d'Insight
 * @property {number} grade - Niveau actuel (1-10)
 * @property {string} gradeTitle - Titre du grade
 * @property {number} streak - Jours consécutifs
 * @property {number} readCount - Nombre d'articles lus
 * @property {number} diversityScore - Score de diversité (0-100)
 * @property {number[]} unlockedAccreditations - IDs des accréditations débloquées
 * @property {number[]} unlockedSucces - IDs des succès débloqués
 * @property {number[]} purchasedBadges - IDs des badges achetés
 * @property {string[]} readOrientations - Orientations politiques lues
 * @property {Object.<string, number>} orientationCounts - Compteur par orientation
 * @property {string} referralCode - Code de parrainage personnel
 * @property {string} [referredBy] - Code du parrain
 * @property {number} referredMembers - Nombre de filleuls
 */

/**
 * @typedef {Object} Article
 * @property {number} id - ID unique de l'article
 * @property {string} title - Titre de l'article
 * @property {string} source - Source de l'article
 * @property {string} category - Catégorie (politique, économie, tech, etc.)
 * @property {string} orientation - Orientation politique
 * @property {string[]} [tags] - Tags associés
 * @property {string} url - URL de l'article original
 * @property {number} timestamp - Timestamp de publication
 * @property {number} views - Nombre de vues
 * @property {string} [userId] - ID de l'utilisateur qui a ajouté l'article
 * @property {Date} [createdAt] - Date de création dans la DB
 */

/**
 * @typedef {Object} Grade
 * @property {number} level - Niveau du grade
 * @property {string} title - Titre du grade
 * @property {number} ipRequired - IP requis pour atteindre ce grade
 */

/**
 * @typedef {Object} Badge
 * @property {number} id - ID unique du badge
 * @property {string} name - Nom du badge
 * @property {string} description - Description du badge
 * @property {number} cost - Coût en IP
 * @property {React.ReactElement} icon - Icône du badge
 * @property {string} color - Classe de couleur Tailwind
 */

/**
 * @typedef {Object} Achievement
 * @property {number} id - ID unique du succès
 * @property {string} name - Nom du succès
 * @property {string} description - Description du succès
 * @property {React.ReactElement} icon - Icône du succès
 * @property {number} points - Points IP gagnés
 * @property {boolean} unlocked - Si le succès est débloqué
 */

/**
 * @typedef {Object} Accreditation
 * @property {number} id - ID unique de l'accréditation
 * @property {string} name - Nom de l'accréditation
 * @property {string} description - Description de l'accréditation
 * @property {number} points - Points IP gagnés
 * @property {boolean} locked - Si l'accréditation est verrouillée
 */

// Types d'orientation politique
export const OrientationType = {
    EXTREME_LEFT: 'extreme-left',
    LEFT: 'left',
    CENTER_LEFT: 'center-left',
    CENTER: 'center',
    CENTER_RIGHT: 'center-right',
    RIGHT: 'right',
    EXTREME_RIGHT: 'extreme-right'
};

// Types de catégories
export const CategoryType = {
    ALL: 'all',
    POLITIQUE: 'politique',
    ECONOMIE: 'économie',
    TECH: 'tech',
    SOCIETE: 'société',
    ENVIRONNEMENT: 'environnement'
};

// Types d'animation
export const AnimationType = {
    XP: 'xp',
    GRADE_UP: 'gradeUp',
    ACHIEVEMENT: 'achievement',
    BADGE_PURCHASED: 'badgePurchased'
};

// Types de modals
export const ModalType = {
    ADMIN: 'admin',
    REWARDS: 'rewards',
    REFERRAL: 'referral',
    INFODROP_360: 'infodrop360',
    ABOUT: 'about'
};

// Status de requête
export const RequestStatus = {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
};

// Types d'erreur
export const ErrorType = {
    AUTH: 'auth',
    NETWORK: 'network',
    VALIDATION: 'validation',
    NOT_FOUND: 'notFound',
    SERVER: 'server',
    UNKNOWN: 'unknown'
};

// Export des types pour réutilisation
export default {
    OrientationType,
    CategoryType,
    AnimationType,
    ModalType,
    RequestStatus,
    ErrorType
};