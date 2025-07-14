// src/hooks/useNews.js
// VERSION FINALE DÉFINITIVE - Boucles infinies corrigées

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const REFRESH_INTERVAL = 30000; // 30 secondes

export const useNews = () => {
    // --- États du hook ---
    const [news, setNews] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedTags, setSelectedTags] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [globalStats, setGlobalStats] = useState({ total_articles: 0, active_sources: 0 });

    const loadingRef = useRef(false);
    const abortControllerRef = useRef(null);

    // --- Fonctions de fetch ---

    const fetchGlobalStats = useCallback(async () => {
        if (!isSupabaseConfigured) return;
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { count: articlesCount } = await supabase.from('articles').select('*', { count: 'exact', head: true }).gte('pubDate', twentyFourHoursAgo);
            const { data: sourcesData } = await supabase.rpc('get_active_sources_count');
            setGlobalStats({ total_articles: articlesCount || 0, active_sources: sourcesData || 0 });
        } catch (err) {
            console.error("Erreur stats globales:", err);
        }
    }, []);

    const loadNews = useCallback(async (isInitialLoad = false) => {
        if (!isSupabaseConfigured) {
            setError("Supabase non configuré.");
            setIsLoading(false);
            return;
        }
        if (loadingRef.current && !isInitialLoad) return;

        loadingRef.current = true;
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        if (isInitialLoad) setIsLoading(true);
        setError(null);

        try {
            const { data, error: supabaseError } = await supabase
                .from('articles')
                .select('*')
                .order('pubDate', { ascending: false })
                .limit(300)
                .abortSignal(abortControllerRef.current.signal);

            if (supabaseError) throw supabaseError;

            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const convertedNews = (data || []).map(article => ({
                id: article.id,
                title: String(article.title || 'Sans titre'),
                source: String(article.source_name || 'Source inconnue'),
                url: String(article.link || '#'),
                orientation: String(article.orientation || 'neutre'),
                category: String(article.category || 'généraliste'),
                tags: Array.isArray(article.tags) ? article.tags.filter(t => typeof t === 'string') : [],
                timestamp: new Date(article.pubDate).getTime(),
                views: Number(article.views) || 0,
                clicks: Number(article.clicks) || 0,
                imageUrl: article.image_url || null,
                publishedAt: article.pubDate,
                guid: article.guid || null
            })).filter(article => article.timestamp > twentyFourHoursAgo);

            setNews(convertedNews);
            await fetchGlobalStats();
        } catch (err) {
            if (err.name !== 'AbortError') setError(err.message);
        } finally {
            loadingRef.current = false;
            setIsLoading(false);
        }
        // ✅ CORRECTION N°1 : `news` est retiré des dépendances pour casser la boucle.
    }, [fetchGlobalStats]);

    // --- useEffect pour le cycle de vie ---
    useEffect(() => {
        if (!isSupabaseConfigured) return;

        let timeoutId;
        const runLoadCycle = (isInitial) => {
            loadNews(isInitial).finally(() => {
                timeoutId = setTimeout(() => runLoadCycle(false), REFRESH_INTERVAL);
            });
        };
        runLoadCycle(true);
        return () => clearTimeout(timeoutId);
    }, [loadNews]);

    // --- Fonctions d'interaction ---

    const markAsRead = useCallback(async (id) => {
        if (!isSupabaseConfigured) return;
        // On met à jour l'état local de manière optimiste
        setNews(prevNews => prevNews.map(item =>
            item.id === id ? { ...item, views: (item.views || 0) + 1 } : item
        ));
        // Puis on appelle la base de données en arrière-plan
        try {
            await supabase.rpc('increment_views', { article_id: id });
        } catch (e) {
            console.warn("Erreur 'increment_views':", e.message); // On ne bloque pas l'UI
        }
        // ✅ CORRECTION N°2 : La dépendance `news` est retirée ici aussi.
    }, []);

    const incrementClicks = useCallback(async (id) => {
        if (!isSupabaseConfigured) return;
        setNews(prevNews => prevNews.map(item =>
            item.id === id ? { ...item, clicks: (item.clicks || 0) + 1 } : item
        ));
        try {
            const { data: article } = await supabase.from('articles').select('clicks').eq('id', id).single();
            if (article) await supabase.from('articles').update({ clicks: (article.clicks || 0) + 1 }).eq('id', id);
        } catch (e) {
            console.warn("Erreur 'incrementClicks':", e.message);
        }
        // ✅ CORRECTION N°3 : La dépendance `news` est retirée ici aussi.
    }, []);

    const forceRefresh = useCallback(() => {
        if (!loadingRef.current) loadNews(true);
    }, [loadNews]);

    // --- Logique de filtrage ---
    const filteredNews = useMemo(() => {
        let filtered = news;
        if (searchTerm) {
            filtered = filtered.filter(item =>
                (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (item.source?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.orientation === selectedCategory);
        }
        if (selectedTags.length > 0) {
            filtered = filtered.filter(item => item.tags?.some(tag => selectedTags.includes(tag)));
        }
        return filtered;
    }, [news, searchTerm, selectedCategory, selectedTags]);

    const allTags = useMemo(() => Array.from(new Set(news.flatMap(item => item.tags || []))).sort(), [news]);
    const toggleTag = useCallback(tag => setSelectedTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]), []);
    const clearTags = useCallback(() => setSelectedTags([]), []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
            if (diffMins < 1) return "À l'instant";
            if (diffMins < 60) return `Il y a ${diffMins} min`;
            const diffHours = Math.floor(diffMins / 60);
            return `Il y a ${diffHours} h`;
        } catch { return ''; }
    }, []);

    // --- Retour du hook ---
    return {
        news,
        filteredNews,
        isLoading,
        error,
        globalStats,
        selectedCategory, setSelectedCategory,
        selectedTags, toggleTag, clearTags, allTags,
        searchTerm, setSearchTerm,
        forceRefresh,
        markAsRead,
        incrementClicks,
        formatDate,
        addNews: async () => console.log("Fonction addNews non implémentée"),
        updateNews: async () => console.log("Fonction updateNews non implémentée"),
        deleteNews: async () => console.log("Fonction deleteNews non implémentée"),
    };
};

export default useNews;