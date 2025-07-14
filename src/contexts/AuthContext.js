// src/contexts/AuthContext.js
// VERSION DE DIAGNOSTIC : Affiche les erreurs de configuration

import React, { createContext, useState, useContext, useEffect } from 'react';
// On importe aussi l'erreur de configuration
import { supabase, isSupabaseConfigured, supabaseConfigurationError } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [sessionLoaded, setSessionLoaded] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Affiche l'erreur de configuration, s'il y en a une
        if (supabaseConfigurationError) {
            console.error("ERREUR DE CONFIGURATION DETECTEE PAR AUTHCONTEXT:", supabaseConfigurationError);
            // On arrête tout ici pour éviter d'autres erreurs
            setSessionLoaded(true); // Pour ne pas rester bloqué sur le chargement
            return;
        }

        if (!isSupabaseConfigured || !supabase) {
            console.log("AuthContext: Supabase non configuré, arrêt.");
            setSessionLoaded(true);
            return;
        }

        console.log("AuthContext: Démarrage de la surveillance de l'authentification...");

        // On récupère la session actuelle
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log("AuthContext: Session initiale récupérée.", session);
            setUser(session?.user ?? null);
            setSessionLoaded(true);
        });

        // On écoute les changements
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log("AuthContext: Changement d'état de l'authentification détecté.", session);
            setUser(session?.user ?? null);
        });

        // Nettoyage
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // On simplifie le reste pour le test, on se concentre sur l'init
    const value = {
        user,
        isAuthenticated: !!user,
        sessionLoaded,
        // Fonctions vides pour le test
        loginOrSignUp: () => console.log("login test"),
        logout: () => console.log("logout test"),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};