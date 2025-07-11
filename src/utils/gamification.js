// src/utils/gamification.js

import { GRADES, GAME_CONFIG } from './constants';

/**
 * Utilitaires pour le système de gamification
 */

// Calculer le grade actuel basé sur les IP
export const calculateGrade = (ip) => {
    // Trouver le grade le plus élevé atteint
    for (let i = GRADES.length - 1; i >= 0; i--) {
        if (ip >= GRADES[i].ipRequired) {
            return GRADES[i];
        }
    }
    return GRADES[0]; // Grade par défaut (Recrue)
};

// Obtenir le prochain grade
export const getNextGrade = (currentLevel) => {
    if (currentLevel >= GRADES.length) return null;
    return GRADES.find(grade => grade.level === currentLevel + 1);
};

// Calculer la progression vers le prochain grade
export const calculateGradeProgress = (ip, currentLevel) => {
    const currentGrade = GRADES.find(g => g.level === currentLevel);
    const nextGrade = getNextGrade(currentLevel);

    if (!nextGrade) return 100; // Déjà au niveau max

    const currentRequired = currentGrade.ipRequired;
    const nextRequired = nextGrade.ipRequired;
    const progress = ((ip - currentRequired) / (nextRequired - currentRequired)) * 100;

    return Math.min(Math.max(progress, 0), 100);
};

// Calculer le score de diversité
export const calculateDiversityScore = (orientationCounts) => {
    if (!orientationCounts || typeof orientationCounts !== 'object') {
        return 0;
    }

    const orientationsWithArticles = Object.keys(orientationCounts).filter(
        orientation => orientationCounts[orientation] > 0
    );

    const score = Math.round((orientationsWithArticles.length / GAME_CONFIG.DIVERSITY_ORIENTATIONS) * 100);
    return Math.min(score, 100);
};

// Calculer le bonus de diversité quotidien
export const calculateDiversityBonus = (diversityScore) => {
    // +1 IP par tranche de 20% de diversité
    return Math.floor(diversityScore / 20);
};

// Vérifier si un badge peut être acheté
export const canPurchaseBadge = (userIp, badgeCost, purchasedBadges, badgeId) => {
    return userIp >= badgeCost && !purchasedBadges.includes(badgeId);
};

// Vérifier si un succès est débloqué
export const checkAchievementUnlock = (achievement, userStats) => {
    switch (achievement.id) {
        case 1: // Marathon de l'Info - 50 articles en 24h
            // À implémenter avec un tracking temporel
            return false;

        case 2: // Équilibriste Parfait - 100% diversité pendant 30 jours
            return userStats.diversityScore === 100;

        case 3: // Ambassadeur d'Élite - Parrainer 10 analystes
            return userStats.referredMembers >= 10;

        case 4: // Noctambule de l'Info
            // À implémenter avec un tracking horaire
            return false;

        case 5: // Caméléon Politique - 100 articles de chaque orientation
            if (!userStats.orientationCounts) return false;
            return Object.values(userStats.orientationCounts).every(count => count >= 100);

        default:
            return false;
    }
};

// Vérifier si une accréditation est débloquée
export const checkAccreditationUnlock = (accreditation, userStats) => {
    switch (accreditation.id) {
        case 1: // Détective Débutant - 10 articles
            return userStats.readCount >= 10;

        case 2: // Journaliste d'Investigation - 100 articles
            return userStats.readCount >= 100;

        case 3: // Archiviste en Chef - 500 articles
            return userStats.readCount >= 500;

        case 4: // Agent Ponctuel - 7 jours de streak
            return userStats.streak >= 7;

        case 5: // Esprit Ouvert - Diversité > 70%
            return userStats.diversityScore > 70;

        case 6: // Recruteur d'Élite - 1 parrain
            return userStats.referredMembers >= 1;

        default:
            return false;
    }
};

// Calculer les récompenses pour la lecture d'un article
export const calculateReadRewards = (article, userStats) => {
    let totalIP = GAME_CONFIG.POINTS_PER_ARTICLE;
    const bonuses = [];

    // Bonus de diversité
    const diversityBonus = calculateDiversityBonus(userStats.diversityScore);
    if (diversityBonus > 0) {
        totalIP += diversityBonus;
        bonuses.push({ type: 'diversity', value: diversityBonus });
    }

    // Bonus de streak (1 IP par semaine de streak)
    const streakBonus = Math.floor(userStats.streak / 7);
    if (streakBonus > 0) {
        totalIP += streakBonus;
        bonuses.push({ type: 'streak', value: streakBonus });
    }

    // Bonus première lecture d'une orientation
    if (!userStats.readOrientations?.includes(article.orientation)) {
        totalIP += 10;
        bonuses.push({ type: 'newOrientation', value: 10 });
    }

    return { totalIP, bonuses };
};

// Formater les IP avec séparateurs de milliers
export const formatIP = (ip) => {
    return new Intl.NumberFormat('fr-FR').format(ip);
};

// Obtenir le message de félicitations pour un grade
export const getGradeUpMessage = (newGrade) => {
    const messages = {
        2: "Bravo ! Vous devenez Analyste Junior. Continuez votre progression !",
        3: "Félicitations ! Vous êtes maintenant Analyste Confirmé.",
        4: "Impressionnant ! Vous atteignez le rang d'Analyste Senior.",
        5: "Remarquable ! Vous êtes promu Spécialiste du Renseignement.",
        6: "Exceptionnel ! Vous devenez Agent de Terrain.",
        7: "Extraordinaire ! Vous accédez au statut d'Agent Spécial.",
        8: "Magistral ! Vous êtes nommé Chef de Section.",
        9: "Époustouflant ! Vous devenez Directeur Adjoint.",
        10: "Légendaire ! Vous atteignez le rang suprême de Maître de l'Information !"
    };

    return messages[newGrade.level] || "Félicitations pour votre nouveau grade !";
};

// Calculer le temps restant avant reset du streak
export const getStreakTimeRemaining = (lastVisit) => {
    if (!lastVisit) return null;

    const lastVisitDate = new Date(lastVisit);
    const resetTime = new Date(lastVisitDate.getTime() + GAME_CONFIG.STREAK_RESET_HOURS * 60 * 60 * 1000);
    const now = new Date();

    if (now > resetTime) {
        return { expired: true, hours: 0, minutes: 0 };
    }

    const diff = resetTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { expired: false, hours, minutes };
};

// Obtenir les statistiques de lecture par période
export const getReadingStats = (articleReads, period = 'week') => {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'day':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        default:
            startDate = new Date(0); // Tous les temps
    }

    const filteredReads = articleReads.filter(read =>
        new Date(read.readAt) >= startDate
    );

    return {
        total: filteredReads.length,
        byOrientation: filteredReads.reduce((acc, read) => {
            acc[read.orientation] = (acc[read.orientation] || 0) + 1;
            return acc;
        }, {}),
        averagePerDay: filteredReads.length / Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)))
    };
};

export default {
    calculateGrade,
    getNextGrade,
    calculateGradeProgress,
    calculateDiversityScore,
    calculateDiversityBonus,
    canPurchaseBadge,
    checkAchievementUnlock,
    checkAccreditationUnlock,
    calculateReadRewards,
    formatIP,
    getGradeUpMessage,
    getStreakTimeRemaining,
    getReadingStats
};