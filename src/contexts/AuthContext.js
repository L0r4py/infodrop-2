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
        // ... (la partie qui écoute onAuthStateChange est parfaite)
    }, []);

    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');
        setIsLoading(true);
        try {
            const normalizedEmail = email.toLowerCase();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            if (normalizedEmail === ADMIN_EMAIL) {
                const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (error) throw error;
                return { success: true, message: "Lien de connexion envoyé à l'admin." };
            }

            // Logique pour les utilisateurs normaux
            if (normalizedCode) {
                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes')
                    .select('*')
                    .eq('code', normalizedCode)
                    .single();

                if (codeError || !codeData) throw new Error("Code d'invitation invalide.");
                if (!codeData.is_active) throw new Error("Ce code d'invitation a déjà été utilisé.");

                // Le code est bon, on envoie le lien. Supabase créera le compte.
                const { error: magicLinkError } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (magicLinkError) throw magicLinkError;

                // Ici, il faudra plus tard une logique pour marquer le code comme utilisé.

                return { success: true, message: 'Code valide ! Lien de connexion envoyé.' };
            } else {
                // Pas de code : on tente une connexion.
                // Si l'option "Allow new users to sign up" est désactivée dans Supabase,
                // cette méthode ne créera pas de nouveau compte, ce qui est ce que nous voulons.
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


    const logout = async () => { /* ... */ };
    const value = { user, session, isAdmin, isAuthenticated: !!user, isLoading, loginOrSignUp, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;