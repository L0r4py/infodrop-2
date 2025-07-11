// src/data/mockNews.js

// Mock data avec orientations et tags (format cohérent avec Supabase)
export const mockNews = [
    {
        id: 1,
        title: "Réforme des retraites : les syndicats appellent à la grève",
        source: "L'Humanité",
        category: "politique",
        orientation: "gauche",
        tags: ["Social", "Urgent"],
        url: "https://example.com",
        timestamp: Date.now() - 3600000,
        views: 1250
    },
    {
        id: 2,
        title: "La tech française lève des fonds records",
        source: "Les Échos",
        category: "économie",
        orientation: "centre-droit",  // AVEC tiret comme dans Supabase
        tags: ["Innovation"],
        url: "https://example.com",
        timestamp: Date.now() - 7200000,
        views: 3420
    },
    {
        id: 3,
        title: "Climat : l'urgence d'agir selon le GIEC",
        source: "Reporterre",
        category: "environnement",
        orientation: "gauche",
        tags: ["Climat", "Science"],
        url: "https://example.com",
        timestamp: Date.now() - 10800000,
        views: 5670
    },
    {
        id: 4,
        title: "Sécurité : nouvelles mesures gouvernementales",
        source: "Le Figaro",
        category: "société",
        orientation: "droite",
        tags: ["Politique"],
        url: "https://example.com",
        timestamp: Date.now() - 14400000,
        views: 890
    },
    {
        id: 5,
        title: "Innovation : la France dans la course à l'IA",
        source: "Le Monde",
        category: "tech",
        orientation: "centre",
        tags: ["Tech", "Économie"],
        url: "https://example.com",
        timestamp: Date.now() - 18000000,
        views: 7890
    }
];

export default mockNews;