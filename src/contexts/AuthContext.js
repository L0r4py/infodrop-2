// src/contexts/AuthContext.js
// Version finale, SANS Edge Function. Toute la logique est ici.

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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

    // ✅ LA NOUVELLE FONCTION "CERVEAU", 100% CLIENT-SIDE
    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');
        setIsLoading(true);
        try {
            const normalizedEmail = email.toLowerCase();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            // CAS 1 : L'admin se connecte
            if (normalizedEmail === ADMIN_EMAIL) {
                const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (error) throw error;
                return { success: true, message: "Lien de connexion envoyé à l'admin." };
            }

            // Pour savoir si un utilisateur existe, la seule façon sécurisée est de
            // lui envoyer un lien. S'il existe, il se connecte. S'il n'existe pas,
            // il sera créé, mais il ne pourra pas aller plus loin sans code.
            // ON SIMPLIFIE :

            // Si l'utilisateur fournit un code...
            if (normalizedCode) {
                // On vérifie si le code est valide
                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes')
                    .select('*')
                    .eq('code', normalizedCode)
                    .single();

                if (codeError || !codeData) throw new Error("Code d'invitation invalide.");
                if (!codeData.is_active) throw new Error("Ce code d'invitation a déjà été utilisé.");

                // Le code est bon ! On envoie le lien magique.
                // Supabase va créer le compte s'il n'existe pas.
                const { error: magicLinkError } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (magicLinkError) throw magicLinkError;

                // C'est ici qu'on marquera le code comme utilisé, une fois l'utilisateur connecté.

                return { success: true, message: 'Code valide ! Lien de connexion envoyé.' };
            } else {
                // Pas de code fourni. On tente une connexion simple.
                // Si l'utilisateur n'existe pas, Supabase ne créera PAS de compte car
                // on a activé la protection "Allow new users to sign up" DANS la config Supabase.
                // Il faut s'assurer que cette option est bien DÉCOCHÉE.
                const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (error) throw error;
                return { success: true, message: 'Lien de connexion envoyé.' };
            }

        } catch (error) {
            console.error("Erreur Auth:", error);
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