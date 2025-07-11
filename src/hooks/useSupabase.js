// src/hooks/useSupabase.js

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialiser le client Supabase (les variables seront dans .env.local)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Hook personnalisé pour Supabase
export const useSupabase = () => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Vérifier la session au chargement
    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Obtenir la session actuelle
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Écouter les changements d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Connexion
    const signIn = useCallback(async (email, password) => {
        if (!supabase) return { error: { message: 'Supabase non configuré' } };

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        return { data, error };
    }, []);

    // Inscription
    const signUp = useCallback(async (email, password, referralCode) => {
        if (!supabase) return { error: { message: 'Supabase non configuré' } };

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    referral_code: referralCode,
                    referred_by: referralCode || null
                }
            }
        });

        return { data, error };
    }, []);

    // Déconnexion
    const signOut = useCallback(async () => {
        if (!supabase) return { error: { message: 'Supabase non configuré' } };

        const { error } = await supabase.auth.signOut();
        return { error };
    }, []);

    // Récupérer les articles
    const getArticles = useCallback(async (filters = {}) => {
        if (!supabase) return { data: [], error: { message: 'Supabase non configuré' } };

        let query = supabase
            .from('articles')
            .select('*')
            .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (filters.category && filters.category !== 'all') {
            query = query.eq('category', filters.category);
        }

        if (filters.orientation) {
            query = query.eq('orientation', filters.orientation);
        }

        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;
        return { data: data || [], error };
    }, []);

    // Ajouter un article
    const addArticle = useCallback(async (article) => {
        if (!supabase) return { error: { message: 'Supabase non configuré' } };

        const { data, error } = await supabase
            .from('articles')
            .insert([{
                ...article,
                created_at: new Date().toISOString(),
                user_id: user?.id
            }])
            .select()
            .single();

        return { data, error };
    }, [user]);

    // Mettre à jour un article
    const updateArticle = useCallback(async (id, updates) => {
        if (!supabase) return { error: { message: 'Supabase non configuré' } };

        const { data, error } = await supabase
            .from('articles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    }, []);

    // Supprimer un article
    const deleteArticle = useCallback(async (id) => {
        if (!supabase) return { error: { message: 'Supabase non configuré' } };

        const { error } = await supabase
            .from('articles')
            .delete()
            .eq('id', id);

        return { error };
    }, []);

    // Enregistrer la lecture d'un article
    const recordArticleRead = useCallback(async (articleId, orientation) => {
        if (!supabase || !user) return { error: { message: 'Non connecté' } };

        // Enregistrer dans la table article_reads
        const { error: readError } = await supabase
            .from('article_reads')
            .insert([{
                user_id: user.id,
                article_id: articleId,
                orientation: orientation,
                read_at: new Date().toISOString()
            }]);

        if (readError) return { error: readError };

        // Incrémenter le compteur de vues
        const { error: viewError } = await supabase.rpc('increment_article_views', {
            article_id: articleId
        });

        return { error: viewError };
    }, [user]);

    // Récupérer les stats utilisateur
    const getUserStats = useCallback(async () => {
        if (!supabase || !user) return { data: null, error: { message: 'Non connecté' } };

        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        return { data, error };
    }, [user]);

    // Mettre à jour les stats utilisateur
    const updateUserStats = useCallback(async (stats) => {
        if (!supabase || !user) return { error: { message: 'Non connecté' } };

        const { data, error } = await supabase
            .from('user_stats')
            .upsert({
                user_id: user.id,
                ...stats,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        return { data, error };
    }, [user]);

    // Vérifier le code de parrainage
    const checkReferralCode = useCallback(async (code) => {
        if (!supabase) return { valid: false, error: { message: 'Supabase non configuré' } };

        const { data, error } = await supabase
            .from('referral_codes')
            .select('*')
            .eq('code', code)
            .eq('is_active', true)
            .single();

        return { valid: !!data, data, error };
    }, []);

    return {
        // État
        user,
        session,
        loading,
        isAuthenticated: !!user,

        // Auth
        signIn,
        signUp,
        signOut,

        // Articles
        getArticles,
        addArticle,
        updateArticle,
        deleteArticle,
        recordArticleRead,

        // Stats
        getUserStats,
        updateUserStats,

        // Parrainage
        checkReferralCode,

        // Client Supabase (au cas où)
        supabase
    };
};

export default useSupabase;