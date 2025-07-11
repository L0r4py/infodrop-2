// src/hooks/useGameStats.js

import { useState, useCallback, useEffect } from 'react';
import { grades } from '../data/rewards';

// Hook personnalisé pour gérer les statistiques de jeu
export const useGameStats = () => {
    // État initial des stats utilisateur
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

    // Sauvegarder les stats à chaque changement
    useEffect(() => {
        localStorage.setItem('userStats', JSON.stringify(userStats));
    }, [userStats]);

    // Ajouter des IP
    const addIP = useCallback((points) => {
        setUserStats(prev => ({
            ...prev,
            ip: prev.ip + points
        }));
    }, []);

    // Retirer des IP (pour les achats)
    const spendIP = useCallback((points) => {
        if (userStats.ip >= points) {
            setUserStats(prev => ({
                ...prev,
                ip: prev.ip - points
            }));
            return true;
        }
        return false;
    }, [userStats.ip]);

    // Mettre à jour le score de diversité
    const updateDiversityScore = useCallback(() => {
        setUserStats(prev => {
            const orientationsWithArticles = Object.keys(prev.orientationCounts || {})
                .filter(o => prev.orientationCounts[o] > 0);
            const newScore = Math.min(100, Math.round((orientationsWithArticles.length / 7) * 100));

            return {
                ...prev,
                diversityScore: newScore
            };
        });
    }, []);

    // Enregistrer la lecture d'un article
    const recordArticleRead = useCallback((orientation) => {
        setUserStats(prev => {
            const newStats = {
                ...prev,
                readCount: prev.readCount + 1,
                readOrientations: [...new Set([...prev.readOrientations, orientation])],
                orientationCounts: {
                    ...prev.orientationCounts,
                    [orientation]: (prev.orientationCounts[orientation] || 0) + 1
                }
            };

            // Calculer le nouveau score de diversité
            const orientationsWithArticles = Object.keys(newStats.orientationCounts)
                .filter(o => newStats.orientationCounts[o] > 0);
            newStats.diversityScore = Math.min(100, Math.round((orientationsWithArticles.length / 7) * 100));

            return newStats;
        });
    }, []);

    // Vérifier et mettre à jour le grade
    const checkGradeUp = useCallback(() => {
        const currentGrade = userStats.grade;
        const currentIP = userStats.ip;
        const nextGrade = grades.find(g => g.level === currentGrade + 1);

        if (nextGrade && currentIP >= nextGrade.ipRequired) {
            setUserStats(prev => ({
                ...prev,
                grade: nextGrade.level,
                gradeTitle: nextGrade.title
            }));

            return {
                upgraded: true,
                oldGrade: grades[currentGrade - 1].title,
                newGrade: nextGrade.title,
                newLevel: nextGrade.level
            };
        }

        return { upgraded: false };
    }, [userStats.grade, userStats.ip]);

    // Acheter un badge
    const purchaseBadge = useCallback((badgeId, cost) => {
        if (spendIP(cost)) {
            setUserStats(prev => ({
                ...prev,
                purchasedBadges: [...prev.purchasedBadges, badgeId]
            }));
            return true;
        }
        return false;
    }, [spendIP]);

    // Débloquer un succès
    const unlockAchievement = useCallback((achievementId, points) => {
        if (!userStats.unlockedSucces.includes(achievementId)) {
            setUserStats(prev => ({
                ...prev,
                ip: prev.ip + points,
                unlockedSucces: [...prev.unlockedSucces, achievementId]
            }));
            return true;
        }
        return false;
    }, [userStats.unlockedSucces]);

    // Débloquer une accréditation
    const unlockAccreditation = useCallback((accreditationId, points) => {
        if (!userStats.unlockedAccreditations.includes(accreditationId)) {
            setUserStats(prev => ({
                ...prev,
                ip: prev.ip + points,
                unlockedAccreditations: [...prev.unlockedAccreditations, accreditationId]
            }));
            return true;
        }
        return false;
    }, [userStats.unlockedAccreditations]);

    // Ajouter un filleul
    const addReferral = useCallback(() => {
        setUserStats(prev => ({
            ...prev,
            referredMembers: prev.referredMembers + 1,
            ip: prev.ip + 200 // Bonus parrain
        }));
    }, []);

    // Mettre à jour le streak
    const updateStreak = useCallback(() => {
        const lastVisit = localStorage.getItem('lastVisit');
        const today = new Date().toDateString();

        if (lastVisit !== today) {
            localStorage.setItem('lastVisit', today);
            setUserStats(prev => ({
                ...prev,
                streak: prev.streak + 1
            }));
            return true;
        }
        return false;
    }, []);

    // Réinitialiser les stats (utile pour les tests)
    const resetStats = useCallback(() => {
        localStorage.removeItem('userStats');
        localStorage.removeItem('lastVisit');
        setUserStats({
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
        });
    }, []);

    return {
        userStats,
        addIP,
        spendIP,
        updateDiversityScore,
        recordArticleRead,
        checkGradeUp,
        purchaseBadge,
        unlockAchievement,
        unlockAccreditation,
        addReferral,
        updateStreak,
        resetStats
    };
};

export default useGameStats;