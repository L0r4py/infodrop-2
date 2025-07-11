// src/hooks/useNews.js
// Hook pour gérer les actualités avec Supabase

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const useNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: 'all',
        orientation: null,
        tags: [],
        limit: 200
    });

    // Fonction pour récupérer les articles
    const fetchArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Construire la requête
            let query = supabase
                .from('articles')
                .select('*')
                .order('published_at', { ascending: false });

            // Appliquer les filtres
            if (filters.category && filters.category !== 'all') {
                // Mapper les catégories aux tags
                const categoryTags = {
                    'politics': ['politique'],
                    'economy': ['économie', 'finance'],
                    'society': ['société', 'social'],
                    'international': ['international', 'monde'],
                    'culture': ['culture'],
                    'tech': ['tech', 'technologie', 'sciences'],
                    'sport': ['sport']
                };

                const tags = categoryTags[filters.category];
                if (tags) {
                    query = query.contains('tags', tags);
                }
            }

            if (filters.orientation) {
                query = query.eq('orientation', filters.orientation);
            }

            if (filters.tags && filters.tags.length > 0) {
                query = query.contains('tags', filters.tags);
            }

            // Limiter le nombre de résultats
            query = query.limit(filters.limit || 200);

            // Exécuter la requête
            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            // Transformer les données pour correspondre au format attendu
            const transformedData = (data || []).map(article => ({
                id: article.id,
                title: article.title,
                summary: article.summary || article.title,
                url: article.url,
                source: article.source_name,
                sourceId: article.source_id,
                publishedAt: article.published_at,
                timestamp: new Date(article.published_at).getTime(),
                image: article.image_url,
                orientation: article.orientation || 'neutre',
                tags: article.tags || [],
                category: mapTagsToCategory(article.tags || []),
                isRead: false // Géré côté client
            }));

            setNews(transformedData);

            console.log(`✅ ${transformedData.length} articles chargés`);

        } catch (err) {
            console.error('❌ Erreur récupération articles:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Mapper les tags vers une catégorie principale
    const mapTagsToCategory = (tags) => {
        if (tags.includes('politique')) return 'politics';
        if (tags.includes('économie') || tags.includes('finance')) return 'economy';
        if (tags.includes('société') || tags.includes('social')) return 'society';
        if (tags.includes('international') || tags.includes('monde')) return 'international';
        if (tags.includes('culture')) return 'culture';
        if (tags.includes('tech') || tags.includes('technologie') || tags.includes('sciences')) return 'tech';
        if (tags.includes('sport')) return 'sport';
        return 'general';
    };

    // Charger les articles au montage et quand les filtres changent
    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    // S'abonner aux changements en temps réel
    useEffect(() => {
        // Créer un canal pour les mises à jour en temps réel
        const channel = supabase
            .channel('articles-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'articles'
                },
                (payload) => {
                    console.log('📨 Nouvel article reçu:', payload.new.title);

                    // Ajouter le nouvel article en début de liste
                    const newArticle = {
                        id: payload.new.id,
                        title: payload.new.title,
                        summary: payload.new.summary || payload.new.title,
                        url: payload.new.url,
                        source: payload.new.source_name,
                        sourceId: payload.new.source_id,
                        publishedAt: payload.new.published_at,
                        timestamp: new Date(payload.new.published_at).getTime(),
                        image: payload.new.image_url,
                        orientation: payload.new.orientation || 'neutre',
                        tags: payload.new.tags || [],
                        category: mapTagsToCategory(payload.new.tags || []),
                        isRead: false
                    };

                    setNews(prev => [newArticle, ...prev]);
                }
            )
            .subscribe();

        // Nettoyer l'abonnement
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Fonction pour rafraîchir manuellement
    const refresh = useCallback(async () => {
        await fetchArticles();
    }, [fetchArticles]);

    // Fonction pour mettre à jour les filtres
    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    // Fonction pour marquer un article comme lu
    const markAsRead = useCallback((articleId) => {
        setNews(prev =>
            prev.map(item =>
                item.id === articleId
                    ? { ...item, isRead: true }
                    : item
            )
        );
    }, []);

    // Fonction pour obtenir les statistiques
    const getStats = useCallback(() => {
        const total = news.length;
        const byOrientation = news.reduce((acc, item) => {
            acc[item.orientation] = (acc[item.orientation] || 0) + 1;
            return acc;
        }, {});

        const byCategory = news.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {});

        const bySource = news.reduce((acc, item) => {
            acc[item.source] = (acc[item.source] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            byOrientation,
            byCategory,
            bySource
        };
    }, [news]);

    return {
        news,
        loading,
        error,
        filters,
        updateFilters,
        refresh,
        markAsRead,
        getStats
    };
};

export default useNews;