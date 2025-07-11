// src/components/news/NewsFilters.js

import React, { useState } from 'react';
import { FileSearch, ChevronDown, ChevronUp } from 'lucide-react';

// Couleurs des orientations politiques (adaptées au français)
const POLITICAL_COLORS = {
    'extrême-gauche': '#dc3545',
    'gauche': '#e74c3c',
    'centre-gauche': '#ec7063',
    'centre': '#6c757d',
    'centre-droit': '#5dade2',
    'droite': '#3498db',
    'extrême-droite': '#2980b9',
    'gouvernement': '#9b59b6',
    'neutre': '#95a5a6'
};

// Composant de filtres pliable avec orientations politiques
const NewsFilters = ({
    darkMode,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    allTags,
    clearTags
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Labels des orientations (français)
    const orientationLabels = {
        'all': 'Toutes',
        'extrême-gauche': 'Extrême G.',
        'gauche': 'Gauche',
        'centre-gauche': 'Centre G.',
        'centre': 'Centre',
        'centre-droit': 'Centre D.',
        'droite': 'Droite',
        'extrême-droite': 'Extrême D.',
        'gouvernement': 'Gouvernement',
        'neutre': 'Neutre'
    };

    // Ordre d'affichage des orientations (avec tirets pour correspondre à la base)
    const orientationOrder = ['all', 'extrême-gauche', 'gauche', 'centre-gauche', 'centre', 'centre-droit', 'droite', 'extrême-droite'];

    return (
        <div
            className={`mb-6 rounded-xl transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'
                } border ${darkMode ? 'border-slate-700' : 'border-gray-200'
                } shadow-lg ${isHovered ? 'transform scale-[1.01] shadow-xl' : ''
                }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header toujours visible */}
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''
                            }`}>
                            <FileSearch className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Filtres</h3>
                            {!isExpanded && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {orientationLabels[selectedCategory] || selectedCategory}
                                    {selectedTags.length > 0 && ` • ${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''}`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* État actuel et bouton */}
                    <div className="flex items-center gap-3">
                        {!isExpanded && selectedCategory !== 'all' && (
                            <span
                                className="px-3 py-1 text-sm font-medium rounded-lg text-white"
                                style={{ backgroundColor: POLITICAL_COLORS[selectedCategory] || '#6c757d' }}
                            >
                                {orientationLabels[selectedCategory] || selectedCategory}
                            </span>
                        )}
                        {!isExpanded && selectedTags.length > 0 && (
                            <span className="px-3 py-1 text-sm font-medium rounded-lg bg-blue-600 text-white">
                                {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''}
                            </span>
                        )}
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
            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                {isExpanded && (
                    <div className="px-4 pb-4">
                        {/* Orientations politiques */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Orientations politiques</p>
                            <div className="flex flex-wrap gap-2">
                                {orientationOrder.map(orientation => (
                                    <button
                                        key={orientation}
                                        onClick={() => setSelectedCategory(orientation)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === orientation
                                            ? 'text-white shadow-md transform scale-105'
                                            : darkMode
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        style={selectedCategory === orientation ? {
                                            backgroundColor: orientation === 'all' ? '#3b82f6' : (POLITICAL_COLORS[orientation] || '#6c757d')
                                        } : {}}
                                    >
                                        {orientationLabels[orientation]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        {allTags.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Tags populaires</p>
                                    {selectedTags.length > 0 && (
                                        <button
                                            onClick={clearTags}
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            Effacer les tags ({selectedTags.length})
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1 text-sm rounded-full transition-all ${selectedTags.includes(tag)
                                                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                                : darkMode
                                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsFilters;