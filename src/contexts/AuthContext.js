// src/contexts/AuthContext.js
// VERSION SIMPLIFIÉE ET ROBUSTE - SANS API EXTERNE

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Liste des emails admin, pourrait être mise dans un .env à l'avenir
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean);

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionLoaded, setSessionLoaded] = useState(false); // Pour savoir si on a vérifié la session au moins une fois
    const [userProfile, setUserProfile] = useState(null); // Pour stocker les données de public.users

    // Fonction pour charger le profil de l'utilisateur depuis la table `users`
    const fetchUserProfile = useCallback(async (userId) => {
        if (!userId) {
            setUserProfile(null);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('users') // Assure-toi que cette table existe et est accessible
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // Si le profil n'existe pas encore, ce n'est pas une erreur bloquante
                if (error.code === 'PGRST116') {
                    console.log("Profil utilisateur non trouvé, c'est normal pour un nouvel utilisateur.");
                } else {
                    throw error;
                }
            }
            setUserProfile(data);
        } catch (error) {
            console.error("Erreur lors de la récupération du profil utilisateur:", error);
            setUserProfile(null);
        }
    }, []);

    // Effet principal pour gérer l'état d'authentification
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.error("Supabase n'est pas configuré. Vérifiez vos variables d'environnement.");
            setIsLoading(false);
            setSessionLoaded(true);
            return;
        }

        // 1. Récupérer la session initiale
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser ? ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()) : false);
            if (currentUser) {
                fetchUserProfile(currentUser.id);
            }
            setSessionLoaded(true);
            setIsLoading(false);
        });

        // 2. Écouter les changements d'état
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser ? ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()) : false);
            if (currentUser) {
                await fetchUserProfile(currentUser.id);
            } else {
                setUserProfile(null); // Nettoyer le profil à la déconnexion
            }
            setIsLoading(false);
        });

        // 3. Nettoyer l'abonnement au démontage
        return () => {
            subscription?.unsubscribe();
        };
    }, [fetchUserProfile]);


    // Fonction de connexion / inscription
    const loginOrSignUp = async (email) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase().trim(),
                options: {
                    // URL de redirection après avoir cliqué sur le lien magique
                    emailRedirectTo: window.location.origin,
                },
            });

            if (error) throw error;

            return { success: true, message: 'Vérifiez vos emails ! Un lien de connexion a été envoyé.' };
        } catch (error) {
            console.error("Erreur avec le lien magique:", error);
            return { success: false, error: error.message || 'Une erreur est survenue.' };
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction de déconnexion
    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        // Le listener onAuthStateChange s'occupera de mettre à jour les états
    };

    const value = {
        // État
        user,
        userProfile, // Rendre le profil accessible
        session,
        isAdmin,
        isAuthenticated: !!user,
        isLoading,
        sessionLoaded,

        // Méthodes
        loginOrSignUp,
        logout,

        // Alias pour la compatibilité (si tu l'utilises ailleurs)
        login: loginOrSignUp,
        signInWithMagicLink: loginOrSignUp, // Alias supplémentaire pour compatibilité

        // Props de compatibilité
        userEmail: user?.email || null,
        userId: user?.id || null,

        // Garder ces propriétés vides pour la compatibilité temporaire
        userInviteData: {
            code: null,
            is_used: false,
            parrainEmail: null,
            filleulEmail: null
        },
        generateInviteCode: async () => null, // Fonction stub temporaire
        STRIPE_LINK: '' // Propriété vide pour compatibilité
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;