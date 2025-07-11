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
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.category && filters.category !== 'all') {
                query = query.eq('category', filters.category);
            }
            if (filters.orientation) {
                query = query.eq('orientation', filters.orientation);
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

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