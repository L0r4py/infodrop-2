// src/data/badges.js

import { Shield, Target, Crown, Users, Diamond } from 'lucide-react';

// Badges disponibles dans la boutique
export const badges = [
    {
        id: 1,
        name: "Badge Analyste",
        description: "Badge de base pour les analystes confirmés",
        cost: 100,
        icon: <Shield className="w-6 h-6" />,
        color: "text-blue-500"
    },
    {
        id: 2,
        name: "Badge Diversité",
        description: "Pour les champions de la diversité",
        cost: 500,
        icon: <Target className="w-6 h-6" />,
        color: "text-emerald-500"
    },
    {
        id: 3,
        name: "Badge Elite",
        description: "Réservé aux meilleurs analystes",
        cost: 1000,
        icon: <Crown className="w-6 h-6" />,
        color: "text-yellow-500"
    },
    {
        id: 4,
        name: "Badge Influenceur",
        description: "Pour les recruteurs talentueux",
        cost: 750,
        icon: <Users className="w-6 h-6" />,
        color: "text-purple-500"
    },
    {
        id: 5,
        name: "Badge Légendaire",
        description: "Le badge ultime d'INFODROP",
        cost: 5000,
        icon: <Diamond className="w-6 h-6" />,
        color: "text-pink-500"
    }
];

export default badges;