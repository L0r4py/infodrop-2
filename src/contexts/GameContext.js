// ========================================================================
// Fichier COMPLET et AMÉLIORÉ : src/contexts/GameContext.js
// Logique de mise à jour des statistiques ajoutée.
// ========================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { grades } from '../data/rewards';

const GameContext = createContext();

const initialStats = {
    xp: 0,
    level: 1,
    grade: 1,
    gradeTitle: 'Débutant',
    readCount: 0,
    diversityScore: 0,
    badges: [],
    orientationCounts: {},
};

export const GameProvider = ({ children }) => {
    const { user } = useAuth();
    const [userStats, setUserStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);

    const [showXPAnimation, setShowXPAnimation] = useState(false);
    const [xpAnimationPoints, setXpAnimationPoints] = useState(0);
    const [gradeUpAnimation, setGradeUpAnimation] = useState(false);

    const fetchUserStats = useCallback(async (userId) => {
        if (!userId) {
            setUserStats(initialStats);
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

            if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
                throw error;
            }

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
            } else {
                // Si aucun profil n'existe pour cet utilisateur, on initialise avec les valeurs par défaut
                setUserStats(initialStats);
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des stats utilisateur:", error);
            setUserStats(initialStats);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserStats(user?.id);
    }, [user, fetchUserStats]);

    // **AMÉLIORATION MAJEURE ICI**
    const handleReadNews = useCallback(async (article) => {
        if (!user || !article) return; // Sécurité

        const pointsGagnes = 5;

        // 1. Mettre à jour l'état local pour une réactivité instantanée
        setUserStats(prevStats => {
            // Met à jour le compteur pour l'orientation de l'article lu
            const newOrientationCounts = { ...prevStats.orientationCounts };
            const orientation = article.orientation || 'neutre';
            newOrientationCounts[orientation] = (newOrientationCounts[orientation] || 0) + 1;

            // Met à jour le score de diversité
            const uniqueOrientationsLues = Object.values(newOrientationCounts).filter(c => c > 0).length;
            const newDiversityScore = Math.round((uniqueOrientationsLues / 7) * 100);

            // Retourne le nouvel objet de statistiques
            return {
                ...prevStats,
                readCount: prevStats.readCount + 1,
                xp: prevStats.xp + pointsGagnes,
                orientationCounts: newOrientationCounts,
                diversityScore: newDiversityScore,
            };
        });

        // 2. Déclencher l'animation
        setXpAnimationPoints(pointsGagnes);
        setShowXPAnimation(true);
        setTimeout(() => setShowXPAnimation(false), 3000);

        // 3. Mettre à jour la base de données en arrière-plan
        // On utilise les nouvelles valeurs calculées pour les envoyer à Supabase
        const { data: updatedStats } = await supabase.rpc('update_user_stats_on_read', {
            user_id: user.id,
            xp_gain: pointsGagnes,
            read_article_orientation: article.orientation || 'neutre'
        });

        console.log("Stats mises à jour dans la base de données.");

    }, [user]); // Dépend de `user` pour connaître l'ID

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

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame doit être utilisé dans un GameProvider');
    }
    return context;
};