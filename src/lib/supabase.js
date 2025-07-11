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
        getAll: async (filters = {}) => {
            if (!supabase) throw new Error('Supabase non configuré');

            let query = supabase
                .from('articles')
                .select('*');

            // 🔥 AJOUT IMPORTANT : Filtrer par les 24 dernières heures
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            query = query.gte('published_at', twentyFourHoursAgo.toISOString());

            // Tri par date décroissante (plus récent en premier)
            query = query.order('published_at', { ascending: false });

            // Appliquer les filtres
            if (filters.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            if (filters.orientation) {
                query = query.eq('orientation', filters.orientation);
            }

            // 🔥 LIMITE RAISONNABLE : 200 au lieu de 1000
            const limit = filters.limit || 200;
            query = query.limit(limit);

            return await query;
        },

        // 🔥 NOUVELLE FONCTION : Récupérer seulement les nouveaux articles
        getNewArticles: async (sinceTimestamp) => {
            if (!supabase) throw new Error('Supabase non configuré');

            let query = supabase
                .from('articles')
                .select('*')
                .gt('published_at', sinceTimestamp)
                .order('published_at', { ascending: false })
                .limit(50); // Max 50 nouveaux articles à la fois

            return await query;
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

        // 🔥 NOUVELLE FONCTION : Obtenir les stats
        getStats: async () => {
            if (!supabase) throw new Error('Supabase non configuré');

            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            const { count: totalCount } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true })
                .gte('published_at', twentyFourHoursAgo.toISOString());

            const { data: sources } = await supabase
                .from('articles')
                .select('source_name')
                .gte('published_at', twentyFourHoursAgo.toISOString());

            const uniqueSources = new Set(sources?.map(s => s.source_name) || []);

            return {
                total_articles: totalCount || 0,
                active_sources: uniqueSources.size
            };
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
                }]);
        },

        getByUser: async (userId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('article_reads')
                .select('*')
                .eq('user_id', userId)
                .order('read_at', { ascending: false });
        }
    },

    // Codes de parrainage
    referralCodes: {
        verify: async (code) => {
            if (!supabase) throw new Error('Supabase non configuré');
            return await supabase
                .from('referral_codes')
                .select('*')
                .eq('code', code)
                .eq('is_active', true)
                .single();
        },

        create: async (userId) => {
            if (!supabase) throw new Error('Supabase non configuré');
            const code = `INF-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
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
        }
    }
};

// Fonction RPC pour incrémenter les vues
export const incrementArticleViews = async (articleId) => {
    if (!supabase) throw new Error('Supabase non configuré');
    return await supabase.rpc('increment_article_views', {
        article_id: articleId
    });
};

// Export par défaut
export default supabase;