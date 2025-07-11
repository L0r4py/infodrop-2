// src/components/ArticlesList.js
import React, { useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { ExternalLink, Clock, Tag, Filter } from 'lucide-react';

const ArticlesList = () => {
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrientation, setSelectedOrientation] = useState('Toutes');
    const [selectedTags, setSelectedTags] = useState([]);
    const [showFilters, setShowFilters] = useState(true);

    // Orientations disponibles
    const orientations = [
        'Toutes',
        'Extrême G.',
        'Gauche',
        'Centre G.',
        'Centre',
        'Centre D.',
        'Droite',
        'Extrême D.'
    ];

    // Mapping des orientations de la base vers l'affichage
    const orientationMapping = {
        'extrême-gauche': 'Extrême G.',
        'gauche': 'Gauche',
        'centre-gauche': 'Centre G.',
        'centre': 'Centre',
        'centre-droit': 'Centre D.',
        'droite': 'Droite',
        'extrême-droite': 'Extrême D.',
        'gouvernement': 'Centre',
        'neutre': 'Centre'
    };

    // Couleurs par orientation
    const orientationColors = {
        'Extrême G.': 'bg-red-800',
        'Gauche': 'bg-red-600',
        'Centre G.': 'bg-orange-600',
        'Centre': 'bg-gray-600',
        'Centre D.': 'bg-blue-600',
        'Droite': 'bg-blue-700',
        'Extrême D.': 'bg-indigo-800'
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [selectedOrientation, selectedTags, articles]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const { data, error } = await db.articles.getAll({ limit: 200 });

            if (error) throw error;

            // Trier par date de publication
            const sortedArticles = (data || []).sort((a, b) =>
                new Date(b.published_at) - new Date(a.published_at)
            );

            setArticles(sortedArticles);
            setFilteredArticles(sortedArticles);
        } catch (error) {
            console.error('Erreur récupération articles:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...articles];

        // Filtre par orientation
        if (selectedOrientation !== 'Toutes') {
            filtered = filtered.filter(article => {
                const mappedOrientation = orientationMapping[article.orientation] || article.orientation;
                return mappedOrientation === selectedOrientation;
            });
        }

        // Filtre par tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(article =>
                article.tags && selectedTags.some(tag => article.tags.includes(tag))
            );
        }

        setFilteredArticles(filtered);
    };

    // Extraire tous les tags uniques
    const allTags = [...new Set(articles.flatMap(article => article.tags || []))];

    // Formater la date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `il y a ${diffInMinutes} min`;
        } else if (diffInHours < 24) {
            return `il y a ${Math.floor(diffInHours)}h`;
        } else {
            return date.toLocaleDateString('fr-FR');
        }
    };

    // Calculer le score de diversité
    const calculateDiversityScore = () => {
        const orientationCounts = {};
        filteredArticles.forEach(article => {
            const mapped = orientationMapping[article.orientation] || article.orientation;
            orientationCounts[mapped] = (orientationCounts[mapped] || 0) + 1;
        });

        const uniqueOrientations = Object.keys(orientationCounts).length;
        const maxOrientations = 7; // Sans compter "Toutes"
        return Math.round((uniqueOrientations / maxOrientations) * 100);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-white">⏳ Chargement des articles...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4">
            {/* Score de diversité */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-green-400 mb-2">
                            🎯 Score de Diversité
                        </h2>
                        <p className="text-gray-400">
                            {filteredArticles.length} articles • {calculateDiversityScore()}% de diversité
                        </p>
                    </div>
                    <div className="text-6xl font-bold text-green-400">
                        {calculateDiversityScore()}%
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Filter size={20} />
                        Filtres
                    </h3>
                    <span className="text-gray-400">{showFilters ? '▼' : '▶'}</span>
                </div>

                {showFilters && (
                    <div className="mt-4 space-y-4">
                        {/* Orientations politiques */}
                        <div>
                            <h4 className="text-sm text-gray-400 mb-2">Orientations politiques</h4>
                            <div className="flex flex-wrap gap-2">
                                {orientations.map(orientation => (
                                    <button
                                        key={orientation}
                                        onClick={() => setSelectedOrientation(orientation)}
                                        className={`px-4 py-2 rounded-lg transition-all ${selectedOrientation === orientation
                                                ? orientationColors[orientation] || 'bg-gray-600'
                                                : 'bg-gray-700 hover:bg-gray-600'
                                            } text-white`}
                                    >
                                        {orientation}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <h4 className="text-sm text-gray-400 mb-2">Tags populaires</h4>
                            <div className="flex flex-wrap gap-2">
                                {allTags.slice(0, 10).map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            setSelectedTags(prev =>
                                                prev.includes(tag)
                                                    ? prev.filter(t => t !== tag)
                                                    : [...prev, tag]
                                            );
                                        }}
                                        className={`px-3 py-1 rounded-full text-sm transition-all ${selectedTags.includes(tag)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Liste des articles */}
            <div className="space-y-4">
                {filteredArticles.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
                        Aucun article ne correspond aux filtres sélectionnés.
                    </div>
                ) : (
                    filteredArticles.map((article) => (
                        <div
                            key={article.id}
                            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-all cursor-pointer"
                            onClick={() => window.open(article.url, '_blank')}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-400">
                                        {article.source_name}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs text-white ${orientationColors[orientationMapping[article.orientation]] || 'bg-gray-600'
                                        }`}>
                                        {orientationMapping[article.orientation] || article.orientation}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDate(article.published_at)}
                                </span>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400">
                                {article.title}
                            </h3>

                            {article.summary && (
                                <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                                    {article.summary}
                                </p>
                            )}

                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    {article.tags?.slice(0, 3).map((tag, index) => (
                                        <span
                                            key={index}
                                            className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                                <ExternalLink size={16} className="text-gray-500" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bouton charger plus */}
            {filteredArticles.length > 0 && filteredArticles.length < articles.length && (
                <div className="text-center mt-8">
                    <button
                        onClick={fetchArticles}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                        Rafraîchir les articles
                    </button>
                </div>
            )}
        </div>
    );
};

export default ArticlesList;