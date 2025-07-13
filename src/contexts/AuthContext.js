// src/contexts/AuthContext.js
// Version finale, qui implémente la logique de la V1 (la bonne)

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();

// Log pour vérifier que la variable est bien chargée (à retirer en production)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Admin email configuré:', ADMIN_EMAIL);
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

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase non configuré - Mode démo activé');
            setIsLoading(false);
            return;
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state change:', event);
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser?.email?.toLowerCase() === ADMIN_EMAIL);
            setIsLoading(false);
        });
        return () => subscription?.unsubscribe();
    }, []);

    // La logique finale, qui respecte le flux d'inscription et de connexion
    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');
        setIsLoading(true);
        try {
            const normalizedEmail = email.toLowerCase();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            // L'admin se connecte toujours avec un lien magique, sans code
            if (normalizedEmail === ADMIN_EMAIL) {
                const { error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                return { success: true, message: "Lien de connexion pour l'admin envoyé." };
            }

            // Si un code est fourni, on traite ça comme une tentative d'inscription
            if (normalizedCode) {
                // 1. Vérifier le code dans notre table 'invitation_codes'
                const { data: codeData, error: codeError } = await supabase
                    .from('invitation_codes') // Ta table s'appelle invitation_codes
                    .select('is_used')
                    .eq('code', normalizedCode)
                    .single();

                if (codeError || !codeData) throw new Error("Code d'invitation invalide.");
                if (codeData.is_used) throw new Error("Ce code d'invitation a déjà été utilisé.");

                // 2. Si le code est bon, on lance l'inscription Supabase
                const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    // On ne met pas de mot de passe, Supabase va gérer avec l'email de confirmation
                    password: Math.random().toString(36).slice(-8), // Génère un mdp aléatoire temporaire
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });

                if (signUpError) throw signUpError;

                // Si l'inscription réussit, Supabase envoie l'email de confirmation.
                // On peut maintenant lier l'utilisation du code au nouvel utilisateur
                await supabase.from('invitation_codes').update({
                    is_used: true,
                    used_by_email: normalizedEmail,
                    used_at: new Date().toISOString()
                }).eq('code', normalizedCode);

                return { success: true, message: 'Inscription réussie ! Veuillez consulter votre email pour confirmer votre compte.' };

            } else {
                // Pas de code : c'est une tentative de connexion pour un utilisateur existant
                const { error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw new Error(error.message);
                return { success: true, message: 'Lien de connexion envoyé.' };
            }
        } catch (error) {
            console.error("Erreur Auth:", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (!isSupabaseConfigured()) return;
        await supabase.auth.signOut();
    };

    // Fonction de connexion avec lien magique (ancienne, on la garde pour compatibilité)
    const signInWithMagicLink = async (email, inviteCode = '') => {
        console.warn('⚠️ signInWithMagicLink est déprécié, utilisez loginOrSignUp');
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