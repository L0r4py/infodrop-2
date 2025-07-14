// src/contexts/AuthContext.js
// VERSION FINALE - Recrée la logique de connexion de la V1

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase'; // Le client public du frontend

// 1. On crée le contexte
const AuthContext = createContext(null);

// 2. On crée un "hook" pour l'utiliser facilement dans les autres composants
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider.");
    }
    return context;
};

// 3. C'est le composant principal qui va "fournir" l'état d'authentification à toute ton application
export const AuthProvider = ({ children }) => {
    // --- ÉTAT INTERNE DU CONTEXTE ---
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Pour le spinner sur le bouton de connexion
    const [sessionLoaded, setSessionLoaded] = useState(false); // Pour savoir si on a vérifié la session au moins une fois

    // --- LOGIQUE DE CONNEXION DE LA V1, RECRÉÉE POUR REACT ---
    const login = useCallback(async (email, inviteCode) => {
        setIsLoading(true);
        try {
            // Étape A: Vérifier si l'email existe en appelant ton API
            const checkRes = await fetch('/api/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() })
            });

            const checkData = await checkRes.json();
            if (!checkRes.ok) {
                throw new Error(checkData.error || 'Erreur lors de la vérification de l\'email.');
            }
            const { exists } = checkData;

            // Étape B: Si l'utilisateur est nouveau, valider son code d'invitation via ton API
            if (!exists) {
                if (!inviteCode) {
                    throw new Error("Code d'invitation requis pour les nouveaux utilisateurs.");
                }
                const validateRes = await fetch('/api/validate-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: inviteCode, email: email })
                });

                const validateData = await validateRes.json();
                if (!validateRes.ok) {
                    throw new Error(validateData.error || 'Erreur lors de la validation du code.');
                }
            }

            // Étape C: Si toutes les vérifications sont passées, on envoie le lien magique
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
                options: {
                    // Redirige vers la page d'accueil après avoir cliqué sur le lien
                    emailRedirectTo: window.location.origin
                }
            });

            if (otpError) throw otpError;

            // Tout s'est bien passé
            return { success: true, message: 'Vérifiez vos emails ! Un lien de connexion a été envoyé.' };

        } catch (error) {
            // En cas d'erreur à n'importe quelle étape
            return { success: false, error: error.message };

        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- GESTION DE L'ÉTAT DE L'UTILISATEUR (CONNECTÉ / DÉCONNECTÉ) ---
    useEffect(() => {
        // Ne rien faire si Supabase n'est pas configuré
        if (!isSupabaseConfigured) {
            setSessionLoaded(true);
            return;
        }

        // On récupère la session existante au chargement de la page
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setSessionLoaded(true); // On a fini le chargement initial
        });

        // On écoute les changements d'état (connexion, déconnexion)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
        });

        // On nettoie l'écouteur quand le composant est "démonté"
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // --- FONCTION DE DÉCONNEXION ---
    const logout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    // --- OBJET FINAL PARTAGÉ AVEC L'APPLICATION ---
    const value = {
        // État
        user,
        session,
        sessionLoaded,
        isLoading,
        isAuthenticated: !!user, // Un booléen pratique pour savoir si l'utilisateur est connecté

        // Fonctions
        login,
        logout,
        loginOrSignUp: login, // Un alias pour la compatibilité avec d'autres parties de ton code
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};