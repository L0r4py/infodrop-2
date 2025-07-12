// src/hooks/useNews.js
// Version FINALE COMPLÈTE avec toutes les fonctions CRUD

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

    // Charger les actualités depuis Supabase
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

            // Requête simple et directe à Supabase
            const { data, error: supabaseError } = await db
                .from('articles')
                .select('*')
                .order('pubDate', { ascending: false })
                .limit(300);

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
                tags: Array.isArray(article.tags) ? article.tags : [],
                timestamp: article.pubDate ? new Date(article.pubDate).getTime() : Date.now(),
                views: article.views || 0,
                clicks: article.clicks || 0,
                imageUrl: article.image_url || null,
                publishedAt: article.pubDate,
                guid: article.guid
            }));

            // Filtrer les articles des dernières 24h
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentNews = convertedNews.filter(article => article.timestamp > twentyFourHoursAgo);

            console.log(`✅ ${recentNews.length} articles des dernières 24h chargés`);
            setNews(recentNews);

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

    // ✅ FONCTION : Ajouter un article (Admin)
    const addNews = useCallback(async (newArticle) => {
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            // Mode mock : ajouter localement
            const mockArticle = {
                id: Date.now(),
                title: newArticle.title,
                source: newArticle.source || 'Admin',
                url: newArticle.url || `#article-${Date.now()}`,
                orientation: newArticle.orientation || 'neutre',
                category: newArticle.category || 'généraliste',
                tags: newArticle.tags || [],
                timestamp: Date.now(),
                views: 0,
                clicks: 0,
                imageUrl: null,
                publishedAt: new Date().toISOString()
            };
            setNews(prev => [mockArticle, ...prev]);
            return { success: true, data: mockArticle };
        }

        try {
            console.log('➕ Ajout d\'un nouvel article...');

            const articleToInsert = {
                title: newArticle.title,
                link: newArticle.url || `https://admin.local/article-${Date.now()}`,
                source_name: newArticle.source || 'Admin',
                orientation: newArticle.orientation || 'neutre',
                category: newArticle.category || 'généraliste',
                tags: newArticle.tags || [],
                pubDate: new Date().toISOString(),
                image_url: newArticle.imageUrl || null,
                guid: `admin-${Date.now()}`,
                views: 0,
                clicks: 0
            };

            const { data, error } = await db
                .from('articles')
                .insert([articleToInsert])
                .select()
                .single();

            if (error) throw error;

            // Ajouter l'article converti à la liste locale
            const convertedArticle = {
                id: data.id,
                title: data.title,
                source: data.source_name,
                url: data.link,
                orientation: data.orientation,
                category: data.category,
                tags: data.tags || [],
                timestamp: new Date(data.pubDate).getTime(),
                views: data.views || 0,
                clicks: data.clicks || 0,
                imageUrl: data.image_url,
                publishedAt: data.pubDate
            };

            setNews(prev => [convertedArticle, ...prev].sort((a, b) => b.timestamp - a.timestamp));
            console.log('✅ Article ajouté avec succès');

            return { success: true, data: convertedArticle };

        } catch (err) {
            console.error('❌ Erreur ajout article:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // ✅ FONCTION : Mettre à jour un article
    const updateNews = useCallback(async (id, updates) => {
        if (!id) return { success: false, error: 'ID manquant' };

        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            // Mode mock : mettre à jour localement
            setNews(prev => prev.map(item =>
                item.id === id ? { ...item, ...updates } : item
            ));
            return { success: true };
        }

        try {
            console.log('📝 Mise à jour de l\'article', id);

            const updateData = {};
            if (updates.title) updateData.title = updates.title;
            if (updates.source) updateData.source_name = updates.source;
            if (updates.url) updateData.link = updates.url;
            if (updates.orientation) updateData.orientation = updates.orientation;
            if (updates.category) updateData.category = updates.category;
            if (updates.tags) updateData.tags = updates.tags;
            if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

            const { error } = await db
                .from('articles')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            // Mettre à jour localement
            setNews(prev => prev.map(item =>
                item.id === id ? { ...item, ...updates } : item
            ));

            console.log('✅ Article mis à jour');
            return { success: true };

        } catch (err) {
            console.error('❌ Erreur mise à jour:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // ✅ FONCTION : Supprimer un article
    const deleteNews = useCallback(async (id) => {
        if (!id) return { success: false, error: 'ID manquant' };

        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            // Mode mock : supprimer localement
            setNews(prev => prev.filter(item => item.id !== id));
            return { success: true };
        }

        try {
            console.log('🗑️ Suppression de l\'article', id);

            const { error } = await db
                .from('articles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Supprimer localement
            setNews(prev => prev.filter(item => item.id !== id));

            console.log('✅ Article supprimé');
            return { success: true };

        } catch (err) {
            console.error('❌ Erreur suppression:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // ✅ FONCTION : Marquer comme lu (incrémenter les vues)
    const markAsRead = useCallback(async (id) => {
        if (!id) return;

        // Mise à jour locale immédiate pour la réactivité
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
                // Incrémenter directement dans la base
                const { error } = await db.rpc('increment_views', { article_id: id });

                // Si la fonction RPC n'existe pas, faire un update classique
                if (error && error.code === '42883') {
                    const article = news.find(n => n.id === id);
                    if (article) {
                        await db
                            .from('articles')
                            .update({ views: (article.views || 0) + 1 })
                            .eq('id', id);
                    }
                }
            } catch (err) {
                console.error('Erreur incrémentation vues:', err);
                // Pas grave si ça échoue, on continue
            }
        }
    }, [news]);

    // ✅ FONCTION : Incrémenter les clics
    const incrementClicks = useCallback(async (id) => {
        if (!id) return;

        // Mise à jour locale
        setNews(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, clicks: (item.clicks || 0) + 1 }
                    : item
            )
        );

        if (USE_SUPABASE && isSupabaseConfigured()) {
            try {
                const article = news.find(n => n.id === id);
                if (article) {
                    await db
                        .from('articles')
                        .update({ clicks: (article.clicks || 0) + 1 })
                        .eq('id', id);
                }
            } catch (err) {
                console.error('Erreur incrémentation clics:', err);
            }
        }
    }, [news]);

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
                item.tags && Array.isArray(item.tags) &&
                item.tags.some(tag => selectedTags.includes(tag))
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
                item.tags.forEach(tag => {
                    if (tag && typeof tag === 'string') {
                        tags.add(tag);
                    }
                });
            }
        });
        return Array.from(tags).sort();
    }, [news]);

    // Actions simples
    const toggleTag = useCallback((tag) => {
        if (!tag || typeof tag !== 'string') return;

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

    // ✅ FONCTION : Recherche dans les articles
    const searchNews = useCallback((query) => {
        if (!query || typeof query !== 'string') return news;

        const lowerQuery = query.toLowerCase().trim();

        return news.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            item.source.toLowerCase().includes(lowerQuery) ||
            (item.tags && item.tags.some(tag =>
                tag.toLowerCase().includes(lowerQuery)
            ))
        );
    }, [news]);

    // Statistiques détaillées
    const getNewsStats = useCallback(() => {
        const stats = {
            total: news.length,
            byOrientation: {},
            byCategory: {},
            bySource: {},
            last24h: news.length,
            mostViewed: null,
            mostClicked: null
        };

        // Compter par orientation et catégorie
        news.forEach(item => {
            // Par orientation
            const orientation = String(item.orientation || 'neutre');
            stats.byOrientation[orientation] = (stats.byOrientation[orientation] || 0) + 1;

            // Par catégorie
            const category = String(item.category || 'généraliste');
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Par source
            const source = String(item.source || 'Inconnue');
            stats.bySource[source] = (stats.bySource[source] || 0) + 1;
        });

        // Articles les plus vus/cliqués
        if (news.length > 0) {
            stats.mostViewed = [...news].sort((a, b) => (b.views || 0) - (a.views || 0))[0];
            stats.mostClicked = [...news].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0];
        }

        return stats;
    }, [news]);

    // Fonction pour obtenir les stats globales depuis Supabase
    const getStats = useCallback(async () => {
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            return {
                total_articles: news.length,
                active_sources: new Set(news.map(n => n.source)).size
            };
        }

        try {
            // Compter le total d'articles dans la base
            const { count: totalCount } = await db
                .from('articles')
                .select('*', { count: 'exact', head: true });

            // Récupérer les sources uniques des dernières 24h
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentArticles } = await db
                .from('articles')
                .select('source_name')
                .gte('pubDate', twentyFourHoursAgo);

            const uniqueSources = new Set(recentArticles?.map(item => item.source_name) || []);

            return {
                total_articles: totalCount || 0,
                active_sources: uniqueSources.size
            };
        } catch (err) {
            console.error('Erreur récupération stats:', err);
            return {
                total_articles: news.length,
                active_sources: new Set(news.map(n => n.source)).size
            };
        }
    }, [news]);

    // Helper pour formater les dates
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            // Calculer le temps écoulé
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            // Affichage relatif pour les articles récents
            if (diffMins < 1) return 'À l\'instant';
            if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
            if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
            if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

            // Format complet pour les articles plus anciens
            return date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            return '';
        }
    }, []);

    return {
        // État
        news,
        filteredNews,
        selectedCategory,
        selectedTags,
        allTags,
        isLoading,
        error,

        // Actions CRUD
        addNews,
        updateNews,
        deleteNews,
        markAsRead,
        incrementClicks,

        // Actions de filtrage
        setSelectedCategory,
        toggleTag,
        clearTags,
        searchNews,

        // Actions système
        forceRefresh,
        loadNews,

        // Statistiques
        getNewsStats,
        getStats,

        // Helpers
        formatDate,
        totalNews: news.length,
        totalFilteredNews: filteredNews.length
    };
};

export default useNews;