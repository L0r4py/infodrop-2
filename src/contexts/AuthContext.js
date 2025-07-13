// src/contexts/AuthContext.js
// Version finale, connectée à Supabase

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Créer le contexte
const AuthContext = createContext(null);

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
                    setIsAdmin(currentUser?.email === 'l0r4.py@gmail.com');
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
                setIsAdmin(currentUser?.email === 'l0r4.py@gmail.com');

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

    // Fonction de connexion avec lien magique
    const signInWithMagicLink = async (email) => {
        if (!isSupabaseConfigured()) {
            throw new Error('Supabase non configuré');
        }

        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    // URL de redirection après connexion
                    emailRedirectTo: window.location.origin,
                    // Données supplémentaires (optionnel)
                    data: {
                        source: 'infodrop'
                    }
                }
            });

            if (error) throw error;

            console.log('📧 Lien magique envoyé à:', email);
            return { success: true };

        } catch (error) {
            console.error("❌ Erreur lors de l'envoi du lien magique:", error);
            return {
                success: false,
                error: error.message || "Erreur lors de l'envoi du lien"
            };
        } finally {
            setIsLoading(false);
        }
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
        signInWithMagicLink,
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