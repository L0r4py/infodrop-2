// src/contexts/AuthContext.js
// Version finale, qui correspond EXACTEMENT à la structure de la table 'referral_codes'

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // ... (la partie useEffect qui gère onAuthStateChange est parfaite et ne change pas)
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setIsLoading(false); return;
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser?.email?.toLowerCase() === ADMIN_EMAIL);
            setIsLoading(false);
        });
        return () => subscription?.unsubscribe();
    }, []);


    const loginOrSignUp = async (email, inviteCode) => {
        setIsLoading(true);
        try {
            const normalizedEmail = email.toLowerCase();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            // L'admin se connecte toujours avec un lien magique
            if (normalizedEmail === ADMIN_EMAIL) {
                const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (error) throw error;
                return { success: true, message: "Lien de connexion pour l'admin envoyé." };
            }

            // Si un code est fourni, on traite ça comme une tentative d'inscription
            if (normalizedCode) {
                // 1. Vérifier le code dans la VRAIE table 'referral_codes'
                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes') // ✅ Nom de table correct
                    .select('is_active, uses_count, max_uses') // ✅ Colonnes correctes
                    .eq('code', normalizedCode)
                    .single();

                if (codeError || !codeData) throw new Error("Code d'invitation invalide.");
                if (!codeData.is_active) throw new Error("Ce code d'invitation n'est plus actif.");
                if (codeData.uses_count >= codeData.max_uses) throw new Error("Ce code d'invitation a atteint sa limite d'utilisations.");

                // 2. Si le code est bon, on lance l'inscription via Supabase Auth
                const { error: signUpError } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password: Math.random().toString(36).slice(-8)
                });

                if (signUpError && !signUpError.message.includes('User already registered')) {
                    throw signUpError;
                }

                // Si l'inscription réussit (ou si l'utilisateur existait déjà mais avait le bon code)
                // Supabase envoie l'email de confirmation.
                // On met à jour le code d'invitation
                await supabase.from('referral_codes').update({
                    uses_count: codeData.uses_count + 1,
                    // On désactive le code si la limite est atteinte
                    is_active: (codeData.uses_count + 1) < codeData.max_uses
                }).eq('code', normalizedCode);

                return { success: true, message: 'Inscription validée ! Veuillez consulter votre email pour confirmer votre compte.' };

            } else {
                // Pas de code : c'est une tentative de connexion pour un utilisateur existant
                const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
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

    const logout = async () => { await supabase.auth.signOut(); };

    const value = { user, session, isAdmin, isAuthenticated: !!user, isLoading, loginOrSignUp, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};