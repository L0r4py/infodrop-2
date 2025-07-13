// src/contexts/AuthContext.js
// VERSION FINALE - Avec un cycle de vie d'authentification robuste et simplifié

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Correct : Commence à true

    // ✅ CYCLE DE VIE D'AUTH SIMPLIFIÉ ET ROBUSTE
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setIsLoading(false);
            return;
        }

        // onAuthStateChange est notre SEULE source de vérité.
        // Il se déclenche une fois au début avec la session actuelle (ou null),
        // puis à chaque connexion/déconnexion.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setIsAdmin(currentUser?.email?.toLowerCase() === ADMIN_EMAIL);

                // On arrête le chargement SEULEMENT après avoir reçu cette première information.
                setIsLoading(false);
            }
        );

        // Nettoyage de l'écouteur quand le composant est "démonté"
        return () => {
            subscription?.unsubscribe();
        };
    }, []); // Le tableau de dépendances est vide, pour ne s'exécuter qu'une seule fois.


    // La logique de login est parfaite, on n'y touche pas.
    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');
        setIsLoading(true);
        try {
            const normalizedEmail = email.toLowerCase();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            if (normalizedEmail === ADMIN_EMAIL) {
                const { error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                return { success: true, message: "Lien de connexion envoyé à l'admin." };
            }

            if (normalizedCode) {
                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes')
                    .select('*').eq('code', normalizedCode).single();
                if (codeError || !codeData || !codeData.is_active) {
                    throw new Error("Code d'invitation invalide ou déjà utilisé.");
                }
                const { error: magicLinkError } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (magicLinkError) throw magicLinkError;
                return { success: true, message: 'Code valide ! Lien de connexion envoyé.' };
            } else {
                const { error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                // On pourrait vérifier ici si l'utilisateur existe déjà pour un message plus précis
                return { success: true, message: 'Lien de connexion envoyé.' };
            }
        } catch (error) {
            console.error("Erreur Auth:", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    // La logique de logout est parfaite.
    const logout = async () => {
        if (!isSupabaseConfigured()) return;
        await supabase.auth.signOut();
    };

    // Fonction de connexion avec lien magique (ancienne, on la garde pour compatibilité)
    const signInWithMagicLink = async (email, inviteCode = '') => {
        console.warn('⚠️ signInWithMagicLink est déprécié, utilisez loginOrSignUp');
        return loginOrSignUp(email, inviteCode);
    };

    // La valeur du contexte est parfaite.
    const value = {
        user, session, isAdmin, isAuthenticated: !!user, isLoading,
        loginOrSignUp,
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