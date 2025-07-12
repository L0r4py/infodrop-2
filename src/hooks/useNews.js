// src/hooks/useNews.js
// Version SIMPLE et STABLE - Utilise les nouvelles colonnes de la BDD

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, isSupabaseConfigured } from '../lib/supabase';
import { mockNews } from '../data/mockNews';

// Variable pour activer/désactiver Supabase
const USE_SUPABASE = true;

export const useNews = () => {
    const [news, setNews] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Charger les actualités
    const loadNews = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Vérifier si on doit utiliser Supabase
            if (!USE_SUPABASE || !isSupabaseConfigured()) {
                console.log('📌 Utilisation des données mock');
                setNews(mockNews);
                setIsLoading(false);
                return;
            }

            console.log('📥 Chargement des articles depuis Supabase...');

            // Requête simple et directe
            const { data, error: supabaseError } = await db
                .from('articles')
                .select('*')
                .order('pubDate', { ascending: false })
                .limit(200);

            if (supabaseError) {
                throw supabaseError;
            }

            // Convertir les articles au format attendu par l'app
            const convertedNews = (data || []).map(article => ({
                id: article.id,
                title: article.title || '',
                source: article.source_name || '',
                url: article.link || '',
                orientation: article.orientation || 'neutre',
                category: article.category || 'généraliste',
                tags: article.tags || [],
                timestamp: new Date(article.pubDate).getTime(),
                views: article.views || 0,
                clicks: article.clicks || 0,
                imageUrl: article.image_url || null,
                publishedAt: article.pubDate
            }));

            console.log(`✅ ${convertedNews.length} articles chargés`);
            setNews(convertedNews);

        } catch (err) {
            console.error('❌ Erreur chargement articles:', err);
            setError(err.message);

            // Fallback vers les données mock
            console.log('📌 Fallback vers les données mock');
            setNews(mockNews);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Charger au montage du composant
    useEffect(() => {
        loadNews();
    }, [loadNews]);

    // Actualisation automatique toutes les 30 secondes
    useEffect(() => {
        if (USE_SUPABASE && isSupabaseConfigured()) {
            const interval = setInterval(() => {
                console.log('⏰ Actualisation automatique...');
                loadNews();
            }, 30000);

            return () => clearInterval(interval);
        }
    }, [loadNews]);

    // Filtrer les news par orientation et tags
    const filteredNews = useMemo(() => {
        let filtered = [...news];

        // Filtrer par orientation
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.orientation === selectedCategory);
        }

        // Filtrer par tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(item =>
                item.tags && item.tags.some(tag => selectedTags.includes(tag))
            );
        }

        // Toujours trier par date décroissante
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        return filtered;
    }, [news, selectedCategory, selectedTags]);

    // Obtenir tous les tags uniques
    const allTags = useMemo(() => {
        const tags = new Set();
        news.forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [news]);

    // Actions simples
    const toggleTag = useCallback((tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    }, []);

    const clearTags = useCallback(() => {
        setSelectedTags([]);
    }, []);

    const forceRefresh = useCallback(() => {
        console.log('🔄 Rafraîchissement forcé');
        loadNews();
    }, [loadNews]);

    // Marquer comme lu (incrémenter les vues)
    const markAsRead = useCallback(async (id) => {
        // Mise à jour locale immédiate
        setNews(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, views: (item.views || 0) + 1 }
                    : item
            )
        );

        // Mise à jour en base si Supabase est actif
        if (USE_SUPABASE && isSupabaseConfigured()) {
            try {
                await db
                    .from('articles')
                    .update({ views: db.raw('views + 1') })
                    .eq('id', id);
            } catch (err) {
                console.error('Erreur mise à jour vues:', err);
            }
        }
    }, []);

    // Statistiques simples
    const getNewsStats = useCallback(() => {
        const stats = {
            total: news.length,
            byOrientation: {},
            byCategory: {},
            last24h: 0
        };

        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        news.forEach(item => {
            // Par orientation
            const orientation = item.orientation || 'neutre';
            stats.byOrientation[orientation] = (stats.byOrientation[orientation] || 0) + 1;

            // Par catégorie
            const category = item.category || 'généraliste';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Dernières 24h
            if (item.timestamp > oneDayAgo) {
                stats.last24h++;
            }
        });

        return stats;
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
        setSelectedCategory,
        toggleTag,
        clearTags,
        forceRefresh,
        markAsRead,
        getNewsStats,

        // Helper
        totalNews: news.length,
        totalFilteredNews: filteredNews.length
    };
};

export default useNews;