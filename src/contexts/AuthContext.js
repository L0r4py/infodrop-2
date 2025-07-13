// src/contexts/AuthContext.js
// Version finale, connectée à Supabase

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Créer le contexte
const AuthContext = createContext(null);

// Email admin depuis les variables d'environnement
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase() || 'admin@example.com';

// Log pour vérifier que la variable est bien chargée (à retirer en production)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Admin email configuré:', ADMIN_EMAIL);
}

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

// Provider du contexte
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Commence à true

    // Écouter les changements d'état de l'authentification
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase non configuré - Mode démo activé');
            setIsLoading(false);
            return;
        }

        // 1. Récupérer la session existante au chargement
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Erreur récupération session:', error);
                } else {
                    setSession(session);
                    const currentUser = session?.user;
                    setUser(currentUser ?? null);
                    // Vérifier si l'utilisateur est admin
                    setIsAdmin(currentUser?.email?.toLowerCase() === ADMIN_EMAIL);
                }
            } catch (error) {
                console.error('Erreur initialisation auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // 2. Écouter les changements en temps réel (connexion, déconnexion)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('🔄 Auth state change:', event);

                setSession(session);
                const currentUser = session?.user;
                setUser(currentUser ?? null);
                setIsAdmin(currentUser?.email?.toLowerCase() === ADMIN_EMAIL);

                // Gérer les différents événements
                switch (event) {
                    case 'SIGNED_IN':
                        console.log('✅ Utilisateur connecté:', currentUser?.email);
                        break;
                    case 'SIGNED_OUT':
                        console.log('👋 Utilisateur déconnecté');
                        break;
                    case 'TOKEN_REFRESHED':
                        console.log('🔄 Token rafraîchi');
                        break;
                    case 'USER_UPDATED':
                        console.log('👤 Profil utilisateur mis à jour');
                        break;
                }

                setIsLoading(false);
            }
        );

        // Nettoyage de l'écouteur
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // ✅ NOUVELLE FONCTION "CERVEAU" - loginOrSignUp
    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');

        setIsLoading(true);
        try {
            const normalizedEmail = email.toLowerCase();
            const normalizedCode = inviteCode?.toUpperCase().trim() || '';

            // CAS 1 : L'utilisateur est l'admin
            if (normalizedEmail === ADMIN_EMAIL) {
                console.log("🔑 Connexion de l'admin...");
                const { error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                return { success: true, message: "Lien de connexion envoyé à l'admin." };
            }

            // Pour les autres, on appelle la fonction Edge
            console.log("🔍 Vérification de l'utilisateur...");

            const { data, error } = await supabase.functions.invoke('auth-flow', {
                body: {
                    email: normalizedEmail,
                    inviteCode: normalizedCode
                },
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.message);

            // Si la fonction serveur demande d'envoyer le magic link
            if (data.action === 'send_magic_link') {
                console.log("📧 Envoi du lien magique...");
                const { error: linkError } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });

                if (linkError) throw linkError;

                return {
                    success: true,
                    message: "Lien de connexion envoyé ! Consultez votre boîte mail."
                };
            }

            return { success: true, message: data.message };

        } catch (error) {
            console.error("❌ Erreur Auth:", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction de connexion avec lien magique (ancienne, on la garde pour compatibilité)
    const signInWithMagicLink = async (email, inviteCode = '') => {
        console.warn('⚠️ signInWithMagicLink est déprécié, utilisez loginOrSignUp');
        return loginOrSignUp(email, inviteCode);
    };

    // Fonction de déconnexion
    const logout = async () => {
        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase non configuré');
            return;
        }

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('❌ Erreur déconnexion:', error);
                throw error;
            }

            // Réinitialiser les états locaux
            setUser(null);
            setSession(null);
            setIsAdmin(false);

            console.log('👋 Déconnexion réussie');

        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            // Forcer la réinitialisation même en cas d'erreur
            setUser(null);
            setSession(null);
            setIsAdmin(false);
        }
    };

    // Valeur du contexte
    const value = {
        // États
        user,
        session,
        isAdmin,
        isAuthenticated: !!user,
        isLoading,

        // Actions
        loginOrSignUp,      // ✅ Nouvelle fonction principale
        signInWithMagicLink, // Gardée pour compatibilité
        logout,

        // Helpers
        userEmail: user?.email || null,
        userId: user?.id || null
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;