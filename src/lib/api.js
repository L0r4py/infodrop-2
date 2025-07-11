// src/lib/api.js

// Configuration de base pour l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Headers par défaut
const defaultHeaders = {
    'Content-Type': 'application/json',
};

// Fonction helper pour les requêtes
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('La requête a expiré');
        }
        throw error;
    }
};

// API pour les articles
export const articlesAPI = {
    // Récupérer tous les articles
    getAll: async (filters = {}) => {
        try {
            // Pour l'instant, on retourne les données mock
            // Plus tard, ce sera un appel Supabase
            const { mockNews } = await import('../data/mockNews');

            let filtered = [...mockNews];

            // Appliquer les filtres
            if (filters.category && filters.category !== 'all') {
                filtered = filtered.filter(item => item.category === filters.category);
            }

            if (filters.orientation) {
                filtered = filtered.filter(item => item.orientation === filters.orientation);
            }

            if (filters.limit) {
                filtered = filtered.slice(0, filters.limit);
            }

            return { data: filtered, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Récupérer un article par ID
    getById: async (id) => {
        try {
            const { mockNews } = await import('../data/mockNews');
            const article = mockNews.find(item => item.id === id);

            if (!article) {
                throw new Error('Article non trouvé');
            }

            return { data: article, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Créer un article
    create: async (article) => {
        try {
            // Simuler la création
            const newArticle = {
                ...article,
                id: Date.now(),
                timestamp: Date.now(),
                views: 0,
                created_at: new Date().toISOString()
            };

            return { data: newArticle, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Mettre à jour un article
    update: async (id, updates) => {
        try {
            // Simuler la mise à jour
            const updatedArticle = {
                id,
                ...updates,
                updated_at: new Date().toISOString()
            };

            return { data: updatedArticle, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Supprimer un article
    delete: async (id) => {
        try {
            // Simuler la suppression
            return { data: { id, deleted: true }, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Enregistrer une lecture
    recordRead: async (articleId, userId) => {
        try {
            // Simuler l'enregistrement
            const read = {
                article_id: articleId,
                user_id: userId,
                read_at: new Date().toISOString()
            };

            return { data: read, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    }
};

// API pour l'authentification
export const authAPI = {
    // Connexion
    login: async (email, password) => {
        try {
            // Simuler la connexion
            await new Promise(resolve => setTimeout(resolve, 1000));

            const user = {
                id: 'user-123',
                email,
                created_at: new Date().toISOString()
            };

            const token = 'fake-jwt-token';

            return { data: { user, token }, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Inscription
    register: async (email, password, referralCode) => {
        try {
            // Simuler l'inscription
            await new Promise(resolve => setTimeout(resolve, 1000));

            const user = {
                id: `user-${Date.now()}`,
                email,
                referral_code: referralCode,
                created_at: new Date().toISOString()
            };

            return { data: { user }, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Déconnexion
    logout: async () => {
        try {
            // Simuler la déconnexion
            await new Promise(resolve => setTimeout(resolve, 500));
            return { data: { success: true }, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Vérifier le token
    verifyToken: async (token) => {
        try {
            // Simuler la vérification
            if (!token || token !== 'fake-jwt-token') {
                throw new Error('Token invalide');
            }

            return { data: { valid: true }, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    }
};

// API pour les stats utilisateur
export const statsAPI = {
    // Récupérer les stats
    get: async (userId) => {
        try {
            // Récupérer depuis localStorage pour l'instant
            const saved = localStorage.getItem('userStats');
            const stats = saved ? JSON.parse(saved) : null;

            return { data: stats, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Mettre à jour les stats
    update: async (userId, updates) => {
        try {
            // Sauvegarder dans localStorage pour l'instant
            const current = localStorage.getItem('userStats');
            const stats = current ? JSON.parse(current) : {};
            const updated = { ...stats, ...updates };

            localStorage.setItem('userStats', JSON.stringify(updated));

            return { data: updated, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    }
};

// API pour les codes de parrainage
export const referralAPI = {
    // Vérifier un code
    verify: async (code) => {
        try {
            // Simuler la vérification
            await new Promise(resolve => setTimeout(resolve, 500));

            // Codes valides pour la démo
            const validCodes = ['NYO-BX89', 'INF-DROP', 'BETA-2025'];
            const isValid = validCodes.includes(code);

            return {
                data: {
                    valid: isValid,
                    code,
                    owner: isValid ? '10r4.py@gmail.com' : null
                },
                error: null
            };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    // Générer un nouveau code
    generate: async (userId) => {
        try {
            // Simuler la génération
            const code = `INF-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            return { data: { code, user_id: userId }, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    }
};

// Export par défaut
export default {
    articles: articlesAPI,
    auth: authAPI,
    stats: statsAPI,
    referral: referralAPI
};