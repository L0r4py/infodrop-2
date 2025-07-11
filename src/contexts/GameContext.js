// src/contexts/GameContext.js

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Créer le contexte
const GameContext = createContext(null);

// Hook personnalisé pour utiliser le contexte
export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame doit être utilisé dans un GameProvider');
    }
    return context;
};

// Grades avec difficulté augmentée
const grades = [
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

// Provider du contexte
export const GameProvider = ({ children }) => {
    // État de gamification avec persistence
    const [userStats, setUserStats] = useState(() => {
        const saved = localStorage.getItem('userStats');
        if (saved) {
            const parsed = JSON.parse(saved);
            // S'assurer que orientationCounts existe pour les utilisateurs existants
            if (!parsed.orientationCounts) {
                parsed.orientationCounts = {};
            }
            return parsed;
        }
        return {
            ip: 0,
            grade: 1,
            gradeTitle: 'Recrue',
            streak: 0,
            readCount: 0,
            diversityScore: 41,
            unlockedAccreditations: [],
            unlockedSucces: [],
            purchasedBadges: [],
            readOrientations: [],
            orientationCounts: {},
            referralCode: 'NYO-BX89',
            referredBy: '10r4.py@gmail.com',
            referredMembers: 0
        };
    });

    const [gradeUpAnimation, setGradeUpAnimation] = useState(false);
    const [showXPAnimation, setShowXPAnimation] = useState(false);
    const [xpAnimationPoints, setXPAnimationPoints] = useState(5);

    // Sauvegarder les stats à chaque changement
    useEffect(() => {
        localStorage.setItem('userStats', JSON.stringify(userStats));
    }, [userStats]);

    // Fonction pour lire un article
    const handleReadNews = useCallback((newsItem) => {
        if (!newsItem) return;

        setUserStats(prev => {
            const newStats = {
                ...prev,
                ip: prev.ip + 5,
                readCount: prev.readCount + 1,
                readOrientations: [...new Set([...prev.readOrientations, newsItem.orientation])],
                orientationCounts: {
                    ...(prev.orientationCounts || {}),
                    [newsItem.orientation]: ((prev.orientationCounts || {})[newsItem.orientation] || 0) + 1
                }
            };

            // Calculer le nouveau score de diversité
            const orientationsWithArticles = Object.keys(newStats.orientationCounts).filter(o => newStats.orientationCounts[o] > 0);
            newStats.diversityScore = Math.min(100, Math.round((orientationsWithArticles.length / 7) * 100));

            // Vérifier le grade
            const nextGrade = grades.find(g => g.level === prev.grade + 1);

            if (nextGrade && newStats.ip >= nextGrade.ipRequired) {
                setGradeUpAnimation(true);
                setTimeout(() => setGradeUpAnimation(false), 3000);
                newStats.grade = nextGrade.level;
                newStats.gradeTitle = nextGrade.title;
            }

            return newStats;
        });

        // Afficher l'animation XP
        setXPAnimationPoints(5);
        setShowXPAnimation(true);
        setTimeout(() => setShowXPAnimation(false), 3000);
    }, []);

    // Fonction pour acheter un badge
    const purchaseBadge = useCallback((badge) => {
        if (userStats.ip >= badge.cost && !userStats.purchasedBadges.includes(badge.id)) {
            setUserStats(prev => ({
                ...prev,
                ip: prev.ip - badge.cost,
                purchasedBadges: [...prev.purchasedBadges, badge.id]
            }));
            return true;
        }
        return false;
    }, [userStats.ip, userStats.purchasedBadges]);

    // Fonction pour débloquer un succès
    const unlockAchievement = useCallback((achievementId, points) => {
        if (!userStats.unlockedSucces.includes(achievementId)) {
            setUserStats(prev => ({
                ...prev,
                ip: prev.ip + points,
                unlockedSucces: [...prev.unlockedSucces, achievementId]
            }));
        }
    }, [userStats.unlockedSucces]);

    // Fonction pour débloquer une accréditation
    const unlockAccreditation = useCallback((accreditationId, points) => {
        if (!userStats.unlockedAccreditations.includes(accreditationId)) {
            setUserStats(prev => ({
                ...prev,
                ip: prev.ip + points,
                unlockedAccreditations: [...prev.unlockedAccreditations, accreditationId]
            }));
        }
    }, [userStats.unlockedAccreditations]);

    // Fonction pour ajouter un filleul
    const addReferral = useCallback(() => {
        setUserStats(prev => ({
            ...prev,
            referredMembers: prev.referredMembers + 1,
            ip: prev.ip + 200 // Bonus parrain
        }));
    }, []);

    // Fonction pour mettre à jour le streak
    const updateStreak = useCallback(() => {
        const lastVisit = localStorage.getItem('lastVisit');
        const today = new Date().toDateString();

        if (lastVisit !== today) {
            localStorage.setItem('lastVisit', today);
            setUserStats(prev => ({
                ...prev,
                streak: prev.streak + 1
            }));
        }
    }, []);

    // Vérifier le streak au chargement
    useEffect(() => {
        updateStreak();
    }, [updateStreak]);

    const value = {
        userStats,
        grades,
        gradeUpAnimation,
        showXPAnimation,
        xpAnimationPoints,
        handleReadNews,
        purchaseBadge,
        unlockAchievement,
        unlockAccreditation,
        addReferral,
        updateStreak,
        setGradeUpAnimation,
        setShowXPAnimation
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
};

export default GameContext;