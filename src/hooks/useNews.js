// src/hooks/useNews.js
// Version Corrigée : Conserve toute la logique avancée, mais pointe vers les bonnes colonnes de la BDD.

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
            // ✅ CORRECTION : La BDD contient 'link', pas 'url'.
            url: article.link,
            orientation: article.orientation || 'neutre',
            category: category,
            tags: article.tags || [],
            // ✅ CORRECTION : La BDD contient 'pubDate', pas 'published_at'.
            timestamp: new Date(article.pubDate).getTime(),
            views: article.views || 0,
            clicks: article.clicks || 0,
            // ✅ CORRECTION : La BDD n'a pas de colonne 'summary'. On utilise le titre comme fallback.
            summary: article.title || '',
            imageUrl: article.image_url,
            // ✅ CORRECTION : On garde la date originale depuis 'pubDate'.
            publishedAt: article.pubDate
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

                // ✅ CORRECTION : Requête directe avec les bons noms de colonnes
                const { data: newData, error: newError } = await db
                    .from('articles')
                    .select('id, title, link, source_name, image_url, pubDate, orientation, tags, views, clicks')
                    .gt('pubDate', lastTimestampRef.current)
                    .order('pubDate', { ascending: false })
                    .limit(50);

                data = newData;
                supabaseError = newError;

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
                    lastTimestampRef.current = data[0].pubDate;
                }
            } else {
                // Premier chargement ou refresh forcé
                console.log('📥 Chargement initial des articles');

                // ✅ CORRECTION : Requête avec les bons noms de colonnes
                const { data: initialData, error: initialError } = await db
                    .from('articles')
                    .select('id, title, link, source_name, image_url, pubDate, orientation, tags, views, clicks')
                    .order('pubDate', { ascending: false })
                    .limit(200);

                data = initialData;
                supabaseError = initialError;

                if (supabaseError) throw supabaseError;

                // Convertir et définir les articles
                const convertedNews = (data || []).map(convertArticleFromSupabase);

                // ✅ S'assurer que les articles sont triés par date décroissante
                convertedNews.sort((a, b) => b.timestamp - a.timestamp);

                setNews(convertedNews);

                // Garder le timestamp du plus récent
                if (data && data.length > 0) {
                    lastTimestampRef.current = data[0].pubDate;
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
            // ✅ CORRECTION : Utiliser les bons noms de colonnes pour l'insertion
            const supabaseArticle = {
                title: newArticle.title,
                link: newArticle.url || `#${Date.now()}`, // ✅ 'link' au lieu de 'url'
                source_name: newArticle.source || 'Admin',
                orientation: newArticle.orientation || 'neutre',
                tags: newArticle.tags || [],
                pubDate: new Date().toISOString(), // ✅ 'pubDate' au lieu de 'published_at'
                views: 0,
                clicks: 0
                // Pas de 'summary' dans la BDD
            };

            const { data, error } = await db
                .from('articles')
                .insert([supabaseArticle])
                .select()
                .single();

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
            // ✅ CORRECTION : Mapper vers les bons noms de colonnes
            const supabaseUpdates = {};

            if (updates.title) supabaseUpdates.title = updates.title;
            if (updates.source) supabaseUpdates.source_name = updates.source;
            if (updates.orientation) {
                supabaseUpdates.orientation = updates.orientation;
            }
            if (updates.tags) supabaseUpdates.tags = updates.tags;
            if (updates.url) supabaseUpdates.link = updates.url; // ✅ 'link' au lieu de 'url'
            // Pas de 'summary' dans la BDD

            const { error } = await db
                .from('articles')
                .update(supabaseUpdates)
                .eq('id', id);

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
            const { error } = await db
                .from('articles')
                .delete()
                .eq('id', id);

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
                    await db
                        .from('articles')
                        .update({ views: (article.views || 0) + 1 })
                        .eq('id', id);
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
            // ✅ CORRECTION : Requête directe pour les stats
            const { data: articlesData, error: articlesError } = await db
                .from('articles')
                .select('id', { count: 'exact' });

            const { data: sourcesData, error: sourcesError } = await db
                .from('articles')
                .select('source_name')
                .limit(1000);

            if (articlesError || sourcesError) {
                throw articlesError || sourcesError;
            }

            const uniqueSources = new Set(sourcesData.map(item => item.source_name));

            return {
                total_articles: articlesData?.length || news.length,
                active_sources: uniqueSources.size
            };
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