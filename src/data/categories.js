// src/data/categories.js

// Catégories d'actualités avec leurs configurations
export const categories = [
    {
        id: 'all',
        name: 'Toutes',
        color: 'bg-blue-600',
        textColor: 'text-white'
    },
    {
        id: 'politique',
        name: 'Politique',
        color: 'bg-indigo-600',
        textColor: 'text-white'
    },
    {
        id: 'économie',
        name: 'Économie',
        color: 'bg-emerald-600',
        textColor: 'text-white'
    },
    {
        id: 'tech',
        name: 'Tech',
        color: 'bg-purple-600',
        textColor: 'text-white'
    },
    {
        id: 'société',
        name: 'Société',
        color: 'bg-amber-600',
        textColor: 'text-white'
    },
    {
        id: 'environnement',
        name: 'Environnement',
        color: 'bg-green-600',
        textColor: 'text-white'
    }
];

// Fonction utilitaire pour obtenir la couleur d'une catégorie
export const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : 'bg-gray-600';
};

// Fonction utilitaire pour obtenir le nom d'une catégorie
export const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
};

export default categories;