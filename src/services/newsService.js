// src/services/newsService.js

import { supabase, db } from '../lib/supabase';
import api from '../lib/api';

// Service pour gérer les actualités
class NewsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Récupérer toutes les actualités
    async getAllNews(filters = {}) {
        try {
            // Vérifier le cache
            const cacheKey = JSON.stringify(filters);
            const cached = this.getFromCache(cacheKey);
            if (cached) return { data: cached, error: null };

            // Si Supabase est configuré, l'utiliser
            if (supabase) {
                const { data, error } = await db.articles.getAll(filters);
                if (!error && data) {
                    this.setCache(cacheKey, data);
                }
                return { data, error };
            }

            // Sinon, utiliser l'API mock
            const result = await api.articles.getAll(filters);
            if (result.data) {
                this.setCache(cacheKey, result.data);
            }
            return result;
        } catch (error) {
            console.error('Erreur lors de la récupération des actualités:', error);
            return { data: null, error: error.message };
        }
    }

    // Récupérer une actualité par ID
    async getNewsById(id) {
        try {
            // Vérifier le cache
            const cacheKey = `article-${id}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) return { data: cached, error: null };

            // Si Supabase est configuré
            if (supabase) {
                const { data, error } = await db.articles.getById(id);
                if (!error && data) {
                    this.setCache(cacheKey, data);
                }
                return { data, error };
            }

            // Sinon, utiliser l'API mock
            const result = await api.articles.getById(id);
            if (result.data) {
                this.setCache(cacheKey, result.data);
            }
            return result;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'article:', error);
            return { data: null, error: error.message };
        }
    }

    // Créer une actualité
    async createNews(article) {
        try {
            // Invalider le cache
            this.clearCache();

            // Si Supabase est configuré
            if (supabase) {
                const user = await supabase.auth.getUser();
                const enrichedArticle = {
                    ...article,
                    user_id: user?.data?.user?.id,
                    created_at: new Date().toISOString(),
                    views: 0
                };
                return await db.articles.create(enrichedArticle);
            }

            // Sinon, utiliser l'API mock
            return await api.articles.create(article);
        } catch (error) {
            console.error('Erreur lors de la création de l\'article:', error);
            return { data: null, error: error.message };
        }
    }

    // Mettre à jour une actualité
    async updateNews(id, updates) {
        try {
            // Invalider le cache
            this.clearCache();
            this.removeFromCache(`article-${id}`);

            // Si Supabase est configuré
            if (supabase) {
                return await db.articles.update(id, updates);
            }

            // Sinon, utiliser l'API mock
            return await api.articles.update(id, updates);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'article:', error);
            return { data: null, error: error.message };
        }
    }

    // Supprimer une actualité
    async deleteNews(id) {
        try {
            // Invalider le cache
            this.clearCache();
            this.removeFromCache(`article-${id}`);

            // Si Supabase est configuré
            if (supabase) {
                return await db.articles.delete(id);
            }

            // Sinon, utiliser l'API mock
            return await api.articles.delete(id);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'article:', error);
            return { data: null, error: error.message };
        }
    }

    // Enregistrer la lecture d'un article
    async recordRead(articleId, userId, orientation) {
        try {
            // Si Supabase est configuré
            if (supabase && userId) {
                // Enregistrer la lecture
                await db.articleReads.create(userId, articleId, orientation);

                // Incrémenter les vues
                await supabase.rpc('increment_article_views', {
                    article_id: articleId
                });

                return { success: true, error: null };
            }

            // Sinon, utiliser l'API mock
            return await api.articles.recordRead(articleId, userId);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la lecture:', error);
            return { success: false, error: error.message };
        }
    }

    // Rechercher des actualités
    async searchNews(query, filters = {}) {
        try {
            if (!query) return this.getAllNews(filters);

            // Si Supabase est configuré
            if (supabase) {
                let searchQuery = supabase
                    .from('articles')
                    .select('*')
                    .or(`title.ilike.%${query}%,source.ilike.%${query}%`)
                    .order('created_at', { ascending: false });

                // Appliquer les filtres
                if (filters.category && filters.category !== 'all') {
                    searchQuery = searchQuery.eq('category', filters.category);
                }
                if (filters.orientation) {
                    searchQuery = searchQuery.eq('orientation', filters.orientation);
                }

                const { data, error } = await searchQuery;
                return { data, error };
            }

            // Sinon, recherche locale
            const { data: allNews } = await this.getAllNews();
            if (!allNews) return { data: [], error: null };

            const lowerQuery = query.toLowerCase();
            const filtered = allNews.filter(item =>
                item.title.toLowerCase().includes(lowerQuery) ||
                item.source.toLowerCase().includes(lowerQuery) ||
                item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
            );

            return { data: filtered, error: null };
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            return { data: null, error: error.message };
        }
    }

    // Obtenir les statistiques
    async getStats() {
        try {
            const { data: articles } = await this.getAllNews();
            if (!articles) return null;

            const stats = {
                total: articles.length,
                byCategory: {},
                byOrientation: {},
                last24h: 0,
                activeSources: new Set()
            };

            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

            articles.forEach(item => {
                // Par catégorie
                stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;

                // Par orientation
                stats.byOrientation[item.orientation] = (stats.byOrientation[item.orientation] || 0) + 1;

                // Sources actives
                stats.activeSources.add(item.source);

                // Dernières 24h
                const timestamp = new Date(item.created_at || item.timestamp).getTime();
                if (timestamp > oneDayAgo) {
                    stats.last24h++;
                }
            });

            stats.activeSources = stats.activeSources.size;

            return stats;
        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
            return null;
        }
    }

    // Méthodes de cache
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    removeFromCache(key) {
        this.cache.delete(key);
    }

    clearCache() {
        this.cache.clear();
    }
}

// Créer une instance unique
const newsService = new NewsService();

export default newsService;