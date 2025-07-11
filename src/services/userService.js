// src/services/userService.js

import { supabase, auth, db } from '../lib/supabase';
import api from '../lib/api';
import { grades } from '../data/rewards';

// Service pour gérer les utilisateurs et leurs statistiques
class UserService {
    constructor() {
        this.currentUser = null;
        this.userStats = null;
    }

    // Authentification
    async login(email, password) {
        try {
            // Si Supabase est configuré
            if (supabase) {
                const { data, error } = await auth.signIn(email, password);
                if (error) throw error;

                this.currentUser = data.user;
                await this.loadUserStats();

                return { success: true, user: data.user };
            }

            // Sinon, utiliser l'API mock
            const { data, error } = await api.auth.login(email, password);
            if (error) throw error;

            this.currentUser = data.user;
            localStorage.setItem('authToken', data.token);
            await this.loadUserStats();

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Erreur de connexion:', error);
            return { success: false, error: error.message };
        }
    }

    // Inscription
    async register(email, password, referralCode = null) {
        try {
            // Vérifier le code de parrainage si fourni
            if (referralCode) {
                const { valid } = await this.verifyReferralCode(referralCode);
                if (!valid) {
                    return { success: false, error: 'Code de parrainage invalide' };
                }
            }

            // Si Supabase est configuré
            if (supabase) {
                const { data, error } = await auth.signUp(email, password, {
                    referral_code: referralCode,
                    referred_by: referralCode
                });

                if (error) throw error;

                // Créer les stats initiales
                if (data.user) {
                    await this.createInitialStats(data.user.id, referralCode);
                }

                return { success: true, user: data.user };
            }

            // Sinon, utiliser l'API mock
            const { data, error } = await api.auth.register(email, password, referralCode);
            if (error) throw error;

            // Créer les stats initiales localement
            this.createInitialStatsLocal(data.user.id, referralCode);

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            return { success: false, error: error.message };
        }
    }

    // Déconnexion
    async logout() {
        try {
            if (supabase) {
                await auth.signOut();
            }

            this.currentUser = null;
            this.userStats = null;
            localStorage.removeItem('authToken');

            return { success: true };
        } catch (error) {
            console.error('Erreur de déconnexion:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtenir l'utilisateur actuel
    async getCurrentUser() {
        try {
            if (this.currentUser) return this.currentUser;

            if (supabase) {
                const user = await auth.getUser();
                this.currentUser = user;
                return user;
            }

            // Vérifier le token local
            const token = localStorage.getItem('authToken');
            if (token) {
                const { data } = await api.auth.verifyToken(token);
                if (data?.valid) {
                    // Simuler un utilisateur pour la démo
                    this.currentUser = { id: 'demo-user', email: 'demo@infodrop.fr' };
                    return this.currentUser;
                }
            }

            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'utilisateur:', error);
            return null;
        }
    }

    // Charger les stats utilisateur
    async loadUserStats() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            // Si Supabase est configuré
            if (supabase) {
                const { data, error } = await db.userStats.get(user.id);
                if (error) throw error;

                this.userStats = data || this.getDefaultStats();
                return this.userStats;
            }

            // Sinon, charger depuis localStorage
            const saved = localStorage.getItem('userStats');
            this.userStats = saved ? JSON.parse(saved) : this.getDefaultStats();
            return this.userStats;
        } catch (error) {
            console.error('Erreur lors du chargement des stats:', error);
            this.userStats = this.getDefaultStats();
            return this.userStats;
        }
    }

    // Sauvegarder les stats utilisateur
    async saveUserStats(stats) {
        try {
            const user = await this.getCurrentUser();
            if (!user) return { success: false, error: 'Non connecté' };

            this.userStats = stats;

            // Si Supabase est configuré
            if (supabase) {
                const { error } = await db.userStats.upsert(user.id, stats);
                if (error) throw error;
                return { success: true };
            }

            // Sinon, sauvegarder dans localStorage
            localStorage.setItem('userStats', JSON.stringify(stats));
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des stats:', error);
            return { success: false, error: error.message };
        }
    }

    // Mettre à jour les stats après lecture d'article
    async recordArticleRead(article) {
        try {
            if (!this.userStats) await this.loadUserStats();

            const newStats = { ...this.userStats };

            // Ajouter les IP
            newStats.ip += 5;
            newStats.readCount += 1;

            // Mettre à jour les orientations
            if (!newStats.orientationCounts) newStats.orientationCounts = {};
            newStats.orientationCounts[article.orientation] =
                (newStats.orientationCounts[article.orientation] || 0) + 1;

            // Calculer le score de diversité
            const orientationsWithArticles = Object.keys(newStats.orientationCounts)
                .filter(o => newStats.orientationCounts[o] > 0);
            newStats.diversityScore = Math.min(100,
                Math.round((orientationsWithArticles.length / 7) * 100)
            );

            // Vérifier le grade
            const gradeResult = this.checkGradeUp(newStats);
            if (gradeResult.upgraded) {
                newStats.grade = gradeResult.newLevel;
                newStats.gradeTitle = gradeResult.newGrade;
            }

            // Sauvegarder
            await this.saveUserStats(newStats);

            return {
                success: true,
                ipGained: 5,
                gradeUp: gradeResult.upgraded ? gradeResult : null
            };
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de la lecture:', error);
            return { success: false, error: error.message };
        }
    }

    // Vérifier le grade
    checkGradeUp(stats) {
        const currentGrade = stats.grade;
        const currentIP = stats.ip;
        const nextGrade = grades.find(g => g.level === currentGrade + 1);

        if (nextGrade && currentIP >= nextGrade.ipRequired) {
            return {
                upgraded: true,
                oldGrade: grades[currentGrade - 1].title,
                newGrade: nextGrade.title,
                newLevel: nextGrade.level
            };
        }

        return { upgraded: false };
    }

    // Acheter un badge
    async purchaseBadge(badge) {
        try {
            if (!this.userStats) await this.loadUserStats();

            // Vérifier les IP
            if (this.userStats.ip < badge.cost) {
                return { success: false, error: 'IP insuffisants' };
            }

            // Vérifier si déjà acheté
            if (this.userStats.purchasedBadges?.includes(badge.id)) {
                return { success: false, error: 'Badge déjà possédé' };
            }

            // Mettre à jour les stats
            const newStats = { ...this.userStats };
            newStats.ip -= badge.cost;
            newStats.purchasedBadges = [...(newStats.purchasedBadges || []), badge.id];

            await this.saveUserStats(newStats);

            return { success: true };
        } catch (error) {
            console.error('Erreur lors de l\'achat du badge:', error);
            return { success: false, error: error.message };
        }
    }

    // Vérifier un code de parrainage
    async verifyReferralCode(code) {
        try {
            if (supabase) {
                const { data, error } = await db.referralCodes.verify(code);
                return { valid: !error && !!data, owner: data?.user_id };
            }

            const { data } = await api.referral.verify(code);
            return { valid: data?.valid || false, owner: data?.owner };
        } catch (error) {
            console.error('Erreur lors de la vérification du code:', error);
            return { valid: false };
        }
    }

    // Générer un code de parrainage
    async generateReferralCode() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return { success: false, error: 'Non connecté' };

            if (supabase) {
                const { data, error } = await db.referralCodes.create(user.id);
                if (error) throw error;
                return { success: true, code: data.code };
            }

            const { data } = await api.referral.generate(user.id);
            return { success: true, code: data.code };
        } catch (error) {
            console.error('Erreur lors de la génération du code:', error);
            return { success: false, error: error.message };
        }
    }

    // Créer les stats initiales
    async createInitialStats(userId, referralCode = null) {
        const initialStats = {
            user_id: userId,
            ip: referralCode ? 50 : 0, // Bonus filleul
            grade: 1,
            grade_title: 'Recrue',
            streak: 0,
            read_count: 0,
            diversity_score: 0,
            unlocked_accreditations: [],
            unlocked_achievements: [],
            purchased_badges: [],
            orientation_counts: {},
            referral_code: await this.generateUserCode(),
            referred_by: referralCode,
            referred_members: 0,
            created_at: new Date().toISOString()
        };

        if (supabase) {
            await db.userStats.upsert(userId, initialStats);
        }

        return initialStats;
    }

    // Créer les stats initiales localement
    createInitialStatsLocal(userId, referralCode = null) {
        const stats = this.getDefaultStats();
        stats.ip = referralCode ? 50 : 0;
        stats.referred_by = referralCode;
        stats.referral_code = this.generateUserCode();

        localStorage.setItem('userStats', JSON.stringify(stats));
    }

    // Générer un code utilisateur unique
    generateUserCode() {
        return `INF-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    // Stats par défaut
    getDefaultStats() {
        return {
            ip: 0,
            grade: 1,
            gradeTitle: 'Recrue',
            streak: 0,
            readCount: 0,
            diversityScore: 0,
            unlockedAccreditations: [],
            unlockedSucces: [],
            purchasedBadges: [],
            readOrientations: [],
            orientationCounts: {},
            referralCode: 'NYO-BX89',
            referredBy: null,
            referredMembers: 0
        };
    }

    // Mettre à jour le streak
    async updateStreak() {
        try {
            const lastVisit = localStorage.getItem('lastVisit');
            const today = new Date().toDateString();

            if (lastVisit !== today) {
                localStorage.setItem('lastVisit', today);

                if (!this.userStats) await this.loadUserStats();

                const newStats = { ...this.userStats };
                newStats.streak += 1;

                await this.saveUserStats(newStats);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du streak:', error);
            return false;
        }
    }
}

// Créer une instance unique
const userService = new UserService();

export default userService;