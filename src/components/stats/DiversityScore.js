// src/components/stats/DiversityScore.js

import React, { useState } from 'react';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';

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

// Section Score de Diversité pliable
const DiversityScore = ({ darkMode, score, articlesRead, orientationCounts = {} }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // État plié/déplié

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
                } p-6 mb-6 border ${darkMode ? 'border-slate-700' : 'border-gray-200'
                } shadow-lg transition-all duration-300 ${isHovered ? 'transform scale-[1.02] shadow-2xl' : ''
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Background decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-full blur-3xl transition-all duration-300 ${isHovered ? 'scale-150' : ''
                }`} />

            {/* Header compact toujours visible */}
            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <div className={`p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''
                                }`}>
                                <Target className="w-5 h-5 text-white" />
                            </div>
                            Score de Diversité
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {articlesRead} articles lus • {Math.min(7, Object.keys(orientationCounts || {}).filter(o => orientationCounts[o] > 0).length)}/7 orientations {isExpanded ? 'explorées' : 'politiques'}
                        </p>
                    </div>

                    <div className="text-right flex items-start gap-2">
                        <div>
                            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
                                {score}%
                            </div>
                            <div className={`text-sm font-semibold ${motivation.color} mt-1`}>
                                {motivation.emoji} {motivation.text}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={`p-1 rounded-lg transition-all duration-300 ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'
                                }`}
                        >
                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Contenu dépliable */}
            <div className={`relative z-10 transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                {isExpanded && (
                    <>
                        {/* Barre de progression complète */}
                        <div className="mb-6">
                            <div className="relative h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex">
                                {orientationOrder.map((orientation, index) => {
                                    const segmentHeight = getSegmentHeight(orientation);
                                    const isActive = segmentHeight > 0;

                                    return (
                                        <div
                                            key={orientation}
                                            className="flex-1 relative group transition-all duration-300"
                                            style={{
                                                borderRight: index < orientationOrder.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                            }}
                                        >
                                            {/* Segment rempli */}
                                            <div
                                                className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-30'
                                                    }`}
                                                style={{
                                                    height: `${segmentHeight}%`,
                                                    backgroundColor: POLITICAL_COLORS[orientation],
                                                    boxShadow: isActive ? `0 0 20px ${POLITICAL_COLORS[orientation]}40` : 'none'
                                                }}
                                            />

                                            {/* Label */}
                                            <div className={`absolute bottom-0 left-0 right-0 flex items-end justify-center pb-1 ${isActive ? 'text-white font-semibold' : 'text-gray-500 dark:text-gray-400'
                                                }`}>
                                                <span className="text-[10px] transform rotate-0">
                                                    {orientationLabels[orientation]}
                                                </span>
                                            </div>

                                            {/* Tooltip au survol */}
                                            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20`}>
                                                {orientationCounts[orientation] || 0} articles
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Indicateur de progression */}
                            <div className="mt-3 text-center">
                                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-slate-700/50' : 'bg-gray-100'
                                    } backdrop-blur-sm`}>
                                    <span className="text-lg animate-pulse">💡</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{motivation.advice}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats détaillées */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className={`text-center p-3 rounded-lg transition-all duration-300 ${darkMode ? 'bg-slate-800' : 'bg-white'
                                } ${isHovered ? 'transform scale-105' : ''}`}>
                                <div className="text-lg font-bold text-blue-500">{Math.min(7, Object.keys(orientationCounts || {}).filter(o => orientationCounts[o] > 0).length)}/7</div>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default DiversityScore;