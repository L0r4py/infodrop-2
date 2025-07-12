// ========================================================================
// Fichier COMPLET et DÉFINITIF : src/hooks/useNews.js
// Ce code remplace l'intégralité de votre fichier.
// Il ne contient QUE les imports nécessaires avec les bons chemins.
// ========================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
// CORRECTION : Le chemin est maintenant '../lib/supabase' pour remonter du dossier 'hooks'
import { supabase } from '../lib/supabase';

// On utilise un "export nommé" pour être cohérent avec App.js
export const useNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: 'all',
        orientation: null,
        tags: [],
        limit: 500
    });

    const lastFetchTime = useRef(null);

    const transformArticle = (article) => ({
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
        isRead: false
    });

    const mapTagsToCategory = (tags) => {
        if (!tags) return 'general';
        if (tags.includes('politique')) return 'politics';
        if (tags.includes('économie') || tags.includes('finance')) return 'economy';
        if (tags.includes('société') || tags.includes('social')) return 'society';
        if (tags.includes('international') || tags.includes('monde')) return 'international';
        if (tags.includes('culture')) return 'culture';
        if (tags.includes('tech') || tags.includes('technologie') || tags.includes('sciences')) return 'tech';
        if (tags.includes('sport')) return 'sport';
        return 'general';
    };

    const loadInitialArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const twoHoursAgo = new Date();
            twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

            let query = supabase
                .from('articles')
                .select('*')
                .gte('published_at', twoHoursAgo.toISOString())
                .order('published_at', { ascending: false })
                .limit(filters.limit);

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const transformedData = (data || []).map(transformArticle);
            setNews(transformedData);
            lastFetchTime.current = new Date();

        } catch (err) {
            console.error('Erreur chargement initial:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters.limit]); // On ne dépend que de la limite ici

    useEffect(() => {
        loadInitialArticles();
    }, [loadInitialArticles]);

    // S'abonner aux changements en temps réel
    useEffect(() => {
        const channel = supabase
            .channel('realtime-articles')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'articles' },
                (payload) => {
                    const newArticle = transformArticle(payload.new);
                    setNews(prev => {
                        if (prev.some(article => article.id === newArticle.id)) return prev;
                        return [newArticle, ...prev].slice(0, 1000);
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const refresh = useCallback(async () => {
        console.log('Rafraîchissement manuel...');
        await loadInitialArticles();
    }, [loadInitialArticles]);

    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);

    const markAsRead = useCallback((articleId) => {
        setNews(prev =>
            prev.map(item =>
                item.id === articleId ? { ...item, isRead: true } : item
            )
        );
    }, []);

    const getStats = useCallback(() => {
        if (!news || news.length === 0) {
            return { total: 0, last24h: 0, byOrientation: {}, byCategory: {}, bySource: {} };
        }

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
        const last24h = news.filter(item => {
            const articleTime = new Date(item.publishedAt).getTime();
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return articleTime > dayAgo;
        }).length;

        return { total, last24h, byOrientation, byCategory, bySource };
    }, [news]);

    return {
        news,
        loading,
        error,
        filters,
        updateFilters,
        refresh,
        markAsRead,
        getStats,
        lastUpdate: lastFetchTime.current
    };
};