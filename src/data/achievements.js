// src/data/achievements.js

import { Activity, Target, Users, Moon, Shield } from 'lucide-react';

// Succès difficiles
export const succes = [
    {
        id: 1,
        name: "Marathon de l'Info",
        description: "Lire 50 articles en 24h",
        icon: <Activity className="w-8 h-8" />,
        points: 500,
        unlocked: false
    },
    {
        id: 2,
        name: "Équilibriste Parfait",
        description: "Maintenir 100% de diversité pendant 30 jours",
        icon: <Target className="w-8 h-8" />,
        points: 1000,
        unlocked: false
    },
    {
        id: 3,
        name: "Ambassadeur d'Élite",
        description: "Parrainer 10 analystes actifs",
        icon: <Users className="w-8 h-8" />,
        points: 2000,
        unlocked: false
    },
    {
        id: 4,
        name: "Noctambule de l'Info",
        description: "Se connecter entre 2h et 5h du matin 7 jours consécutifs",
        icon: <Moon className="w-8 h-8" />,
        points: 750,
        unlocked: false
    },
    {
        id: 5,
        name: "Caméléon Politique",
        description: "Lire 100 articles de chaque orientation",
        icon: <Shield className="w-8 h-8" />,
        points: 3000,
        unlocked: false
    }
];

// Accréditations
export const accreditations = [
    {
        id: 1,
        name: "Détective Débutant",
        description: "Lire 10 articles",
        points: 10,
        locked: true
    },
    {
        id: 2,
        name: "Journaliste d'Investigation",
        description: "Lire 100 articles",
        points: 50,
        locked: true
    },
    {
        id: 3,
        name: "Archiviste en Chef",
        description: "Lire 500 articles",
        points: 200,
        locked: true
    },
    {
        id: 4,
        name: "Agent Ponctuel",
        description: "7 jours de streak",
        points: 100,
        locked: true
    },
    {
        id: 5,
        name: "Esprit Ouvert",
        description: "Diversité Score > 70%",
        points: 75,
        locked: true
    },
    {
        id: 6,
        name: "Recruteur d'Élite",
        description: "Parrainer 1 agent",
        points: 200,
        locked: true
    }
];

export default {
    succes,
    accreditations
};