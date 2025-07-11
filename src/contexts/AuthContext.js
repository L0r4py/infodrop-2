// src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

// Créer le contexte
const AuthContext = createContext(null);

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

// Provider du contexte
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Récupérer l'utilisateur depuis le localStorage au chargement
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isAdmin, setIsAdmin] = useState(true); // Pour la démo
    const [isAuthenticated, setIsAuthenticated] = useState(!!user);
    const [isLoading, setIsLoading] = useState(false);

    // Sauvegarder l'utilisateur dans le localStorage à chaque changement
    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
        }
    }, [user]);

    // Fonction de connexion
    const login = async (email, referralCode) => {
        setIsLoading(true);
        try {
            // Simuler un appel API
            await new Promise(resolve => setTimeout(resolve, 1000));

            const newUser = {
                id: Date.now(),
                email,
                referralCode: referralCode || 'NYO-BX89',
                referredBy: '10r4.py@gmail.com',
                createdAt: new Date().toISOString()
            };

            setUser(newUser);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction de déconnexion
    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        localStorage.removeItem('user');
        localStorage.removeItem('userStats');
    };

    // Fonction pour mettre à jour le profil utilisateur
    const updateProfile = (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
    };

    const value = {
        user,
        isAdmin,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateProfile,
        setIsAdmin
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;