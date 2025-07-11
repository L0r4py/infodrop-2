// src/hooks/useNews.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, isSupabaseConfigured } from '../lib/supabase';
import { mockNews } from '../data/mockNews';

// Variable pour activer/désactiver Supabase
const USE_SUPABASE = true; // Mettez false pour utiliser les données mock

// Log du mode utilisé
if (USE_SUPABASE && isSupabaseConfigured()) {
    console.log('🌐 Mode: Supabase (données en temps réel)');
} else {
    console.log('📦 Mode: Données mock (développement)');
}

// Hook personnalisé pour gérer les actualités
export const useNews = () => {
    const [news, setNews] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Convertir les articles de Supabase au format de l'app
    const convertArticleFromSupabase = (article) => {
        // Déterminer la catégorie basée sur les tags
        let category = 'general';
        const tags = article.tags || [];

        if (tags.includes('politique') || tags.includes('officiel')) {
            category = 'politique';
        } else if (tags.includes('économie') || tags.includes('crypto')) {
            category = 'économie';
        } else if (tags.includes('écologie') || tags.includes('climat')) {
            category = 'environnement';
        } else if (tags.includes('société') || tags.includes('social')) {
            category = 'société';
        } else if (tags.includes('tech') || tags.includes('sciences')) {
            category = 'tech';
        } else if (tags.includes('sport')) {
            category = 'sport';
        } else if (tags.includes('culture')) {
            category = 'culture';
        }

        return {
            id: article.id,
            title: article.title,
            source: article.source_name,
            url: article.url,
            orientation: article.orientation || 'neutre', // PAS DE CONVERSION !
            category: category,
            tags: article.tags || [],
            timestamp: new Date(article.published_at).getTime(),
            views: article.views || 0,
            clicks: article.clicks || 0,
            summary: article.summary,
            imageUrl: article.image_url
        };
    };

    // Charger les actualités depuis Supabase
    const loadNews = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Vérifier si on doit utiliser Supabase
            if (!USE_SUPABASE || !isSupabaseConfigured()) {
                console.log('📌 Utilisation des données mock');
                setNews(mockNews);
                return;
            }

            // Récupérer les articles depuis Supabase
            const { data, error: supabaseError } = await db.articles.getAll({
                limit: 1000 // Récupère jusqu'à 1000 articles
            });

            if (supabaseError) throw supabaseError;

            // Convertir les articles au format de l'app
            const convertedNews = (data || []).map(convertArticleFromSupabase);

            // Trier par date (plus récent en premier)
            convertedNews.sort((a, b) => b.timestamp - a.timestamp);

            setNews(convertedNews);
            console.log(`✅ ${convertedNews.length} articles chargés depuis Supabase`);

            // DEBUG: Afficher les orientations uniques
            const uniqueOrientations = [...new Set(convertedNews.map(n => n.orientation))];
            console.log('📊 Orientations trouvées:', uniqueOrientations);
        } catch (err) {
            console.error('❌ Erreur chargement articles:', err);
            setError(err.message);

            // Fallback vers les données mock en cas d'erreur
            console.log('📌 Fallback vers les données mock');
            setNews(mockNews);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Charger les news au montage et toutes les 5 minutes
    useEffect(() => {
        loadNews();

        // Rafraîchir toutes les 5 minutes seulement si on utilise Supabase
        if (USE_SUPABASE && isSupabaseConfigured()) {
            const interval = setInterval(loadNews, 5 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [loadNews]);

    // Ajouter une actualité (pour l'admin)
    const addNews = useCallback(async (newArticle) => {
        // Si on n'utilise pas Supabase, ajouter localement
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            const article = {
                ...newArticle,
                id: Date.now(),
                timestamp: Date.now(),
                views: 0
            };
            setNews(prev => [article, ...prev]);
            return article;
        }

        try {
            const supabaseArticle = {
                title: newArticle.title,
                url: newArticle.url || `#${Date.now()}`,
                source_name: newArticle.source || 'Admin',
                orientation: newArticle.orientation || 'neutre',
                tags: newArticle.tags || [],
                published_at: new Date().toISOString(),
                summary: newArticle.summary || newArticle.title,
                views: 0,
                clicks: 0
            };

            const { data, error } = await db.articles.create(supabaseArticle);

            if (error) throw error;

            // Recharger les articles
            await loadNews();

            return convertArticleFromSupabase(data);
        } catch (err) {
            console.error('Erreur ajout article:', err);
            setError(err.message);
            throw err;
        }
    }, [loadNews]);

    // Mettre à jour une actualité
    const updateNews = useCallback(async (id, updates) => {
        // Si on n'utilise pas Supabase, mettre à jour localement
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            setNews(prev =>
                prev.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                )
            );
            return;
        }

        try {
            const supabaseUpdates = {};

            if (updates.title) supabaseUpdates.title = updates.title;
            if (updates.source) supabaseUpdates.source_name = updates.source;
            if (updates.orientation) {
                supabaseUpdates.orientation = updates.orientation; // CORRIGÉ : pas de mapping
            }
            if (updates.tags) supabaseUpdates.tags = updates.tags;
            if (updates.summary) supabaseUpdates.summary = updates.summary;

            const { error } = await db.articles.update(id, supabaseUpdates);

            if (error) throw error;

            // Mettre à jour localement
            setNews(prev =>
                prev.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                )
            );
        } catch (err) {
            console.error('Erreur mise à jour article:', err);
            setError(err.message);
            throw err;
        }
    }, []);

    // Supprimer une actualité
    const deleteNews = useCallback(async (id) => {
        // Si on n'utilise pas Supabase, supprimer localement
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            setNews(prev => prev.filter(item => item.id !== id));
            return;
        }

        try {
            const { error } = await db.articles.delete(id);

            if (error) throw error;

            // Supprimer localement
            setNews(prev => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Erreur suppression article:', err);
            setError(err.message);
            throw err;
        }
    }, []);

    // Marquer une actualité comme lue (incrémenter les vues)
    const markAsRead = useCallback(async (id) => {
        // Incrémenter localement d'abord pour une réactivité immédiate
        setNews(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, views: (item.views || 0) + 1 }
                    : item
            )
        );

        // Si on utilise Supabase, mettre à jour la base
        if (USE_SUPABASE && isSupabaseConfigured()) {
            try {
                const article = news.find(n => n.id === id);
                if (article) {
                    await db.articles.update(id, {
                        views: (article.views || 0) + 1
                    });
                }
            } catch (err) {
                console.error('Erreur incrémentation vues:', err);
                // Pas grave si ça échoue, on continue
            }
        }
    }, [news]);

    // Obtenir tous les tags uniques
    const allTags = useMemo(() => {
        const tags = new Set();
        news.forEach(item => {
            item.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [news]);

    // Filtrer les news
    const filteredNews = useMemo(() => {
        let filtered = news;

        // Filtrer par orientation politique
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.orientation === selectedCategory);
        }

        // Filtrer par tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(item =>
                item.tags?.some(tag => selectedTags.includes(tag))
            );
        }

        // Déjà triées par date lors du chargement
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