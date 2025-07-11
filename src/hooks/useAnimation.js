// src/hooks/useAnimation.js

import { useState, useEffect, useCallback } from 'react';

// Hook principal pour gérer les animations
export const useAnimation = () => {
    const [showXPAnimation, setShowXPAnimation] = useState(false);
    const [xpAnimationPoints, setXPAnimationPoints] = useState(0);
    const [showGradeUpAnimation, setShowGradeUpAnimation] = useState(false);
    const [gradeUpData, setGradeUpData] = useState(null);

    // Vérifier les animations en attente au chargement
    useEffect(() => {
        const pendingAnimation = localStorage.getItem('pendingAnimation');
        if (pendingAnimation) {
            const animation = JSON.parse(pendingAnimation);

            // Vérifier que l'animation n'est pas trop vieille (30 secondes)
            if (Date.now() - animation.timestamp < 30000) {
                if (animation.type === 'xp') {
                    triggerXPAnimation(animation.points);
                } else if (animation.type === 'gradeUp' && animation.data) {
                    triggerGradeUpAnimation(animation.data);
                }
            }

            localStorage.removeItem('pendingAnimation');
        }
    }, []);

    // Déclencher l'animation XP
    const triggerXPAnimation = useCallback((points) => {
        setXPAnimationPoints(points);
        setShowXPAnimation(true);

        setTimeout(() => {
            setShowXPAnimation(false);
        }, 3000);
    }, []);

    // Déclencher l'animation de grade up
    const triggerGradeUpAnimation = useCallback((data) => {
        setGradeUpData(data);
        setShowGradeUpAnimation(true);

        setTimeout(() => {
            setShowGradeUpAnimation(false);
            setGradeUpData(null);
        }, 4000);
    }, []);

    // Sauvegarder une animation XP en attente
    const saveXPAnimation = useCallback((points) => {
        localStorage.setItem('pendingAnimation', JSON.stringify({
            type: 'xp',
            points,
            timestamp: Date.now()
        }));
    }, []);

    // Sauvegarder une animation de grade up en attente
    const saveGradeUpAnimation = useCallback((oldGrade, newGrade, newLevel) => {
        localStorage.setItem('pendingAnimation', JSON.stringify({
            type: 'gradeUp',
            data: { oldGrade, newGrade, newLevel },
            timestamp: Date.now()
        }));
    }, []);

    return {
        // États
        showXPAnimation,
        xpAnimationPoints,
        showGradeUpAnimation,
        gradeUpData,

        // Actions
        triggerXPAnimation,
        triggerGradeUpAnimation,
        saveXPAnimation,
        saveGradeUpAnimation
    };
};

// Hook dédié pour l'animation XP
export const useXPAnimation = () => {
    const [show, setShow] = useState(false);
    const [points, setPoints] = useState(0);

    const trigger = useCallback((pointsToShow) => {
        setPoints(pointsToShow);
        setShow(true);

        setTimeout(() => {
            setShow(false);
        }, 3000);
    }, []);

    return { show, points, trigger };
};

// Hook dédié pour l'animation de grade up
export const useGradeUpAnimation = () => {
    const [show, setShow] = useState(false);
    const [data, setData] = useState(null);

    const trigger = useCallback((gradeData) => {
        setData(gradeData);
        setShow(true);

        setTimeout(() => {
            setShow(false);
            setData(null);
        }, 4000);
    }, []);

    return { show, data, trigger };
};

// Export par défaut
export default useAnimation;