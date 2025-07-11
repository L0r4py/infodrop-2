// src/components/news/NewsFilters.js

import React from 'react';
import { FileSearch } from 'lucide-react';

// Composant de filtres
const NewsFilters = ({
    darkMode,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    allTags,
    clearTags
}) => {
    return (
        <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'} shadow-sm`}>
            <h3 className="font-bold mb-3 flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-blue-500" />
                Filtres
            </h3>

            {/* Catégories */}
            <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Catégories</p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === 'all'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Toutes
                    </button>
                    <button
                        onClick={() => setSelectedCategory('politique')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === 'politique'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Politique
                    </button>
                    <button
                        onClick={() => setSelectedCategory('économie')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === 'économie'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Économie
                    </button>
                    <button
                        onClick={() => setSelectedCategory('tech')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === 'tech'
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Tech
                    </button>
                    <button
                        onClick={() => setSelectedCategory('société')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === 'société'
                                ? 'bg-amber-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Société
                    </button>
                    <button
                        onClick={() => setSelectedCategory('environnement')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === 'environnement'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        Environnement
                    </button>
                </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
                <div>
                    <p className="text-sm text-gray-500 mb-2">Tags populaires</p>
                    <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 text-sm rounded-full transition-all ${selectedTags.includes(tag)
                                        ? 'bg-blue-600 text-white shadow-md transform scale-105'
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                    }`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                    {selectedTags.length > 0 && (
                        <button
                            onClick={clearTags}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                        >
                            Effacer les tags
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default NewsFilters;