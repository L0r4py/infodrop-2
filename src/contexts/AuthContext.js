// src/contexts/AuthContext.js
// VERSION TEMPORAIRE POUR LE DÉVELOPPEMENT (sans envoi d'email)

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();

// Mode développement - À RETIRER EN PRODUCTION
const DEV_MODE = true; // Mettre à false en production

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
            setIsLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');
        setIsLoading(true);

        try {
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            // MODE DEV : Connexion directe avec mot de passe temporaire
            if (DEV_MODE) {
                console.warn("⚠️ MODE DÉVELOPPEMENT ACTIVÉ - Connexion sans email");

                // Si c'est un nouvel utilisateur avec code
                if (normalizedCode) {
                    // Vérifier le code
                    const { data: codeData, error: codeError } = await supabase
                        .from('referral_codes')
                        .select('id, is_active, uses_count, max_uses')
                        .eq('code', normalizedCode)
                        .single();

                    if (codeError || !codeData || !codeData.is_active) {
                        throw new Error("Code d'invitation invalide ou inactif.");
                    }

                    // Créer le compte avec un mot de passe temporaire
                    const tempPassword = 'TempPass123!';
                    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                        email: normalizedEmail,
                        password: tempPassword
                    });

                    if (signUpError && !signUpError.message.includes('already registered')) {
                        throw signUpError;
                    }

                    // Mettre à jour le code
                    await supabase.from('referral_codes').update({
                        uses_count: codeData.uses_count + 1,
                        is_active: (codeData.uses_count + 1) < codeData.max_uses,
                        last_used: new Date().toISOString()
                    }).eq('code', normalizedCode);

                    // Se connecter directement
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                        email: normalizedEmail,
                        password: tempPassword
                    });

                    if (signInError) throw signInError;

                    return {
                        success: true,
                        message: '✅ MODE DEV : Connexion réussie ! (Mot de passe: TempPass123!)'
                    };
                } else {
                    // Connexion simple
                    const { error } = await supabase.auth.signInWithPassword({
                        email: normalizedEmail,
                        password: 'TempPass123!'
                    });

                    if (error) {
                        throw new Error("Compte introuvable ou mot de passe incorrect. En mode dev, utilisez TempPass123!");
                    }

                    return {
                        success: true,
                        message: '✅ MODE DEV : Connexion réussie !'
                    };
                }
            }

            // CODE PRODUCTION (actuellement non fonctionnel à cause des emails)
            // ... (ton code original ici)

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
    };

    const value = {
        user,
        session,
        isAdmin,
        isAuthenticated: !!user,
        isLoading,
        loginOrSignUp,
        logout,
        userEmail: user?.email || null,
        userId: user?.id || null
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;