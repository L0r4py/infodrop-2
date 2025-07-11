// src/types/user.js

/**
 * Types spécifiques aux utilisateurs et à la gamification
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id - ID unique de l'utilisateur
 * @property {string} email - Email de l'utilisateur
 * @property {string} [username] - Nom d'utilisateur
 * @property {string} [avatarUrl] - URL de l'avatar
 * @property {string} referralCode - Code de parrainage personnel
 * @property {string} [referredBy] - Code du parrain
 * @property {UserRole} role - Rôle de l'utilisateur
 * @property {Date} createdAt - Date de création du compte
 * @property {Date} [lastLoginAt] - Dernière connexion
 * @property {boolean} isActive - Si le compte est actif
 * @property {UserPreferences} preferences - Préférences utilisateur
 */

/**
 * @typedef {'user' | 'admin' | 'moderator'} UserRole
 */

/**
 * @typedef {Object} UserPreferences
 * @property {boolean} darkMode - Mode sombre activé
 * @property {string} language - Langue préférée
 * @property {boolean} emailNotifications - Notifications email activées
 * @property {boolean} pushNotifications - Notifications push activées
 * @property {string[]} favoriteCategories - Catégories favorites
 * @property {number} articlesPerPage - Articles par page
 */

/**
 * @typedef {Object} GameStats
 * @property {number} ip - Points d'Insight
 * @property {Grade} grade - Grade actuel
 * @property {number} streak - Jours consécutifs
 * @property {number} maxStreak - Record de streak
 * @property {number} readCount - Nombre total d'articles lus
 * @property {number} todayReadCount - Articles lus aujourd'hui
 * @property {number} diversityScore - Score de diversité (0-100)
 * @property {number[]} unlockedAccreditations - IDs des accréditations
 * @property {number[]} unlockedSucces - IDs des succès
 * @property {number[]} purchasedBadges - IDs des badges achetés
 * @property {string[]} readOrientations - Orientations lues
 * @property {Object.<string, number>} orientationCounts - Articles par orientation
 * @property {Object.<string, number>} categoryCounts - Articles par catégorie
 * @property {number} referredMembers - Nombre de filleuls actifs
 * @property {Date} lastReadAt - Dernier article lu
 * @property {Date} updatedAt - Dernière mise à jour
 */

/**
 * @typedef {Object} Grade
 * @property {number} level - Niveau (1-10)
 * @property {string} title - Titre du grade
 * @property {number} ipRequired - IP requis
 * @property {string} [icon] - Icône du grade
 * @property {string} [color] - Couleur du grade
 * @property {string[]} [perks] - Avantages du grade
 */

/**
 * @typedef {Object} UserBadge
 * @property {number} badgeId - ID du badge
 * @property {Date} unlockedAt - Date d'obtention
 * @property {boolean} isEquipped - Si le badge est équipé
 * @property {number} [displayOrder] - Ordre d'affichage
 */

/**
 * @typedef {Object} UserAchievement
 * @property {number} achievementId - ID du succès
 * @property {Date} unlockedAt - Date d'obtention
 * @property {number} progress - Progression actuelle
 * @property {number} target - Objectif à atteindre
 * @property {boolean} completed - Si complété
 */

/**
 * @typedef {Object} ReferralInfo
 * @property {string} code - Code de parrainage
 * @property {number} usesLeft - Utilisations restantes
 * @property {number} totalUses - Utilisations totales
 * @property {Referral[]} referrals - Liste des filleuls
 * @property {number} totalIPEarned - IP gagnés par parrainage
 */

/**
 * @typedef {Object} Referral
 * @property {string} userId - ID du filleul
 * @property {string} [username] - Nom du filleul
 * @property {Date} joinedAt - Date d'inscription
 * @property {boolean} isActive - Si le filleul est actif
 * @property {number} ipEarned - IP gagnés grâce à ce filleul
 */

/**
 * @typedef {Object} UserActivity
 * @property {string} type - Type d'activité
 * @property {string} description - Description
 * @property {number} [ipGained] - IP gagnés
 * @property {Object} [metadata] - Données supplémentaires
 * @property {Date} timestamp - Date de l'activité
 */

// Types d'activité
export const ACTIVITY_TYPES = {
    ARTICLE_READ: 'article_read',
    BADGE_PURCHASED: 'badge_purchased',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
    GRADE_UP: 'grade_up',
    REFERRAL_JOINED: 'referral_joined',
    STREAK_MILESTONE: 'streak_milestone',
    DIVERSITY_MILESTONE: 'diversity_milestone'
};

// Configuration des grades
export const GRADES = [
    { level: 1, title: "Recrue", ipRequired: 0, icon: "🔰", color: "gray" },
    { level: 2, title: "Analyste Junior", ipRequired: 200, icon: "📊", color: "blue" },
    { level: 3, title: "Analyste Confirmé", ipRequired: 500, icon: "📈", color: "green" },
    { level: 4, title: "Analyste Senior", ipRequired: 1000, icon: "🎯", color: "purple" },
    { level: 5, title: "Spécialiste du Renseignement", ipRequired: 2000, icon: "🕵️", color: "indigo" },
    { level: 6, title: "Agent de Terrain", ipRequired: 3500, icon: "🏃", color: "orange" },
    { level: 7, title: "Agent Spécial", ipRequired: 5500, icon: "🦅", color: "red" },
    { level: 8, title: "Chef de Section", ipRequired: 8000, icon: "⭐", color: "yellow" },
    { level: 9, title: "Directeur Adjoint", ipRequired: 12000, icon: "🏛️", color: "emerald" },
    { level: 10, title: "Maître de l'Information", ipRequired: 20000, icon: "👑", color: "gold" }
];

// Limites et contraintes
export const USER_LIMITS = {
    MAX_DAILY_READS: 100,
    MAX_REFERRAL_CODES: 3,
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 20,
    MAX_EQUIPPED_BADGES: 5,
    STREAK_RESET_HOURS: 48,
    IP_PER_ARTICLE: 5,
    IP_PER_REFERRAL: 200,
    IP_REFERRAL_BONUS: 50
};

// Helpers pour les utilisateurs
export const getUserGrade = (ip) => {
    return GRADES.slice().reverse().find(grade => ip >= grade.ipRequired) || GRADES[0];
};

export const getNextGrade = (currentLevel) => {
    return GRADES.find(grade => grade.level === currentLevel + 1);
};

export const calculateProgressToNextGrade = (ip, currentLevel) => {
    const currentGrade = GRADES.find(g => g.level === currentLevel);
    const nextGrade = getNextGrade(currentLevel);

    if (!nextGrade) return 100; // Déjà au niveau max

    const currentRequired = currentGrade.ipRequired;
    const nextRequired = nextGrade.ipRequired;
    const progress = ((ip - currentRequired) / (nextRequired - currentRequired)) * 100;

    return Math.min(Math.max(progress, 0), 100);
};

export const canPurchaseBadge = (userIp, badgeCost, purchasedBadges, badgeId) => {
    return userIp >= badgeCost && !purchasedBadges.includes(badgeId);
};

export const calculateDiversityBonus = (diversityScore) => {
    return Math.floor(diversityScore / 20); // +1 IP bonus par tranche de 20%
};