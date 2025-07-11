// src/components/stats/DiversityScore.js

import React, { useState } from 'react';
import { Target } from 'lucide-react';

// Couleurs des orientations politiques
const POLITICAL_COLORS = {
    'extreme-left': '#dc3545',
    'left': '#e74c3c',
    'center-left': '#ec7063',
    'center': '#6c757d',
    'center-right': '#5dade2',
    'right': '#3498db',
    'extreme-right': '#2980b9'
};

// Section Score de Diversité
const DiversityScore = ({ darkMode, score, articlesRead, orientationCounts = {} }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getMotivation = () => {
        if (score < 20) return { emoji: "🔴", text: "Commencez à explorer !", advice: "Lisez des sources variées pour débloquer votre potentiel", color: "text-red-500" };
        if (score < 40) return { emoji: "🟡", text: "Bon début !", advice: "Continuez à diversifier vos perspectives", color: "text-yellow-500" };
        if (score < 60) return { emoji: "🟠", text: "Vous progressez bien !", advice: "Explorez des opinions différentes", color: "text-orange-500" };
        if (score < 80) return { emoji: "🟢", text: "Excellente diversité !", advice: "Vous êtes sur la bonne voie", color: "text-green-500" };
        return { emoji: "⭐", text: "Maître de la diversité !", advice: "Votre vision est parfaitement équilibrée", color: "text-purple-500" };
    };

    const motivation = getMotivation();

    // Ordre des orientations pour l'affichage
    const orientationOrder = ['extreme-left', 'left', 'center-left', 'center', 'center-right', 'right', 'extreme-right'];
    const orientationLabels = {
        'extreme-left': 'Extrême G.',
        'left': 'Gauche',
        'center-left': 'Centre G.',
        'center': 'Centre',
        'center-right': 'Centre D.',
        'right': 'Droite',
        'extreme-right': 'Extrême D.'
    };

    // Calculer la hauteur de remplissage pour chaque orientation
    const getSegmentHeight = (orientation) => {
        const count = (orientationCounts && orientationCounts[orientation]) || 0;
        if (count === 0) return 0;
        // Minimum 20% si au moins 1 article, puis augmentation proportionnelle
        return Math.min(100, 20 + (count * 10));
    };

    return (
        <div
            className={`relative overflow-hidden rounded-xl ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                } p-6 mb-6 border ${darkMode ? 'border-slate-700' : 'border-gray-200'} shadow-lg transition-all duration-300 ${isHovered ? 'transform scale-[1.02] shadow-2xl' : ''
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl transition-all duration-300 ${isHovered ? 'scale-150' : ''
                }`} />
            <div className={`absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-2xl transition-all duration-300 ${isHovered ? 'scale-150' : ''
                }`} />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <div className={`p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''
                                }`}>
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            Score de Diversité
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {articlesRead} articles lus • 7 orientations politiques
                        </p>
                    </div>

                    <div className="text-right">
                        <div className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                            {score}%
                        </div>
                        <div className={`text-sm font-semibold ${motivation.color} mt-1`}>
                            {motivation.emoji} {motivation.text}
                        </div>
                    </div>
                </div>

                {/* Progress Bar - Nouveau système par segments */}
                <div className="mb-4">
                    <div className="relative h-20 bg-gray-200 dark:bg-slate-700 rounded-xl overflow-hidden flex">
                        {/* Segments individuels */}
                        {orientationOrder.map((orientation, index) => {
                            const fillHeight = getSegmentHeight(orientation);
                            const count = (orientationCounts && orientationCounts[orientation]) || 0;

                            return (
                                <div key={orientation} className="flex-1 relative group">
                                    {/* Fond du segment */}
                                    <div className="absolute inset-0 bg-gray-300 dark:bg-slate-600 border-r border-gray-400 dark:border-slate-500 last:border-r-0" />

                                    {/* Remplissage du segment */}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
                                        style={{
                                            height: `${fillHeight}%`,
                                            background: `linear-gradient(to top, ${POLITICAL_COLORS[orientation]}, ${POLITICAL_COLORS[orientation]}dd)`
                                        }}
                                    >
                                        {/* Effet de brillance */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Tooltip au survol */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                            {count} article{count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Labels */}
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {orientationOrder.map((orientation) => (
                            <span key={orientation} className="flex-1 text-center">
                                {orientationLabels[orientation]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Advice */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'
                    } backdrop-blur-sm transition-all duration-300 ${isHovered ? 'bg-opacity-80' : ''
                    }`}>
                    <p className="text-sm flex items-center gap-2">
                        <span className="text-lg animate-pulse">💡</span>
                        <span className="text-gray-600 dark:text-gray-300">{motivation.advice}</span>
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className={`text-center p-3 rounded-lg transition-all duration-300 ${darkMode ? 'bg-slate-800' : 'bg-white'
                        } ${isHovered ? 'transform scale-105' : ''}`}>
                        <div className="text-lg font-bold text-blue-500">{Object.keys(orientationCounts || {}).length}/7</div>
                        <div className="text-xs text-gray-500">Orientations</div>
                    </div>
                    <div className={`text-center p-3 rounded-lg transition-all duration-300 ${darkMode ? 'bg-slate-800' : 'bg-white'
                        } ${isHovered ? 'transform scale-105' : ''}`}>
                        <div className="text-lg font-bold text-purple-500">{articlesRead}</div>
                        <div className="text-xs text-gray-500">Articles lus</div>
                    </div>
                    <div className={`text-center p-3 rounded-lg transition-all duration-300 ${darkMode ? 'bg-slate-800' : 'bg-white'
                        } ${isHovered ? 'transform scale-105' : ''}`}>
                        <div className="text-lg font-bold text-emerald-500">+{Math.floor(score / 20)}</div>
                        <div className="text-xs text-gray-500">Bonus IP/j</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiversityScore;