// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Vérifier que les variables sont définies
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Variables Supabase manquantes. Assurez-vous de configurer REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY dans .env.local');
}

// Créer le client Supabase
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
    : null;

// Helper pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
    return !!supabase;
};

// Test de connexion
export const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('sources')
            .select('count', { count: 'exact' })
            .limit(1);

        if (error) {
            console.error('Erreur de connexion Supabase:', error);
            return false;
        }

        console.log('✅ Connexion Supabase réussie !');
        return true;
    } catch (err) {
        console.error('Erreur:', err);
        return false;
    }
};

// Helpers pour l'authentification
export const auth = {
    // Obtenir la session actuelle
    getSession: async () => {
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    },

    // Obtenir l'utilisateur actuel
    getUser: async () => {
        if (!supabase) return null;
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // Se connecter
    signIn: async (email, password) => {
        if (!supabase) throw new Error('Supabase non configuré');
        return await supabase.auth.signInWithPassword({ email, password });
    },

    // S'inscrire
    signUp: async (email, password, metadata = {}) => {
        if (!supabase) throw new Error('Supabase non configuré');
        return await supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });
    },

    // Se déconnecter
    signOut: async () => {
        if (!supabase) throw new Error('Supabase non configuré');
        return await supabase.auth.signOut();
    },

    // Écouter les changements d'auth
    onAuthStateChange: (callback) => {
        if (!supabase) return null;
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Helpers pour la base de données
export const db = {
    // Articles
    articles: {
        getAll: async (options = {}) => {
            if (!supabase) throw new Error('Supabase non configuré');

            let query = supabase
                .from('articles')
                .select('*');

            // 🔥 AJOUT IMPORTANT : Filtrer par les 24 dernières heures par défaut
            if (options.includeOld !== true) {
                const twentyFourHoursAgo = new Date();
                twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
                query = query.gte('published_at', twentyFourHoursAgo.toISOString());
            }

            // Appliquer le tri (support de l'option orderBy)
            if (options.orderBy) {
                query = query.order(options.orderBy.column, {
                    ascending: options.orderBy.ascending ?? false
                });
            } else {
                // Tri par défaut : plus récent en premier
                query = query.order('published_at', { ascending: false });
            }

            // Appliquer les filtres
            if (options.category && options.category !== 'all') {
                query = query.eq('category', options.category);
            }
            if (options.orientation) {
                query = query.eq('orientation', options.orientation);
            }
            if (options.source) {
                query = query.eq('source_name', options.source);
            }
            if (options.tags && options.tags.length > 0) {
                query = query.contains('tags', options.tags);
            }

            // Limite (200 par défaut)
            const limit = options.limit || 200;
            query = query.limit(limit);

            return await query;
        },

        // 🔥 NOUVELLE FONCTION : Récupérer seulement les nouveaux articles
        getNewArticles: async (sinceTimestamp) => {
            if (!supabase) throw new Error('Supabase non configuré');

            return await supabase
                .from('articles')
                .select('*')
                .gt('published_at', sinceTimestamp)
                .order('published_at', { ascending: false })
                .limit(50); // Max 50 nouveaux articles à la fois
        },

        getById: async (id) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('articles')
                .select('*')
                .eq('id', id)
                .single();
        },

        create: async (article) => {
            if (!supabase) throw new Error('Supabase non configuré');

            // S'assurer que published_at est défini
            if (!article.published_at) {
                article.published_at = new Date().toISOString();
            }

            return await supabase
                .from('articles')
                .insert([article])
                .select()
                .single();
        },

        update: async (id, updates) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('articles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
        },

        delete: async (id) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('articles')
                .delete()
                .eq('id', id);
        },

        // 🔥 NOUVELLE FONCTION : Incrémenter les vues
        incrementViews: async (id) => {
            if (!supabase) throw new Error('Supabase non configuré');

            const { data: article } = await supabase
                .from('articles')
                .select('views')
                .eq('id', id)
                .single();

            if (article) {
                return await supabase
                    .from('articles')
                    .update({ views: (article.views || 0) + 1 })
                    .eq('id', id);
            }
        },

        // 🔥 NOUVELLE FONCTION : Obtenir les stats
        getStats: async () => {
            if (!supabase) throw new Error('Supabase non configuré');

            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            // Total des articles des 24 dernières heures
            const { count: totalCount } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true })
                .gte('published_at', twentyFourHoursAgo.toISOString());

            // Sources uniques actives
            const { data: sources } = await supabase
                .from('articles')
                .select('source_name')
                .gte('published_at', twentyFourHoursAgo.toISOString());

            const uniqueSources = new Set(sources?.map(s => s.source_name) || []);

            // Stats par orientation
            const { data: orientations } = await supabase
                .from('articles')
                .select('orientation')
                .gte('published_at', twentyFourHoursAgo.toISOString());

            const orientationCounts = {};
            orientations?.forEach(item => {
                const orientation = item.orientation || 'neutre';
                orientationCounts[orientation] = (orientationCounts[orientation] || 0) + 1;
            });

            return {
                total_articles: totalCount || 0,
                active_sources: uniqueSources.size,
                by_orientation: orientationCounts
            };
        },

        // 🔥 NOUVELLE FONCTION : Nettoyer les anciens articles
        cleanOldArticles: async (hoursToKeep = 24) => {
            if (!supabase) throw new Error('Supabase non configuré');

            const cutoffDate = new Date();
            cutoffDate.setHours(cutoffDate.getHours() - hoursToKeep);

            return await supabase
                .from('articles')
                .delete()
                .lt('published_at', cutoffDate.toISOString());
        }
    },

    // Sources RSS
    sources: {
        getAll: async (filters = {}) => {
            if (!supabase) throw new Error('Supabase non configuré');

            let query = supabase
                .from('sources')
                .select('*')
                .order('name');

            if (filters.orientation) {
                query = query.eq('orientation', filters.orientation);
            }
            if (filters.active !== undefined) {
                query = query.eq('active', filters.active);
            }

            return await query;
        },

        getById: async (id) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('sources')
                .select('*')
                .eq('id', id)
                .single();
        },

        getByOrientation: async (orientation) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('sources')
                .select('*')
                .eq('orientation', orientation)
                .eq('active', true)
                .order('name');
        },

        update: async (id, updates) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('sources')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
        },

        toggleActive: async (id) => {
            if (!supabase) throw new Error('Supabase non configuré');

            const { data: source } = await supabase
                .from('sources')
                .select('active')
                .eq('id', id)
                .single();

            if (source) {
                return await supabase
                    .from('sources')
                    .update({ active: !source.active })
                    .eq('id', id)
                    .select()
                    .single();
            }
        }
    },

    // Stats utilisateur
    userStats: {
        get: async (userId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', userId)
                .single();
        },

        upsert: async (userId, stats) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('user_stats')
                .upsert({
                    user_id: userId,
                    ...stats,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();
        },

        incrementIP: async (userId, points) => {
            if (!supabase) throw new Error('Supabase non configuré');

            const { data: stats } = await supabase
                .from('user_stats')
                .select('ip')
                .eq('user_id', userId)
                .single();

            if (stats) {
                return await supabase
                    .from('user_stats')
                    .update({ ip: (stats.ip || 0) + points })
                    .eq('user_id', userId)
                    .select()
                    .single();
            }
        }
    },

    // Lectures d'articles
    articleReads: {
        create: async (userId, articleId, orientation) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('article_reads')
                .insert([{
                    user_id: userId,
                    article_id: articleId,
                    orientation: orientation,
                    read_at: new Date().toISOString()
                }])
                .select()
                .single();
        },

        getByUser: async (userId, limit = 100) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('article_reads')
                .select('*, articles(*)')
                .eq('user_id', userId)
                .order('read_at', { ascending: false })
                .limit(limit);
        },

        checkIfRead: async (userId, articleId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            const { data } = await supabase
                .from('article_reads')
                .select('id')
                .eq('user_id', userId)
                .eq('article_id', articleId)
                .single();

            return !!data;
        }
    },

    // Codes de parrainage
    referralCodes: {
        verify: async (code) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('referral_codes')
                .select('*, user:user_id(email)')
                .eq('code', code)
                .eq('is_active', true)
                .single();
        },

        create: async (userId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            const code = `INF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            return await supabase
                .from('referral_codes')
                .insert([{
                    user_id: userId,
                    code: code,
                    is_active: true,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();
        },

        incrementUses: async (code) => {
            if (!supabase) throw new Error('Supabase non configuré');

            const { data: referral } = await supabase
                .from('referral_codes')
                .select('uses_count, max_uses')
                .eq('code', code)
                .single();

            if (referral && referral.uses_count < referral.max_uses) {
                return await supabase
                    .from('referral_codes')
                    .update({
                        uses_count: referral.uses_count + 1,
                        is_active: referral.uses_count + 1 < referral.max_uses
                    })
                    .eq('code', code);
            }
        }
    },

    // Badges et achievements
    badges: {
        getAll: async () => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('badges')
                .select('*')
                .order('cost');
        },

        getUserBadges: async (userId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('user_badges')
                .select('*, badge:badge_id(*)')
                .eq('user_id', userId);
        },

        purchase: async (userId, badgeId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('user_badges')
                .insert([{
                    user_id: userId,
                    badge_id: badgeId,
                    purchased_at: new Date().toISOString()
                }])
                .select()
                .single();
        }
    },

    achievements: {
        getAll: async () => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('achievements')
                .select('*')
                .order('points');
        },

        getUserAchievements: async (userId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('user_achievements')
                .select('*, achievement:achievement_id(*)')
                .eq('user_id', userId);
        },

        unlock: async (userId, achievementId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('user_achievements')
                .insert([{
                    user_id: userId,
                    achievement_id: achievementId,
                    unlocked_at: new Date().toISOString()
                }])
                .select()
                .single();
        }
    }
};

// Fonction RPC pour incrémenter les vues (si elle existe)
export const incrementArticleViews = async (articleId) => {
    if (!supabase) throw new Error('Supabase non configuré');

    try {
        return await supabase.rpc('increment_article_views', {
            article_id: articleId
        });
    } catch (error) {
        // Si la fonction RPC n'existe pas, utiliser la méthode standard
        return await db.articles.incrementViews(articleId);
    }
};

// Fonction pour obtenir les stats globales
export const getGlobalStats = async () => {
    if (!supabase) throw new Error('Supabase non configuré');

    try {
        const { data, error } = await supabase.rpc('get_global_stats');
        if (error) throw error;
        return data;
    } catch (error) {
        // Fallback si la fonction RPC n'existe pas
        const articleStats = await db.articles.getStats();
        const { count: totalSources } = await supabase
            .from('sources')
            .select('*', { count: 'exact', head: true })
            .eq('active', true);

        const { count: totalUsers } = await supabase
            .from('user_stats')
            .select('*', { count: 'exact', head: true });

        return {
            total_articles: articleStats.total_articles,
            total_sources: totalSources || 0,
            total_users: totalUsers || 0,
            articles_last_24h: articleStats.total_articles
        };
    }
};

// Export par défaut
export default supabase;