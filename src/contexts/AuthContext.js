// src/contexts/AuthContext.js
// Version corrigée basée sur la logique V1 - Utilise uniquement signInWithOtp

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();

// Log pour vérifier que la variable est bien chargée (à retirer en production)
if (process.env.NODE_ENV === 'development') {
    console.log('Admin email configuré:', ADMIN_EMAIL);
}

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
    const [rateLimitEndTime, setRateLimitEndTime] = useState(null);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.warn('Supabase non configuré - Mode démo activé');
            setIsLoading(false);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state change:', event);
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser?.email?.toLowerCase() === ADMIN_EMAIL);

            // Gérer le code après connexion réussie
            if (event === 'SIGNED_IN' && currentUser) {
                handlePostSignIn(currentUser);
            }

            setIsLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    // Fonction pour marquer le code comme utilisé après connexion
    const handlePostSignIn = async (user) => {
        const pendingCode = sessionStorage.getItem('pending_invite_code');
        const pendingEmail = sessionStorage.getItem('pending_invite_email');

        if (!pendingCode || !pendingEmail) return;

        try {
            // Marquer le code comme utilisé
            const { error } = await supabase
                .from('referral_codes')
                .update({
                    uses_count: supabase.raw('uses_count + 1'),
                    is_active: supabase.raw('case when uses_count + 1 >= max_uses then false else true end')
                })
                .eq('code', pendingCode);

            if (!error) {
                console.log('Code marqué comme utilisé:', pendingCode);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du code:', error);
        } finally {
            sessionStorage.removeItem('pending_invite_code');
            sessionStorage.removeItem('pending_invite_email');
        }
    };

    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');
        setIsLoading(true);

        try {
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            console.log('Tentative de connexion pour:', normalizedEmail);

            // CAS 1 : Admin - connexion directe
            if (normalizedEmail === ADMIN_EMAIL) {
                console.log("Connexion admin...");
                const { data, error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });

                console.log('Résultat admin:', { data, error });

                if (error) throw error;
                return { success: true, message: "Lien de connexion envoyé à l'admin." };
            }

            // CAS 2 : Utilisateur normal
            // Si code fourni = nouvel utilisateur probable
            if (normalizedCode) {
                console.log("Vérification du code:", normalizedCode);

                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes')
                    .select('*')
                    .eq('code', normalizedCode)
                    .single();

                if (codeError || !codeData) {
                    throw new Error("Code d'invitation invalide.");
                }

                if (!codeData.is_active) {
                    throw new Error("Ce code d'invitation n'est plus actif.");
                }

                if (codeData.uses_count >= codeData.max_uses) {
                    throw new Error("Ce code a atteint sa limite d'utilisations.");
                }

                // Stocker le code pour le marquer comme utilisé après connexion
                sessionStorage.setItem('pending_invite_code', normalizedCode);
                sessionStorage.setItem('pending_invite_email', normalizedEmail);
            }

            // TOUJOURS utiliser signInWithOtp (jamais signUp)
            console.log("Envoi du magic link pour:", normalizedEmail);
            const { data, error } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: {
                    emailRedirectTo: window.location.origin
                    // On retire shouldCreateUser qui cause des problèmes
                }
            });

            console.log('Résultat signInWithOtp:', { data, error });

            if (error) {
                // Nettoyer en cas d'erreur
                sessionStorage.removeItem('pending_invite_code');
                sessionStorage.removeItem('pending_invite_email');

                // Gérer l'erreur de rate limiting
                if (error.message?.includes('For security purposes')) {
                    const seconds = error.message.match(/(\d+) seconds/)?.[1] || '60';
                    throw new Error(`Trop de tentatives. Veuillez attendre ${seconds} secondes avant de réessayer.`);
                }

                // Si l'erreur indique que l'user n'existe pas et pas de code
                if (!normalizedCode && (error.message?.includes('not found') || error.message?.includes('not exist'))) {
                    throw new Error("Aucun compte trouvé. Un code d'invitation est requis pour créer un compte.");
                }
                throw error;
            }

            return {
                success: true,
                message: normalizedCode ?
                    'Code valide ! Vérifiez votre boîte mail.' :
                    'Lien de connexion envoyé !'
            };

        } catch (error) {
            console.error("Erreur Auth:", error);
            return {
                success: false,
                error: error.message || "Une erreur est survenue"
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (!isSupabaseConfigured()) return;
        await supabase.auth.signOut();
        sessionStorage.removeItem('pending_invite_code');
        sessionStorage.removeItem('pending_invite_email');
    };

    // Fonction de connexion avec lien magique (ancienne, on la garde pour compatibilité)
    const signInWithMagicLink = async (email, inviteCode = '') => {
        console.warn('signInWithMagicLink est déprécié, utilisez loginOrSignUp');
        return loginOrSignUp(email, inviteCode);
    };

    const value = {
        user,
        session,
        isAdmin,
        isAuthenticated: !!user,
        isLoading,
        loginOrSignUp,
        signInWithMagicLink, // Gardée pour compatibilité
        logout,
        // Helpers
        userEmail: user?.email || null,
        userId: user?.id || null
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;