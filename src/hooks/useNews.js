// src/hooks/useNews.js
// Version FINALE - Protection contre les race conditions

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db, isSupabaseConfigured } from '../lib/supabase';
import { mockNews } from '../data/mockNews';

const USE_SUPABASE = true;

export const useNews = () => {
    const [news, setNews] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTags, setSelectedTags] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 🔥 PROTECTION CONTRE LES RACE CONDITIONS
    const loadingRef = useRef(false);
    const abortControllerRef = useRef(null);

    // Charger les actualités avec protection contre les appels concurrents
    const loadNews = useCallback(async () => {
        // 🛡️ Si un chargement est déjà en cours, on abandonne
        if (loadingRef.current) {
            console.log('⚠️ Chargement déjà en cours, abandon...');
            return;
        }

        // 🛡️ Annuler toute requête précédente
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Marquer le début du chargement
        loadingRef.current = true;
        abortControllerRef.current = new AbortController();

        setIsLoading(true);
        setError(null);

        try {
            if (!USE_SUPABASE || !isSupabaseConfigured()) {
                console.log('📌 Utilisation des données mock');
                setNews(mockNews);
                return;
            }

            console.log('📥 Chargement des articles depuis Supabase...');

            // 🛡️ Requête avec signal d'annulation
            const { data, error: supabaseError } = await db
                .from('articles')
                .select('*')
                .order('pubDate', { ascending: false })
                .limit(300)
                .abortSignal(abortControllerRef.current.signal);

            // Si la requête a été annulée, on s'arrête
            if (abortControllerRef.current.signal.aborted) {
                console.log('🛑 Requête annulée');
                return;
            }

            if (supabaseError) throw supabaseError;

            // CONVERSION PARE-BALLES : Sécurisation de toutes les données
            const convertedNews = (data || []).map(article => {
                const safeTitle = String(article.title || 'Sans titre');
                const safeSource = String(article.source_name || 'Source inconnue');
                const safeLink = String(article.link || '#');
                const safeOrientation = String(article.orientation || 'neutre');
                const safeCategory = String(article.category || 'généraliste');

                let safeTags = [];
                if (Array.isArray(article.tags)) {
                    safeTags = article.tags.filter(tag => typeof tag === 'string');
                }

                let safeTimestamp = Date.now();
                try {
                    if (article.pubDate) {
                        const parsedDate = new Date(article.pubDate);
                        if (!isNaN(parsedDate.getTime())) {
                            safeTimestamp = parsedDate.getTime();
                        }
                    }
                } catch (e) {
                    console.warn('Date invalide pour article:', article.id);
                }

                return {
                    id: article.id,
                    title: safeTitle,
                    source: safeSource,
                    url: safeLink,
                    orientation: safeOrientation,
                    category: safeCategory,
                    tags: safeTags,
                    timestamp: safeTimestamp,
                    views: Number(article.views) || 0,
                    clicks: Number(article.clicks) || 0,
                    imageUrl: article.image_url || null,
                    publishedAt: article.pubDate,
                    guid: article.guid || null
                };
            });

            // Filtrer les articles des dernières 24h
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentNews = convertedNews.filter(article => article.timestamp > twentyFourHoursAgo);

            // 🛡️ Vérifier une dernière fois qu'on n'a pas été annulé
            if (!abortControllerRef.current.signal.aborted) {
                console.log(`✅ ${recentNews.length} articles des dernières 24h chargés`);
                setNews(recentNews);
            }

        } catch (err) {
            // Ignorer les erreurs d'annulation
            if (err.name === 'AbortError') {
                console.log('🛑 Chargement annulé');
                return;
            }

            console.error('❌ Erreur chargement articles:', err);
            setError(err.message);
            console.log('📌 Fallback vers les données mock');
            setNews(mockNews);
        } finally {
            // Marquer la fin du chargement
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, []);

    // Charger au montage du composant
    useEffect(() => {
        loadNews();

        // Nettoyage au démontage
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadNews]);

    // 🛡️ Actualisation automatique SÉCURISÉE
    useEffect(() => {
        if (!USE_SUPABASE || !isSupabaseConfigured()) return;

        const interval = setInterval(() => {
            console.log('⏰ Tentative d\'actualisation automatique...');
            loadNews(); // La fonction se protège elle-même contre les appels concurrents
        }, 30000);

        return () => {
            clearInterval(interval);
            // Annuler toute requête en cours
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadNews]);

    // ✅ FONCTION : Ajouter un article (Admin)
    const addNews = useCallback(async (newArticle) => {
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            const mockArticle = {
                id: Date.now(),
                title: String(newArticle.title || 'Sans titre'),
                source: String(newArticle.source || 'Admin'),
                url: String(newArticle.url || `#article-${Date.now()}`),
                orientation: String(newArticle.orientation || 'neutre'),
                category: String(newArticle.category || 'généraliste'),
                tags: Array.isArray(newArticle.tags) ? newArticle.tags : [],
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
                title: String(newArticle.title || 'Sans titre'),
                link: String(newArticle.url || `https://admin.local/article-${Date.now()}`),
                source_name: String(newArticle.source || 'Admin'),
                orientation: String(newArticle.orientation || 'neutre'),
                category: String(newArticle.category || 'généraliste'),
                tags: Array.isArray(newArticle.tags) ? newArticle.tags.filter(t => typeof t === 'string') : [],
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

            const convertedArticle = {
                id: data.id,
                title: String(data.title || 'Sans titre'),
                source: String(data.source_name || 'Admin'),
                url: String(data.link || '#'),
                orientation: String(data.orientation || 'neutre'),
                category: String(data.category || 'généraliste'),
                tags: Array.isArray(data.tags) ? data.tags : [],
                timestamp: new Date(data.pubDate).getTime(),
                views: Number(data.views) || 0,
                clicks: Number(data.clicks) || 0,
                imageUrl: data.image_url || null,
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
            setNews(prev => prev.map(item =>
                item.id === id ? { ...item, ...updates } : item
            ));
            return { success: true };
        }

        try {
            console.log('📝 Mise à jour de l\'article', id);

            const updateData = {};
            if (updates.title !== undefined) updateData.title = String(updates.title);
            if (updates.source !== undefined) updateData.source_name = String(updates.source);
            if (updates.url !== undefined) updateData.link = String(updates.url);
            if (updates.orientation !== undefined) updateData.orientation = String(updates.orientation);
            if (updates.category !== undefined) updateData.category = String(updates.category);
            if (updates.tags !== undefined) updateData.tags = Array.isArray(updates.tags) ? updates.tags.filter(t => typeof t === 'string') : [];
            if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

            const { error } = await db
                .from('articles')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            setNews(prev => prev.map(item => {
                if (item.id === id) {
                    return {
                        ...item,
                        title: updates.title !== undefined ? String(updates.title) : item.title,
                        source: updates.source !== undefined ? String(updates.source) : item.source,
                        url: updates.url !== undefined ? String(updates.url) : item.url,
                        orientation: updates.orientation !== undefined ? String(updates.orientation) : item.orientation,
                        category: updates.category !== undefined ? String(updates.category) : item.category,
                        tags: updates.tags !== undefined ? (Array.isArray(updates.tags) ? updates.tags : []) : item.tags,
                        imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : item.imageUrl
                    };
                }
                return item;
            }));

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

            setNews(prev => prev.filter(item => item.id !== id));

            console.log('✅ Article supprimé');
            return { success: true };

        } catch (err) {
            console.error('❌ Erreur suppression:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // ✅ FONCTION : Marquer comme lu
    const markAsRead = useCallback(async (id) => {
        if (!id) return;

        setNews(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, views: (Number(item.views) || 0) + 1 }
                    : item
            )
        );

        if (USE_SUPABASE && isSupabaseConfigured()) {
            try {
                const { error } = await db.rpc('increment_views', { article_id: id });

                if (error && error.code === '42883') {
                    const article = news.find(n => n.id === id);
                    if (article) {
                        await db
                            .from('articles')
                            .update({ views: (Number(article.views) || 0) + 1 })
                            .eq('id', id);
                    }
                }
            } catch (err) {
                console.error('Erreur incrémentation vues:', err);
            }
        }
    }, [news]);

    // ✅ FONCTION : Incrémenter les clics
    const incrementClicks = useCallback(async (id) => {
        if (!id) return;

        setNews(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, clicks: (Number(item.clicks) || 0) + 1 }
                    : item
            )
        );

        if (USE_SUPABASE && isSupabaseConfigured()) {
            try {
                const article = news.find(n => n.id === id);
                if (article) {
                    await db
                        .from('articles')
                        .update({ clicks: (Number(article.clicks) || 0) + 1 })
                        .eq('id', id);
                }
            } catch (err) {
                console.error('Erreur incrémentation clics:', err);
            }
        }
    }, [news]);

    // Filtrer les news (avec protection)
    const filteredNews = useMemo(() => {
        // 🛡️ Protection contre les états invalides
        if (!Array.isArray(news)) return [];

        let filtered = [...news];

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item =>
                item && String(item.orientation) === selectedCategory
            );
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(item =>
                item && item.tags && Array.isArray(item.tags) &&
                item.tags.some(tag => selectedTags.includes(tag))
            );
        }

        filtered.sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));

        return filtered;
    }, [news, selectedCategory, selectedTags]);

    // Obtenir tous les tags uniques avec sécurisation
    const allTags = useMemo(() => {
        const tags = new Set();
        if (Array.isArray(news)) {
            news.forEach(item => {
                if (item && item.tags && Array.isArray(item.tags)) {
                    item.tags.forEach(tag => {
                        if (tag && typeof tag === 'string') {
                            tags.add(tag);
                        }
                    });
                }
            });
        }
        return Array.from(tags).sort();
    }, [news]);

    // Actions simples avec validation
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
        console.log('🔄 Rafraîchissement forcé demandé');
        // Si un chargement est en cours, on annule
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // On force le rechargement
        loadingRef.current = false;
        loadNews();
    }, [loadNews]);

    // ✅ FONCTION : Recherche
    const searchNews = useCallback((query) => {
        if (!query || typeof query !== 'string') return news;
        if (!Array.isArray(news)) return [];

        const lowerQuery = query.toLowerCase().trim();

        return news.filter(item => {
            if (!item) return false;
            const safeTitle = String(item.title || '').toLowerCase();
            const safeSource = String(item.source || '').toLowerCase();
            const hasTitleMatch = safeTitle.includes(lowerQuery);
            const hasSourceMatch = safeSource.includes(lowerQuery);
            const hasTagMatch = item.tags && Array.isArray(item.tags) &&
                item.tags.some(tag => String(tag || '').toLowerCase().includes(lowerQuery));

            return hasTitleMatch || hasSourceMatch || hasTagMatch;
        });
    }, [news]);

    // Statistiques avec protection
    const getNewsStats = useCallback(() => {
        const stats = {
            total: 0,
            byOrientation: {},
            byCategory: {},
            bySource: {},
            last24h: 0,
            mostViewed: null,
            mostClicked: null
        };

        if (!Array.isArray(news)) return stats;

        stats.total = news.length;
        stats.last24h = news.length;

        news.forEach(item => {
            if (!item) return;

            const orientation = String(item.orientation || 'neutre');
            stats.byOrientation[orientation] = (stats.byOrientation[orientation] || 0) + 1;

            const category = String(item.category || 'généraliste');
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            const source = String(item.source || 'Inconnue');
            stats.bySource[source] = (stats.bySource[source] || 0) + 1;
        });

        if (news.length > 0) {
            stats.mostViewed = [...news]
                .filter(item => item)
                .sort((a, b) => (Number(b?.views) || 0) - (Number(a?.views) || 0))[0];
            stats.mostClicked = [...news]
                .filter(item => item)
                .sort((a, b) => (Number(b?.clicks) || 0) - (Number(a?.clicks) || 0))[0];
        }

        return stats;
    }, [news]);

    // Stats globales
    const getStats = useCallback(async () => {
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            return {
                total_articles: news.length,
                active_sources: new Set(news.map(n => n?.source).filter(Boolean)).size
            };
        }

        try {
            const { count: totalCount } = await db
                .from('articles')
                .select('*', { count: 'exact', head: true });

            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentArticles } = await db
                .from('articles')
                .select('source_name')
                .gte('pubDate', twentyFourHoursAgo);

            const uniqueSources = new Set(recentArticles?.map(item => String(item.source_name || '')) || []);

            return {
                total_articles: totalCount || 0,
                active_sources: uniqueSources.size
            };
        } catch (err) {
            console.error('Erreur récupération stats:', err);
            return {
                total_articles: news.length,
                active_sources: new Set(news.map(n => n?.source).filter(Boolean)).size
            };
        }
    }, [news]);

    // Helper pour formater les dates
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';

            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'À l\'instant';
            if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
            if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
            if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

            return date.toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            console.error('Erreur formatage date:', err);
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
        totalNews: Array.isArray(news) ? news.length : 0,
        totalFilteredNews: Array.isArray(filteredNews) ? filteredNews.length : 0
    };
};

export default useNews;