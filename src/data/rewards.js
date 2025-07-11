// src/data/rewards.js

// Grades avec difficulté augmentée
export const grades = [
    { level: 1, title: "Recrue", ipRequired: 0 },
    { level: 2, title: "Analyste Junior", ipRequired: 200 },
    { level: 3, title: "Analyste Confirmé", ipRequired: 500 },
    { level: 4, title: "Analyste Senior", ipRequired: 1000 },
    { level: 5, title: "Spécialiste du Renseignement", ipRequired: 2000 },
    { level: 6, title: "Agent de Terrain", ipRequired: 3500 },
    { level: 7, title: "Agent Spécial", ipRequired: 5500 },
    { level: 8, title: "Chef de Section", ipRequired: 8000 },
    { level: 9, title: "Directeur Adjoint", ipRequired: 12000 },
    { level: 10, title: "Maître de l'Information", ipRequired: 20000 }
];

// Configuration INFODROP
export const INFODROP_CONFIG = {
    name: 'INFODROP',
    tagline: 'Le Club privé de l\'actu gamifiée',
    theme: {
        primary: '#2c3e50',
        secondary: '#e74c3c',
        accent: '#f39c12',
        dark: '#1a1a2e',
        light: '#eef2f3'
    },
    rewards: {
        pointsPerArticle: 5,
        bonusParrain: 200,
        bonusFilleul: 50
    },
    limits: {
        maxArticlesPerDay: 100,
        maxStreakBonus: 365,
        referralCodesPerUser: 3
    }
};

export default {
    grades,
    INFODROP_CONFIG
};