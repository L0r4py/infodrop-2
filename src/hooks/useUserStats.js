// src/hooks/useUserStats.js

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { grades } from '../data/rewards';

// Hook personnalisé pour gérer les stats utilisateur
export const useUserStats = () => {
    const { user, getUserStats, updateUserStats: updateSupabaseStats } = useSupabase();

    // État local des stats
    const [userStats, setUserStats] = useState(() => {
        const saved = localStorage.getItem('userStats');
        if (saved) {
            return JSON.parse(saved);
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
            referredMembers: 0,
            lastSync: null
        };
    });

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);

    // Synchroniser avec Supabase au chargement si connecté
    useEffect(() => {
        if (user && !userStats.lastSync) {
            syncWithSupabase();
        }
    }, [user]);

    // Sauvegarder dans localStorage à chaque changement
    useEffect(() => {
        localStorage.setItem('userStats', JSON.stringify(userStats));
    }, [userStats]);

    // Synchroniser avec Supabase
    const syncWithSupabase = useCallback(async () => {
        if (!user || isSyncing) return;

        setIsSyncing(true);
        setSyncError(null);

        try {
            // Récupérer les stats depuis Supabase
            const { data, error } = await getUserStats();

            if (error) throw error;

            if (data) {
                // Fusionner avec les stats locales (prendre le max pour éviter les pertes)
                setUserStats(prev => ({
                    ...prev,
                    ip: Math.max(prev.ip, data.ip || 0),
                    grade: Math.max(prev.grade, data.grade || 1),
                    gradeTitle: data.grade > prev.grade ? data.grade_title : prev.gradeTitle,
                    streak: Math.max(prev.streak, data.streak || 0),
                    readCount: Math.max(prev.readCount, data.read_count || 0),
                    diversityScore: Math.max(prev.diversityScore, data.diversity_score || 41),
                    unlockedAccreditations: [...new Set([...prev.unlockedAccreditations, ...(data.unlocked_accreditations || [])])],
                    unlockedSucces: [...new Set([...prev.unlockedSucces, ...(data.unlocked_achievements || [])])],
                    purchasedBadges: [...new Set([...prev.purchasedBadges, ...(data.purchased_badges || [])])],
                    referralCode: data.referral_code || prev.referralCode,
                    referredBy: data.referred_by || prev.referredBy,
                    referredMembers: Math.max(prev.referredMembers, data.referred_members || 0),
                    lastSync: new Date().toISOString()
                }));
            }
        } catch (error) {
            console.error('Erreur de synchronisation:', error);
            setSyncError(error.message);
        } finally {
            setIsSyncing(false);
        }
    }, [user, getUserStats, isSyncing]);

    // Sauvegarder vers Supabase
    const saveToSupabase = useCallback(async (stats) => {
        if (!user) return;

        try {
            await updateSupabaseStats({
                ip: stats.ip,
                grade: stats.grade,
                grade_title: stats.gradeTitle,
                streak: stats.streak,
                read_count: stats.readCount,
                diversity_score: stats.diversityScore,
                unlocked_accreditations: stats.unlockedAccreditations,
                unlocked_achievements: stats.unlockedSucces,
                purchased_badges: stats.purchasedBadges,
                orientation_counts: stats.orientationCounts,
                referral_code: stats.referralCode,
                referred_by: stats.referredBy,
                referred_members: stats.referredMembers
            });

            setUserStats(prev => ({
                ...prev,
                lastSync: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Erreur de sauvegarde:', error);
            setSyncError(error.message);
        }
    }, [user, updateSupabaseStats]);

    // Mettre à jour les stats localement et optionnellement sync
    const updateStats = useCallback((updates, syncToCloud = true) => {
        setUserStats(prev => {
            const newStats = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };

            // Vérifier le grade
            const currentGrade = grades.find(g => g.level === newStats.grade);
            const nextGrade = grades.find(g => g.level === newStats.grade + 1);

            if (nextGrade && newStats.ip >= nextGrade.ipRequired) {
                newStats.grade = nextGrade.level;
                newStats.gradeTitle = nextGrade.title;
            }

            // Sync avec Supabase si demandé et connecté
            if (syncToCloud && user) {
                // Debounce pour éviter trop d'appels API
                setTimeout(() => saveToSupabase(newStats), 1000);
            }

            return newStats;
        });
    }, [user, saveToSupabase]);

    // Actions spécifiques
    const addIP = useCallback((points, sync = true) => {
        updateStats(prev => ({ ...prev, ip: prev.ip + points }), sync);
    }, [updateStats]);

    const spendIP = useCallback((points) => {
        if (userStats.ip >= points) {
            updateStats(prev => ({ ...prev, ip: prev.ip - points }));
            return true;
        }
        return false;
    }, [userStats.ip, updateStats]);

    const recordArticleRead = useCallback((orientation) => {
        updateStats(prev => {
            const newOrientationCounts = {
                ...prev.orientationCounts,
                [orientation]: (prev.orientationCounts[orientation] || 0) + 1
            };

            const orientationsWithArticles = Object.keys(newOrientationCounts)
                .filter(o => newOrientationCounts[o] > 0);

            return {
                ...prev,
                readCount: prev.readCount + 1,
                readOrientations: [...new Set([...prev.readOrientations, orientation])],
                orientationCounts: newOrientationCounts,
                diversityScore: Math.min(100, Math.round((orientationsWithArticles.length / 7) * 100))
            };
        });
    }, [updateStats]);

    const purchaseBadge = useCallback((badgeId) => {
        updateStats(prev => ({
            ...prev,
            purchasedBadges: [...prev.purchasedBadges, badgeId]
        }));
    }, [updateStats]);

    const unlockAchievement = useCallback((achievementId) => {
        updateStats(prev => ({
            ...prev,
            unlockedSucces: [...prev.unlockedSucces, achievementId]
        }));
    }, [updateStats]);

    const unlockAccreditation = useCallback((accreditationId) => {
        updateStats(prev => ({
            ...prev,
            unlockedAccreditations: [...prev.unlockedAccreditations, accreditationId]
        }));
    }, [updateStats]);

    const addReferral = useCallback(() => {
        updateStats(prev => ({
            ...prev,
            referredMembers: prev.referredMembers + 1,
            ip: prev.ip + 200 // Bonus parrain
        }));
    }, [updateStats]);

    const updateStreak = useCallback(() => {
        const lastVisit = localStorage.getItem('lastVisit');
        const today = new Date().toDateString();

        if (lastVisit !== today) {
            localStorage.setItem('lastVisit', today);
            updateStats(prev => ({ ...prev, streak: prev.streak + 1 }));
        }
    }, [updateStats]);

    // Réinitialiser (pour les tests)
    const resetStats = useCallback(() => {
        const defaultStats = {
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
            referredMembers: 0,
            lastSync: null
        };

        setUserStats(defaultStats);
        localStorage.removeItem('lastVisit');
    }, []);

    return {
        // État
        userStats,
        isSyncing,
        syncError,

        // Actions
        updateStats,
        addIP,
        spendIP,
        recordArticleRead,
        purchaseBadge,
        unlockAchievement,
        unlockAccreditation,
        addReferral,
        updateStreak,
        syncWithSupabase,
        resetStats
    };
};

export default useUserStats;