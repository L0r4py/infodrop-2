// ========================================================================
// Fichier COMPLET et ROBUSTE : src/contexts/GameContext.js
// Ce code garantit que `userStats` n'est jamais `undefined`.
// ========================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { grades } from '../data/rewards';

const GameContext = createContext();

// On définit un état initial pour les stats. C'est la clé de la solution.
// L'objet a la même "forme" que les vraies données, mais avec des valeurs par défaut.
const initialStats = {
    xp: 0,
    level: 1,
    grade: 1,
    gradeTitle: 'Débutant',
    readCount: 0,
    diversityScore: 0,
    badges: [],
    orientationCounts: {}, // Important : commence comme un objet vide
};

export const GameProvider = ({ children }) => {
    const { user } = useAuth();
    // On utilise l'état initial pour que userStats ne soit JAMAIS undefined.
    const [userStats, setUserStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);

    // Animations (on peut les laisser ici)
    const [showXPAnimation, setShowXPAnimation] = useState(false);
    const [xpAnimationPoints, setXpAnimationPoints] = useState(0);
    const [gradeUpAnimation, setGradeUpAnimation] = useState(false);

    // Fonction pour récupérer les stats de l'utilisateur
    const fetchUserStats = useCallback(async (userId) => {
        if (!userId) {
            setUserStats(initialStats); // Si pas d'utilisateur, on remet les stats à zéro
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('xp, level, grade, read_count, diversity_score, badges, orientation_counts')
                .eq('id', userId)
                .single();

            if (error) throw error;

            if (data) {
                setUserStats({
                    xp: data.xp || 0,
                    level: data.level || 1,
                    grade: data.grade || 1,
                    gradeTitle: grades[data.grade - 1]?.title || 'Débutant',
                    readCount: data.read_count || 0,
                    diversityScore: data.diversity_score || 0,
                    badges: data.badges || [],
                    orientationCounts: data.orientation_counts || {},
                });
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des stats utilisateur:", error);
            setUserStats(initialStats); // En cas d'erreur, on repart d'un état stable
        } finally {
            setLoading(false);
        }
    }, []);

    // On lance la récupération des stats quand l'utilisateur est connu
    useEffect(() => {
        fetchUserStats(user?.id);
    }, [user, fetchUserStats]);

    // Logique pour gérer la lecture d'un article
    const handleReadNews = useCallback(async (article) => {
        // La logique de gain d'XP, mise à jour des stats, etc. irait ici.
        // Pour l'instant, on simule un gain d'XP pour l'animation.
        setXpAnimationPoints(5); // 5 points par article lu
        setShowXPAnimation(true);
        setTimeout(() => setShowXPAnimation(false), 3000); // Cacher l'animation après 3s

        // Mettre à jour les stats en base de données
        // (Cette partie est à implémenter plus en détail)
    }, []);

    // Logique pour acheter un badge
    const purchaseBadge = () => {
        console.log("Logique d'achat de badge à implémenter");
    };

    const value = {
        userStats,
        loading,
        handleReadNews,
        purchaseBadge,
        showXPAnimation,
        xpAnimationPoints,
        gradeUpAnimation,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Hook pour utiliser le contexte
export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame doit être utilisé dans un GameProvider');
    }
    return context;
};