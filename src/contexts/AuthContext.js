// src/contexts/AuthContext.js
// VERSION FINALE - Utilise le préfixe NEXT_PUBLIC_

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',');

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    const fetchUserProfile = useCallback(async (userId) => {
        if (!userId || !supabase) return;
        try {
            const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
            if (error && error.code !== 'PGRST116') throw error;
            setUserProfile(data);
        } catch (error) {
            console.error("Erreur récupération profil:", error);
        }
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured || !supabase) {
            setIsLoading(false);
            setSessionLoaded(true);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            const currentUser = session?.user;
            setUser(currentUser);
            setIsAdmin(!!currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()));
            if (currentUser) fetchUserProfile(currentUser.id);
            setSessionLoaded(true);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            const currentUser = session?.user;
            setUser(currentUser);
            setIsAdmin(!!currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()));
            if (currentUser) {
                await fetchUserProfile(currentUser.id);
            } else {
                setUserProfile(null);
            }
            setIsLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, [fetchUserProfile]);

    const loginOrSignUp = async (email) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.toLowerCase().trim(),
                options: { emailRedirectTo: window.location.origin },
            });
            if (error) throw error;
            return { success: true, message: 'Vérifiez vos emails !' };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
    };

    const value = { user, userProfile, session, isAdmin, isAuthenticated: !!user, isLoading, sessionLoaded, loginOrSignUp, logout };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};