// Fichier : /src/hooks/useNews.js
// Correction : Remplacement de l'export par défaut par un export nommé.

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// CHANGEMENT 1 : Le mot "export" est ajouté ici
export const useNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: 'all',
        orientation: null,
        tags: [],
        limit: 500 // Augmenter la limite
    });

    // Référence pour stocker le timestamp du dernier fetch
    const lastFetchTime = useRef(null);
    const fetchInterval = useRef(null);

    // Fonction pour transformer les données
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

    // Fonction pour charger les articles initiaux (2 dernières heures)
    const loadInitialArticles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Calculer le timestamp d'il y a 2 heures
            const twoHoursAgo = new Date();
            twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

            console.log('📥 Chargement initial des articles depuis:', twoHoursAgo.toLocaleString());

            // Construire la requête
            let query = supabase
                .from('articles')
                .select('*')
                .gte('published_at', twoHoursAgo.toISOString())
                .order('published_at', { ascending: false });

            // Appliquer les filtres
            if (filters.category && filters.category !== 'all') {
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

            // Limiter les résultats
            query = query.limit(filters.limit);

            // Exécuter la requête
            const { data, error: fetchError } = await query;

            if (fetchError) {
                throw fetchError;
            }

            // Transformer et définir les articles
            const transformedData = (data || []).map(transformArticle);
            setNews(transformedData);

            // Sauvegarder le timestamp du dernier fetch
            lastFetchTime.current = new Date();

            console.log(`✅ ${transformedData.length} articles chargés initialement`);

        } catch (err) {
            console.error('❌ Erreur chargement initial:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Fonction pour récupérer seulement les nouveaux articles
    const fetchNewArticles = useCallback(async () => {
        try {
            if (!lastFetchTime.current) return;

            const since = lastFetchTime.current.toISOString();
            console.log('🔄 Recherche de nouveaux articles depuis:', lastFetchTime.current.toLocaleString());

            // Requête pour les nouveaux articles seulement
            let query = supabase
                .from('articles')
                .select('*')
                .gt('published_at', since)
                .order('published_at', { ascending: false });

            // Appliquer les mêmes filtres
            if (filters.category && filters.category !== 'all') {
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

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.error('❌ Erreur récupération nouveaux articles:', fetchError);
                return;
            }

            if (data && data.length > 0) {
                console.log(`📰 ${data.length} nouveaux articles trouvés`);

                // Transformer les nouveaux articles
                const newArticles = data.map(transformArticle);

                // Ajouter les nouveaux articles au début, en évitant les doublons
                setNews(prevNews => {
                    const existingIds = new Set(prevNews.map(article => article.id));
                    const uniqueNewArticles = newArticles.filter(article => !existingIds.has(article.id));

                    // Limiter le nombre total d'articles pour éviter la surcharge mémoire
                    const combined = [...uniqueNewArticles, ...prevNews];
                    const limited = combined.slice(0, 1000); // Garder max 1000 articles

                    return limited;
                });
            }

            // Mettre à jour le timestamp
            lastFetchTime.current = new Date();

        } catch (err) {
            console.error('❌ Erreur fetch nouveaux articles:', err);
        }
    }, [filters]);

    // Charger les articles initiaux au montage
    useEffect(() => {
        loadInitialArticles();
    }, [loadInitialArticles]);

    // Configurer l'intervalle de mise à jour (30 minutes)
    useEffect(() => {
        // Nettoyer l'ancien intervalle
        if (fetchInterval.current) {
            clearInterval(fetchInterval.current);
        }

        // Créer un nouvel intervalle de 30 minutes
        fetchInterval.current = setInterval(() => {
            console.log('⏰ Mise à jour automatique des articles...');
            fetchNewArticles();
        }, 30 * 60 * 1000); // 30 minutes

        // Nettoyer à la destruction
        return () => {
            if (fetchInterval.current) {
                clearInterval(fetchInterval.current);
            }
        };
    }, [fetchNewArticles]);

    // S'abonner aux changements en temps réel
    useEffect(() => {
        // Créer un canal pour les insertions en temps réel
        const channel = supabase
            .channel('realtime-articles')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'articles'
                },
                (payload) => {
                    console.log('🆕 Article en temps réel:', payload.new.title);

                    // Transformer et ajouter l'article
                    const newArticle = transformArticle(payload.new);

                    // Vérifier si l'article correspond aux filtres actuels
                    let shouldAdd = true;

                    if (filters.category && filters.category !== 'all') {
                        shouldAdd = newArticle.category === filters.category;
                    }

                    if (shouldAdd && filters.orientation) {
                        shouldAdd = newArticle.orientation === filters.orientation;
                    }

                    if (shouldAdd && filters.tags && filters.tags.length > 0) {
                        shouldAdd = filters.tags.some(tag => newArticle.tags.includes(tag));
                    }

                    if (shouldAdd) {
                        setNews(prev => {
                            // Éviter les doublons
                            if (prev.some(article => article.id === newArticle.id)) {
                                return prev;
                            }

                            // Ajouter au début et limiter
                            const updated = [newArticle, ...prev];
                            return updated.slice(0, 1000);
                        });
                    }
                }
            )
            .subscribe();

        // Nettoyer l'abonnement
        return () => {
            supabase.removeChannel(channel);
        };
    }, [filters]);

    // Fonction pour rafraîchir manuellement
    const refresh = useCallback(async () => {
        console.log('🔄 Rafraîchissement manuel...');
        await loadInitialArticles();
    }, [loadInitialArticles]);

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

        const last24h = news.filter(item => {
            const articleTime = new Date(item.publishedAt).getTime();
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return articleTime > dayAgo;
        }).length;

        return {
            total,
            last24h,
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
        getStats,
        lastUpdate: lastFetchTime.current
    };
};

// CHANGEMENT 2 : La ligne "export default" est supprimée d'ici.