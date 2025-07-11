// src/contexts/ThemeContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

// Créer le contexte
const ThemeContext = createContext(null);

// Hook personnalisé pour utiliser le contexte
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme doit être utilisé dans un ThemeProvider');
    }
    return context;
};

// Configuration du thème INFODROP
const themes = {
    dark: {
        name: 'dark',
        colors: {
            primary: '#2c3e50',
            secondary: '#e74c3c',
            accent: '#f39c12',
            background: '#1a1a2e',
            surface: '#0f0f1e',
            text: '#eef2f3',
            textSecondary: '#a0a0a0'
        }
    },
    light: {
        name: 'light',
        colors: {
            primary: '#2c3e50',
            secondary: '#e74c3c',
            accent: '#f39c12',
            background: '#f5f7fa',
            surface: '#ffffff',
            text: '#2c3e50',
            textSecondary: '#6c757d'
        }
    }
};

// Provider du contexte
export const ThemeProvider = ({ children }) => {
    // État du thème avec persistence
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? saved === 'true' : true; // Dark mode par défaut
    });

    const [currentTheme, setCurrentTheme] = useState(darkMode ? themes.dark : themes.light);

    // Sauvegarder le thème dans le localStorage
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
        setCurrentTheme(darkMode ? themes.dark : themes.light);

        // Appliquer les classes au body
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Fonction pour basculer le thème
    const toggleTheme = () => {
        setDarkMode(prev => !prev);
    };

    // Fonction pour définir un thème spécifique
    const setTheme = (isDark) => {
        setDarkMode(isDark);
    };

    // Fonction pour obtenir une couleur du thème actuel
    const getThemeColor = (colorName) => {
        return currentTheme.colors[colorName] || '#000000';
    };

    // Classes CSS utilitaires basées sur le thème
    const themeClasses = {
        background: darkMode ? 'bg-slate-950' : 'bg-gray-50',
        surface: darkMode ? 'bg-slate-800' : 'bg-white',
        border: darkMode ? 'border-slate-700' : 'border-gray-200',
        text: darkMode ? 'text-white' : 'text-gray-900',
        textSecondary: darkMode ? 'text-gray-400' : 'text-gray-600',
        hover: darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
    };

    const value = {
        darkMode,
        currentTheme,
        themes,
        toggleTheme,
        setTheme,
        getThemeColor,
        themeClasses
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;