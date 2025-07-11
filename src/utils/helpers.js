// src/utils/helpers.js

/**
 * Fonctions utilitaires générales
 */

// Formater une date en français
export const formatDate = (date) => {
    if (!date) return '';

    const dateObj = new Date(date);
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };

    const formatted = dateObj.toLocaleDateString('fr-FR', options);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// Formater l'heure
export const formatTime = (date) => {
    if (!date) return '';

    const dateObj = new Date(date);
    return dateObj.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Formater une date relative (il y a X temps)
export const formatRelativeTime = (date) => {
    if (!date) return '';

    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

    return formatDate(date);
};

// Générer un code de parrainage
export const generateReferralCode = () => {
    const prefix = 'INF';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';

    for (let i = 0; i < 4; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return `${prefix}-${suffix}`;
};

// Valider un email
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Valider un code de parrainage
export const validateReferralCode = (code) => {
    const regex = /^[A-Z]{3}-[A-Z0-9]{4}$/;
    return regex.test(code);
};

// Tronquer un texte
export const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Capitaliser la première lettre
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Débounce une fonction
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle une fonction
export const throttle = (func, limit = 300) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Copier dans le presse-papier
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback pour les navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                document.execCommand('copy');
                return true;
            } catch (err) {
                return false;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    } catch (err) {
        console.error('Erreur lors de la copie:', err);
        return false;
    }
};

// Obtenir les initiales d'un nom
export const getInitials = (name) => {
    if (!name) return '';

    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    return parts[0].charAt(0).toUpperCase() + parts[parts.length - 1].charAt(0).toUpperCase();
};

// Formater un nombre avec séparateurs
export const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
};

// Obtenir une couleur aléatoire (pour les avatars)
export const getRandomColor = () => {
    const colors = [
        '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
        '#9b59b6', '#1abc9c', '#34495e', '#e67e22'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Vérifier si on est sur mobile
export const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Vérifier si on est en mode sombre
export const isDarkMode = () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Obtenir les paramètres de l'URL
export const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const result = {};

    for (const [key, value] of params) {
        result[key] = value;
    }

    return result;
};

// Stocker dans le localStorage avec expiration
export const setStorageWithExpiry = (key, value, ttl = 3600000) => {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
};

// Récupérer du localStorage avec vérification d'expiration
export const getStorageWithExpiry = (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
        const item = JSON.parse(itemStr);
        const now = new Date();

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }

        return item.value;
    } catch (error) {
        return null;
    }
};

// Mélanger un tableau (shuffle)
export const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

// Grouper un tableau par propriété
export const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) result[group] = [];
        result[group].push(item);
        return result;
    }, {});
};

// Calculer le pourcentage
export const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
};

// Attendre un délai (pour les tests/démos)
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
    formatDate,
    formatTime,
    formatRelativeTime,
    generateReferralCode,
    validateEmail,
    validateReferralCode,
    truncateText,
    capitalize,
    debounce,
    throttle,
    copyToClipboard,
    getInitials,
    formatNumber,
    getRandomColor,
    isMobile,
    isDarkMode,
    getUrlParams,
    setStorageWithExpiry,
    getStorageWithExpiry,
    shuffleArray,
    groupBy,
    calculatePercentage,
    wait
};