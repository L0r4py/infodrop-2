// src/hooks/useNews.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { mockNews } from '../data/mockNews';

// Hook personnalisé pour gérer les actualités
export const useNews = () => {
    const [news, setNews] = useState(mockNews);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Charger les actualités (simulation pour le moment)
    const loadNews = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Simuler un appel API
            await new Promise(resolve => setTimeout(resolve, 500));

            // Pour le moment, on utilise les données mock
            // Plus tard, ici on appellera Supabase
            setNews(mockNews);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Charger les news au montage
    useEffect(() => {
        loadNews();
    }, [loadNews]);

    // Ajouter une actualité
    const addNews = useCallback((newArticle) => {
        const article = {
            ...newArticle,
            id: Date.now(),
            timestamp: Date.now(),
            views: 0
        };

        setNews(prev => [article, ...prev]);
        return article;
    }, []);

    // Mettre à jour une actualité
    const updateNews = useCallback((id, updates) => {
        setNews(prev =>
            prev.map(item =>
                item.id === id ? { ...item, ...updates } : item
            )
        );
    }, []);

    // Supprimer une actualité
    const deleteNews = useCallback((id) => {
        setNews(prev => prev.filter(item => item.id !== id));
    }, []);

    // Marquer une actualité comme lue
    const markAsRead = useCallback((id) => {
        setNews(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, views: item.views + 1 }
                    : item
            )
        );
    }, []);

    // Obtenir tous les tags uniques
    const allTags = useMemo(() => {
        const tags = new Set();
        news.forEach(item => {
            item.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags);
    }, [news]);

    // Filtrer les news
    const filteredNews = useMemo(() => {
        let filtered = news;

        // Filtrer par catégorie
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        // Filtrer par tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(item =>
                item.tags?.some(tag => selectedTags.includes(tag))
            );
        }

        // Trier par date (plus récent en premier)
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        return filtered;
    }, [news, selectedCategory, selectedTags]);

    // Basculer un tag
    const toggleTag = useCallback((tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    }, []);

    // Effacer tous les tags sélectionnés
    const clearTags = useCallback(() => {
        setSelectedTags([]);
    }, []);

    // Obtenir les statistiques des news
    const getNewsStats = useCallback(() => {
        const stats = {
            total: news.length,
            byCategory: {},
            byOrientation: {},
            last24h: 0
        };

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        news.forEach(item => {
            // Par catégorie
            stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;

            // Par orientation
            stats.byOrientation[item.orientation] = (stats.byOrientation[item.orientation] || 0) + 1;

            // Dernières 24h
            if (item.timestamp > oneDayAgo) {
                stats.last24h++;
            }
        });

        return stats;
    }, [news]);

    // Rechercher dans les actualités
    const searchNews = useCallback((query) => {
        if (!query) return news;

        const lowerQuery = query.toLowerCase();
        return news.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.source.toLowerCase().includes(lowerQuery) ||
            item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }, [news]);

    return {
        // État
        news,
        filteredNews,
        selectedCategory,
        selectedTags,
        allTags,
        isLoading,
        error,

        // Actions
        loadNews,
        addNews,
        updateNews,
        deleteNews,
        markAsRead,
        setSelectedCategory,
        toggleTag,
        clearTags,
        searchNews,
        getNewsStats
    };
};

export default useNews;