// src/data/newsSources.js

// Couleurs des orientations politiques
export const POLITICAL_COLORS = {
    'extreme-gauche': '#dc3545',
    'gauche': '#e74c3c',
    'centre-gauche': '#ec7063',
    'centre': '#6c757d',
    'centre-droit': '#5dade2',
    'droite': '#3498db',
    'extreme-droite': '#2980b9'
};

// Sources d'actualités avec leurs orientations
export const newsSources = [
    // Extrême gauche
    { name: "Révolution Permanente", orientation: "extreme-gauche", category: "politique" },
    { name: "NPA", orientation: "extreme-gauche", category: "politique" },

    // Gauche
    { name: "L'Humanité", orientation: "gauche", category: "politique" },
    { name: "Libération", orientation: "gauche", category: "généraliste" },
    { name: "Reporterre", orientation: "gauche", category: "environnement" },
    { name: "Mediapart", orientation: "gauche", category: "investigation" },

    // Centre-gauche
    { name: "Le Nouvel Obs", orientation: "centre-gauche", category: "généraliste" },
    { name: "Télérama", orientation: "centre-gauche", category: "culture" },

    // Centre
    { name: "Le Monde", orientation: "centre", category: "généraliste" },
    { name: "France Info", orientation: "centre", category: "généraliste" },
    { name: "AFP", orientation: "centre", category: "agence" },

    // Centre-droit
    { name: "Les Échos", orientation: "centre-droit", category: "économie" },
    { name: "L'Express", orientation: "centre-droit", category: "généraliste" },

    // Droite
    { name: "Le Figaro", orientation: "droite", category: "généraliste" },
    { name: "Le Point", orientation: "droite", category: "généraliste" },

    // Extrême droite
    { name: "Valeurs Actuelles", orientation: "extreme-droite", category: "politique" },
    { name: "Boulevard Voltaire", orientation: "extreme-droite", category: "politique" }
];

// Labels des orientations
export const orientationLabels = {
    'extreme-gauche': 'Extrême Gauche',
    'gauche': 'Gauche',
    'centre-gauche': 'Centre Gauche',
    'centre': 'Centre',
    'centre-droit': 'Centre Droit',
    'droite': 'Droite',
    'extreme-droite': 'Extrême Droite'
};

// Labels courts pour les graphiques
export const orientationLabelsShort = {
    'extreme-gauche': 'Extrême G.',
    'gauche': 'Gauche',
    'centre-gauche': 'Centre G.',
    'centre': 'Centre',
    'centre-droit': 'Centre D.',
    'droite': 'Droite',
    'extreme-droite': 'Extrême D.'
};

// Ordre des orientations pour l'affichage
export const orientationOrder = [
    'extreme-gauche',
    'gauche',
    'centre-gauche',
    'centre',
    'centre-droit',
    'droite',
    'extreme-droite'
];

// Fonction pour obtenir la couleur d'une orientation
export const getOrientationColor = (orientation) => {
    return POLITICAL_COLORS[orientation] || '#6c757d';
};

// Fonction pour obtenir le label d'une orientation
export const getOrientationLabel = (orientation, short = false) => {
    if (short) {
        return orientationLabelsShort[orientation] || orientation;
    }
    return orientationLabels[orientation] || orientation;
};

export default {
    POLITICAL_COLORS,
    newsSources,
    orientationLabels,
    orientationLabelsShort,
    orientationOrder,
    getOrientationColor,
    getOrientationLabel
};