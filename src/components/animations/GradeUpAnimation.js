// src/components/animations/GradeUpAnimation.js

import React from 'react';
import { Trophy, Star, Zap, Crown, Shield, Brain, Target, Award } from 'lucide-react';

const GradeUpAnimation = ({ show, oldGrade, newGrade, newLevel }) => {
    if (!show) return null;

    // Choisir l'icône selon le niveau
    const getGradeIcon = (level) => {
        switch (level) {
            case 1:
            case 2:
                return <Shield className="w-16 h-16" />;
            case 3:
            case 4:
                return <Brain className="w-16 h-16" />;
            case 5:
            case 6:
                return <Target className="w-16 h-16" />;
            case 7:
            case 8:
                return <Award className="w-16 h-16" />;
            case 9:
            case 10:
                return <Crown className="w-16 h-16" />;
            default:
                return <Trophy className="w-16 h-16" />;
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            {/* Overlay avec effet de flou */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto animate-fade-in" />

            {/* Container principal de l'animation */}
            <div className="relative animate-bounce-in">
                {/* Effet de particules/étoiles */}
                <div className="absolute inset-0 -inset-x-20 -inset-y-20">
                    {[...Array(8)].map((_, i) => (
                        <Star
                            key={i}
                            className={`absolute w-6 h-6 text-yellow-400 animate-sparkle`}
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${i * 0.1}s`
                            }}
                        />
                    ))}
                </div>

                {/* Carte principale */}
                <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 text-white px-12 py-10 rounded-2xl shadow-2xl transform transition-all">
                    {/* Effet de brillance */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-2xl" />

                    {/* Contenu */}
                    <div className="relative text-center">
                        {/* Icône animée */}
                        <div className="mb-6 text-white animate-pulse">
                            {getGradeIcon(newLevel)}
                        </div>

                        {/* Titre */}
                        <h2 className="text-4xl font-bold mb-3 animate-slide-up">
                            NIVEAU SUPÉRIEUR !
                        </h2>

                        {/* Ancien grade */}
                        {oldGrade && (
                            <p className="text-emerald-200 text-lg mb-2 animate-slide-up animation-delay-100">
                                {oldGrade}
                            </p>
                        )}

                        {/* Flèche */}
                        <div className="text-3xl mb-2 animate-pulse">
                            ↓
                        </div>

                        {/* Nouveau grade */}
                        <p className="text-3xl font-bold animate-slide-up animation-delay-200 text-yellow-300">
                            {newGrade}
                        </p>

                        {/* Niveau */}
                        <p className="text-xl mt-4 animate-slide-up animation-delay-300 text-emerald-100">
                            Grade {newLevel}
                        </p>

                        {/* Message de félicitations */}
                        <p className="text-sm mt-6 text-emerald-200 animate-fade-in animation-delay-400">
                            Continuez votre progression vers la maîtrise de l'information !
                        </p>
                    </div>

                    {/* Effet de particules Zap autour */}
                    <Zap className="absolute -top-4 -right-4 w-8 h-8 text-yellow-400 animate-pulse" />
                    <Zap className="absolute -bottom-4 -left-4 w-8 h-8 text-yellow-400 animate-pulse animation-delay-200" />
                </div>
            </div>
        </div>
    );
};

export default GradeUpAnimation;