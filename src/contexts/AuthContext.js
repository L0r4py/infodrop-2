// src/contexts/AuthContext.js
// VERSION FINALE DÉFINITIVE - Recrée la logique V1 et gère les erreurs

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Lecture de la variable admin avec le bon préfixe
const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || '').split(',');

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // La logique de connexion de la V1
    const login = useCallback(async (email, inviteCode) => {
        setIsLoading(true);
        try {
            const checkRes = await fetch('/api/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() })
            });
            const checkData = await checkRes.json();
            if (!checkRes.ok) throw new Error(checkData.error || 'Erreur vérification email.');

            if (!checkData.exists) {
                if (!inviteCode) throw new Error("Code d'invitation requis.");
                const validateRes = await fetch('/api/validate-invite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: inviteCode, email: email })
                });
                const validateData = await validateRes.json();
                if (!validateRes.ok) throw new Error(validateData.error || 'Erreur validation code.');
            }

            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase(),
                options: { emailRedirectTo: window.location.origin }
            });
            if (otpError) throw otpError;

            return { success: true, message: 'Vérifiez vos emails !' };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Gestion de la session
    useEffect(() => {
        if (!isSupabaseConfigured) {
            console.error("ERREUR: Supabase n'est pas configuré. Vérifiez les variables REACT_APP_* sur Vercel.");
            setSessionLoaded(true);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user;
            setUser(currentUser);
            setIsAdmin(!!currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()));
            setSessionLoaded(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            const currentUser = session?.user;
            setUser(currentUser);
            setIsAdmin(!!currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()));
        });

        return () => subscription?.unsubscribe();
    }, []);

    const logout = async () => await supabase.auth.signOut();

    const value = { user, session, isAdmin, isLoading, sessionLoaded, isAuthenticated: !!user, login, logout, loginOrSignUp: login };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};