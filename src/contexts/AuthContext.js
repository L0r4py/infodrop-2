// src/contexts/AuthContext.js
// Version finale "bavarde" pour le débogage final

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
            setIsLoading(false); return;
        }
        console.log("INITIALIZING AUTH...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`Auth Event: ${event}`, session);
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
        console.log(`[AUTH] Démarrage du processus pour ${email} avec le code '${inviteCode}'`);
        try {
            const normalizedEmail = email.toLowerCase();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            if (normalizedEmail === ADMIN_EMAIL) {
                console.log("[AUTH] Cas 1: Admin détecté.");
                const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (error) throw error;
                console.log("[AUTH] Appel à signInWithOtp pour l'admin réussi.");
                return { success: true, message: "Lien de connexion pour l'admin envoyé." };
            }

            if (normalizedCode) {
                console.log(`[AUTH] Cas 2: Inscription avec code ${normalizedCode}.`);
                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes').select('is_active, uses_count, max_uses').eq('code', normalizedCode).single();

                if (codeError) throw new Error(`Erreur DB: ${codeError.message}`);
                if (!codeData) throw new Error("Code d'invitation invalide.");
                if (!codeData.is_active) throw new Error("Ce code d'invitation n'est plus actif.");
                if (codeData.uses_count >= codeData.max_uses) throw new Error("Ce code d'invitation a atteint sa limite d'utilisations.");

                console.log("[AUTH] Code d'invitation validé. Lancement de l'inscription...");
                const { error: signUpError } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password: Math.random().toString(36).slice(-8)
                });

                if (signUpError && !signUpError.message.includes('User already registered')) throw signUpError;
                console.log("[AUTH] Appel à signUp réussi. L'email de confirmation devrait partir.");

                await supabase.from('referral_codes').update({
                    uses_count: codeData.uses_count + 1,
                    is_active: (codeData.uses_count + 1) < codeData.max_uses
                }).eq('code', normalizedCode);
                console.log("[AUTH] Code mis à jour dans la DB.");

                return { success: true, message: 'Inscription validée ! Veuillez consulter votre email.' };
            } else {
                console.log("[AUTH] Cas 3: Connexion sans code.");
                const { error } = await supabase.auth.signInWithOtp({ email: normalizedEmail });
                if (error) throw new Error(error.message);
                console.log("[AUTH] Appel à signInWithOtp pour utilisateur existant réussi.");
                return { success: true, message: 'Lien de connexion envoyé.' };
            }
        } catch (error) {
            console.error("[AUTH] ERREUR FATALE:", error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
            console.log("[AUTH] Fin du processus.");
        }
    };

    const logout = async () => { await supabase.auth.signOut(); };
    const value = { user, session, isAdmin, isAuthenticated: !!user, isLoading, loginOrSignUp, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};