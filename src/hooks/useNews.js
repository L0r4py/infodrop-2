// src/hooks/useNews.js
// VERSION FINALE CORRIGÉE - BOUCLE INFINIE SUPPRIMÉE

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { mockNews } from '../data/mockNews';

const USE_SUPABASE = true;
const REFRESH_INTERVAL = 30000; // 30 secondes

export const useNews = () => {
    // États
    const [news, setNews] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTags, setSelectedTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // ✅ NOUVEL ÉTAT
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ ÉTAT DES STATS GLOBALES CENTRALISÉ ICI
    const [globalStats, setGlobalStats] = useState({
        total_articles: 0,
        active_sources: 0,
        articles_publies_24h: 0
    });

    // 🔥 PROTECTION CONTRE LES RACE CONDITIONS
    const loadingRef = useRef(false);
    const abortControllerRef = useRef(null);

    // ✅ FONCTION PRIVÉE : Charger les stats globales
    const fetchGlobalStats = useCallback(async () => {
        if (!supabase) {
            console.warn('⚠️ Supabase non disponible pour les stats');
            return;
        }

        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const [articlesRes, sourcesRes] = await Promise.all([
                supabase.from('articles').select('id').gte('pubDate', twentyFourHoursAgo),
                supabase.from('articles').select('source_name').gte('pubDate', twentyFourHoursAgo)
            ]);

            if (articlesRes.error) throw articlesRes.error;
            if (sourcesRes.error) throw sourcesRes.error;

            const total_articles = articlesRes.data?.length || 0;
            const uniqueSources = new Set(sourcesRes.data?.map(item => item.source_name) || []);

            setGlobalStats({
                total_articles: total_articles,
                active_sources: uniqueSources.size,
                articles_publies_24h: total_articles
            });
        } catch (err) {
            console.error("Erreur récupération stats globales:", err);
        }
    }, []);

    // ✅ FONCTION PRINCIPALE : Charger les news PUIS les stats
    // 🔴 CORRECTION : Retrait de 'news' des dépendances pour éviter la boucle infinie
    const loadNews = useCallback(async (isInitialLoad = false) => {
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

        // On met isLoading à true seulement si c'est le premier chargement
        if (isInitialLoad) {
            setIsLoading(true);
        }
        setError(null);

        try {
            if (!USE_SUPABASE || !isSupabaseConfigured() || !supabase) {
                console.log('📌 Utilisation des données mock');
                setNews(mockNews);
                setGlobalStats({
                    total_articles: mockNews.length,
                    active_sources: new Set(mockNews.map(n => n.source)).size,
                    articles_publies_24h: mockNews.length
                });
                return;
            }

            console.log('📥 Chargement des articles...');

            // 🎯 ÉTAPE 1 : Charger les articles
            const { data, error: supabaseError } = await supabase
                .from('articles')
                .select('*')
                .order('pubDate', { ascending: false })
                .limit(300)
                .abortSignal(abortControllerRef.current.signal);

            if (abortControllerRef.current.signal.aborted) {
                console.log('🛑 Requête annulée');
                return;
            }

            if (supabaseError) throw supabaseError;

            // CONVERSION PARE-BALLES
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

            if (!abortControllerRef.current.signal.aborted) {
                console.log(`✅ ${recentNews.length} articles chargés`);
                setNews(recentNews);

                // 🎯 ÉTAPE 2 : Charger les stats APRÈS les articles
                await fetchGlobalStats();
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('🛑 Chargement annulé');
                return;
            }

            console.error('❌ Erreur chargement articles:', err);
            setError(err.message);
            setNews(mockNews);
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
    }, [fetchGlobalStats]); // 🔴 CORRECTION : Retrait de 'news' des dépendances

    // ✅ UN SEUL useEffect POUR GÉRER TOUT LE CYCLE DE VIE
    useEffect(() => {
        let timeoutId;
        let mounted = true;

        const runLoadCycle = async (isInitial) => {
            if (!mounted) return;

            console.log('🔄 Cycle de chargement...');
            await loadNews(isInitial);

            // Programmer le prochain cycle SEULEMENT après la fin du chargement
            if (mounted) {
                timeoutId = setTimeout(() => runLoadCycle(false), REFRESH_INTERVAL);
            }
        };

        // Lancer le premier cycle
        runLoadCycle(true);

        // Nettoyage
        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadNews]);

    // ✅ FONCTION : Ajouter un article (Admin)
    const addNews = useCallback(async (newArticle) => {
        if (!USE_SUPABASE || !isSupabaseConfigured() || !supabase) {
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

            const { data, error } = await supabase
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
            await fetchGlobalStats();

            return { success: true, data: convertedArticle };

        } catch (err) {
            console.error('❌ Erreur ajout article:', err);
            return { success: false, error: err.message };
        }
    }, [fetchGlobalStats]);

    // ✅ FONCTION : Mettre à jour un article
    const updateNews = useCallback(async (id, updates) => {
        if (!id) return { success: false, error: 'ID manquant' };

        if (!USE_SUPABASE || !isSupabaseConfigured() || !supabase) {
            setNews(prev => prev.map(item =>
                item.id === id ? { ...item, ...updates } : item
            ));
            return { success: true };
        }

        try {
            const updateData = {};
            if (updates.title !== undefined) updateData.title = String(updates.title);
            if (updates.source !== undefined) updateData.source_name = String(updates.source);
            if (updates.url !== undefined) updateData.link = String(updates.url);
            if (updates.orientation !== undefined) updateData.orientation = String(updates.orientation);
            if (updates.category !== undefined) updateData.category = String(updates.category);
            if (updates.tags !== undefined) updateData.tags = Array.isArray(updates.tags) ? updates.tags.filter(t => typeof t === 'string') : [];
            if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

            const { error } = await supabase
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

            return { success: true };

        } catch (err) {
            console.error('❌ Erreur mise à jour:', err);
            return { success: false, error: err.message };
        }
    }, []);

    // ✅ FONCTION : Supprimer un article
    const deleteNews = useCallback(async (id) => {
        if (!id) return { success: false, error: 'ID manquant' };

        if (!USE_SUPABASE || !isSupabaseConfigured() || !supabase) {
            setNews(prev => prev.filter(item => item.id !== id));
            return { success: true };
        }

        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setNews(prev => prev.filter(item => item.id !== id));
            await fetchGlobalStats();

            return { success: true };

        } catch (err) {
            console.error('❌ Erreur suppression:', err);
            return { success: false, error: err.message };
        }
    }, [fetchGlobalStats]);

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

        if (USE_SUPABASE && isSupabaseConfigured() && supabase) {
            try {
                const { error } = await supabase.rpc('increment_views', { article_id: id });

                if (error && error.code === '42883') {
                    const { data: article } = await supabase
                        .from('articles')
                        .select('views')
                        .eq('id', id)
                        .single();

                    if (article) {
                        await supabase
                            .from('articles')
                            .update({ views: (Number(article.views) || 0) + 1 })
                            .eq('id', id);
                    }
                }
            } catch (err) {
                console.error('Erreur incrémentation vues:', err);
            }
        }
    }, []); // Correction : retrait de 'news' des dépendances

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

        if (USE_SUPABASE && isSupabaseConfigured() && supabase) {
            try {
                const { data: article } = await supabase
                    .from('articles')
                    .select('clicks')
                    .eq('id', id)
                    .single();

                if (article) {
                    await supabase
                        .from('articles')
                        .update({ clicks: (Number(article.clicks) || 0) + 1 })
                        .eq('id', id);
                }
            } catch (err) {
                console.error('Erreur incrémentation clics:', err);
            }
        }
    }, []); // Correction : retrait de 'news' des dépendances

    // ✅ LOGIQUE DE FILTRAGE MISE À JOUR
    const filteredNews = useMemo(() => {
        if (!Array.isArray(news)) return [];

        let filtered = [...news];

        // 1. Filtrage par recherche textuelle (appliqué en premier)
        if (searchTerm && searchTerm.trim() !== '') {
            const lowercasedTerm = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(item => {
                if (!item) return false;
                // On cherche dans le titre ET la source
                const titleMatch = (item.title?.toLowerCase() || '').includes(lowercasedTerm);
                const sourceMatch = (item.source?.toLowerCase() || '').includes(lowercasedTerm);
                return titleMatch || sourceMatch;
            });
        }

        // 2. Filtrage par orientation
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item =>
                item && String(item.orientation) === selectedCategory
            );
        }

        // 3. Filtrage par tags
        if (selectedTags.length > 0) {
            filtered = filtered.filter(item =>
                item && item.tags && Array.isArray(item.tags) &&
                item.tags.some(tag => selectedTags.includes(tag))
            );
        }

        // Tri par date
        filtered.sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0));

        return filtered;
    }, [news, selectedCategory, selectedTags, searchTerm]); // ✅ searchTerm ajouté aux dépendances

    // Obtenir tous les tags uniques
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

    // Actions de filtrage
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
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        loadingRef.current = false;
        loadNews(true); // Pass true for isInitialLoad
    }, [loadNews]);

    // Recherche
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

    // Statistiques locales
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

    // ✅ RETOUR FINAL AVEC searchTerm ET setSearchTerm
    return {
        // État
        news,
        filteredNews,
        selectedCategory,
        selectedTags,
        allTags,
        isLoading,
        error,
        globalStats,
        searchTerm,      // ✅ Nouveau
        setSearchTerm,   // ✅ Nouveau

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

        // Helpers
        formatDate,
        totalNews: Array.isArray(news) ? news.length : 0,
        totalFilteredNews: Array.isArray(filteredNews) ? filteredNews.length : 0
    };
};

export default useNews;