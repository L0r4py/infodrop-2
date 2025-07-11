// src/hooks/useNews.js

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

    // 🔥 NOUVEAU : Garder trace du dernier timestamp
    const lastTimestampRef = useRef(null);
    const isFirstLoadRef = useRef(true);

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
            orientation: article.orientation || 'neutre',
            category: category,
            tags: article.tags || [],
            timestamp: new Date(article.published_at).getTime(),
            views: article.views || 0,
            clicks: article.clicks || 0,
            summary: article.summary,
            imageUrl: article.image_url,
            publishedAt: article.published_at // 🔥 Garder la date originale
        };
    };

    // 🔥 FONCTION MODIFIÉE : Charger les actualités intelligemment
    const loadNews = useCallback(async (forceRefresh = false) => {
        // Afficher le loader seulement au premier chargement
        if (isFirstLoadRef.current || forceRefresh) {
            setIsLoading(true);
        }

        setError(null);

        try {
            // Vérifier si on doit utiliser Supabase
            if (!USE_SUPABASE || !isSupabaseConfigured()) {
                console.log('📌 Utilisation des données mock');
                setNews(mockNews);
                return;
            }

            let data;
            let supabaseError;

            // 🔥 LOGIQUE INTELLIGENTE : Ne charger que les nouveaux articles
            if (!isFirstLoadRef.current && lastTimestampRef.current && !forceRefresh) {
                // Chercher seulement les nouveaux articles
                console.log('🔍 Recherche de nouveaux articles depuis:', lastTimestampRef.current);

                const result = await db.articles.getNewArticles(lastTimestampRef.current);
                data = result.data;
                supabaseError = result.error;

                if (!supabaseError && data && data.length > 0) {
                    console.log(`📰 ${data.length} nouveaux articles trouvés`);

                    // Ajouter les nouveaux articles au début
                    setNews(prevNews => {
                        const newArticles = data.map(convertArticleFromSupabase);
                        const existingIds = new Set(prevNews.map(n => n.id));
                        const uniqueNewArticles = newArticles.filter(a => !existingIds.has(a.id));

                        // Limiter à 200 articles max
                        const combined = [...uniqueNewArticles, ...prevNews];

                        // ✅ IMPORTANT : Trier par date décroissante
                        combined.sort((a, b) => b.timestamp - a.timestamp);

                        return combined.slice(0, 200);
                    });

                    // Mettre à jour le timestamp
                    lastTimestampRef.current = data[0].published_at;
                }
            } else {
                // Premier chargement ou refresh forcé
                console.log('📥 Chargement initial des articles');

                // ✅ CORRECTION : Ajouter l'ordre par date décroissante
                const result = await db.articles.getAll({
                    limit: 200,
                    orderBy: {
                        column: 'published_at',
                        ascending: false
                    }
                });
                data = result.data;
                supabaseError = result.error;

                if (supabaseError) throw supabaseError;

                // Convertir et définir les articles
                const convertedNews = (data || []).map(convertArticleFromSupabase);

                // ✅ S'assurer que les articles sont triés par date décroissante
                convertedNews.sort((a, b) => b.timestamp - a.timestamp);

                setNews(convertedNews);

                // Garder le timestamp du plus récent
                if (data && data.length > 0) {
                    lastTimestampRef.current = data[0].published_at;
                }

                console.log(`✅ ${convertedNews.length} articles chargés`);

                // DEBUG: Afficher les orientations uniques
                const uniqueOrientations = [...new Set(convertedNews.map(n => n.orientation))];
                console.log('📊 Orientations trouvées:', uniqueOrientations);
            }

            isFirstLoadRef.current = false;

        } catch (err) {
            console.error('❌ Erreur chargement articles:', err);
            setError(err.message);

            // Fallback vers les données mock en cas d'erreur
            if (isFirstLoadRef.current) {
                console.log('📌 Fallback vers les données mock');
                setNews(mockNews);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 🔥 ACTUALISATION TOUTES LES 30 SECONDES
    useEffect(() => {
        // Chargement initial
        loadNews();

        // Rafraîchir toutes les 30 secondes
        if (USE_SUPABASE && isSupabaseConfigured()) {
            const interval = setInterval(() => {
                console.log('⏰ Actualisation automatique...');
                loadNews(false); // Pas de force refresh
            }, 30000); // 30 secondes

            return () => clearInterval(interval);
        }
    }, []); // Dépendances vides pour ne s'exécuter qu'une fois

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

            // Ajouter directement l'article au début de la liste
            const convertedArticle = convertArticleFromSupabase(data);
            setNews(prev => {
                const updated = [convertedArticle, ...prev];
                // ✅ Trier par date décroissante
                updated.sort((a, b) => b.timestamp - a.timestamp);
                return updated.slice(0, 200);
            });

            return convertedArticle;
        } catch (err) {
            console.error('Erreur ajout article:', err);
            setError(err.message);
            throw err;
        }
    }, []);

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
                supabaseUpdates.orientation = updates.orientation;
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

        // ✅ S'assurer que le tri est maintenu
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

    // 🔥 NOUVELLE FONCTION : Forcer le rafraîchissement
    const forceRefresh = useCallback(() => {
        console.log('🔄 Rafraîchissement forcé');
        loadNews(true);
    }, [loadNews]);

    // 🔥 NOUVELLE FONCTION : Obtenir les stats
    const getStats = useCallback(async () => {
        if (!USE_SUPABASE || !isSupabaseConfigured()) {
            return {
                total_articles: news.length,
                active_sources: new Set(news.map(n => n.source)).size
            };
        }

        try {
            const stats = await db.articles.getStats();
            return stats;
        } catch (err) {
            console.error('Erreur stats:', err);
            return {
                total_articles: news.length,
                active_sources: new Set(news.map(n => n.source)).size
            };
        }
    }, [news]);

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

    // 🆕 Fonction helper pour formater les dates en heure locale
    const formatDate = useCallback((dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('fr-FR', {
            timeZone: 'Europe/Paris',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

        // Actions
        loadNews,
        forceRefresh,
        addNews,
        updateNews,
        deleteNews,
        markAsRead,
        setSelectedCategory,
        toggleTag,
        clearTags,
        searchNews,
        getNewsStats,
        getStats,
        formatDate // 🆕 Exposer la fonction de formatage
    };
};

export default useNews;