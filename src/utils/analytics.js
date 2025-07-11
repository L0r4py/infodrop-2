// src/utils/analytics.js

/**
 * Utilitaires pour l'analytics et le tracking
 */

// Configuration de l'analytics
const ANALYTICS_CONFIG = {
    enabled: process.env.REACT_APP_ANALYTICS_ENABLED === 'true',
    debugMode: process.env.NODE_ENV === 'development',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    batchSize: 10,
    flushInterval: 5000 // 5 secondes
};

// File d'attente pour les événements
let eventQueue = [];
let flushTimer = null;

/**
 * Classe principale pour l'analytics
 */
class Analytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.startTime = Date.now();
        this.pageViews = 0;

        // Démarrer le flush automatique
        if (ANALYTICS_CONFIG.enabled) {
            this.startAutoFlush();
        }
    }

    /**
     * Générer un ID de session unique
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Définir l'utilisateur actuel
     */
    setUser(userId) {
        this.userId = userId;
        this.track('user_identified', { userId });
    }

    /**
     * Suivre un événement
     */
    track(eventName, properties = {}) {
        if (!ANALYTICS_CONFIG.enabled) return;

        const event = {
            name: eventName,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            }
        };

        if (ANALYTICS_CONFIG.debugMode) {
            console.log('[Analytics]', event);
        }

        eventQueue.push(event);

        // Flush si la file est pleine
        if (eventQueue.length >= ANALYTICS_CONFIG.batchSize) {
            this.flush();
        }
    }

    /**
     * Suivre une vue de page
     */
    trackPageView(pageName, properties = {}) {
        this.pageViews++;
        this.track('page_view', {
            pageName,
            pageViews: this.pageViews,
            ...properties
        });
    }

    /**
     * Suivre la lecture d'un article
     */
    trackArticleRead(article) {
        this.track('article_read', {
            articleId: article.id,
            title: article.title,
            category: article.category,
            orientation: article.orientation,
            source: article.source,
            tags: article.tags
        });
    }

    /**
     * Suivre un achat
     */
    trackPurchase(item, cost) {
        this.track('purchase', {
            itemType: item.type || 'badge',
            itemId: item.id,
            itemName: item.name,
            cost: cost,
            currency: 'IP'
        });
    }

    /**
     * Suivre un succès débloqué
     */
    trackAchievement(achievement) {
        this.track('achievement_unlocked', {
            achievementId: achievement.id,
            achievementName: achievement.name,
            points: achievement.points
        });
    }

    /**
     * Suivre une montée de grade
     */
    trackGradeUp(oldGrade, newGrade) {
        this.track('grade_up', {
            oldLevel: oldGrade.level,
            oldTitle: oldGrade.title,
            newLevel: newGrade.level,
            newTitle: newGrade.title
        });
    }

    /**
     * Suivre les métriques de diversité
     */
    trackDiversity(score, orientationCounts) {
        this.track('diversity_update', {
            score,
            orientationCounts,
            uniqueOrientations: Object.keys(orientationCounts).length
        });
    }

    /**
     * Suivre les erreurs
     */
    trackError(error, context = {}) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            type: error.name,
            ...context
        });
    }

    /**
     * Suivre les performances
     */
    trackPerformance(metric, value, unit = 'ms') {
        this.track('performance', {
            metric,
            value,
            unit
        });
    }

    /**
     * Envoyer les événements en attente
     */
    async flush() {
        if (eventQueue.length === 0) return;

        const events = [...eventQueue];
        eventQueue = [];

        try {
            // Ici, normalement on enverrait à un service d'analytics
            // Pour la démo, on simule juste l'envoi
            if (ANALYTICS_CONFIG.debugMode) {
                console.log('[Analytics] Flushing events:', events);
            }

            // Simuler l'envoi (remplacer par une vraie API)
            await this.sendToAnalytics(events);
        } catch (error) {
            console.error('[Analytics] Erreur lors de l\'envoi:', error);
            // Remettre les événements dans la file en cas d'erreur
            eventQueue = [...events, ...eventQueue];
        }
    }

    /**
     * Envoyer les événements au service d'analytics
     */
    async sendToAnalytics(events) {
        // Pour la démo, on simule juste un délai
        await new Promise(resolve => setTimeout(resolve, 100));

        // Dans une vraie app, on ferait quelque chose comme :
        // await fetch('/api/analytics', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ events })
        // });
    }

    /**
     * Démarrer le flush automatique
     */
    startAutoFlush() {
        flushTimer = setInterval(() => {
            this.flush();
        }, ANALYTICS_CONFIG.flushInterval);
    }

    /**
     * Arrêter le flush automatique
     */
    stopAutoFlush() {
        if (flushTimer) {
            clearInterval(flushTimer);
            flushTimer = null;
        }
    }

    /**
     * Calculer les métriques de session
     */
    getSessionMetrics() {
        const duration = Date.now() - this.startTime;
        return {
            sessionId: this.sessionId,
            duration,
            pageViews: this.pageViews,
            userId: this.userId
        };
    }

    /**
     * Terminer la session
     */
    endSession() {
        const metrics = this.getSessionMetrics();
        this.track('session_end', metrics);
        this.flush();
        this.stopAutoFlush();
    }
}

// Instance unique de l'analytics
const analytics = new Analytics();

// Gérer la fermeture de la page
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        analytics.endSession();
    });
}

// Helpers pour faciliter l'utilisation
export const trackEvent = (name, properties) => analytics.track(name, properties);
export const trackPageView = (pageName, properties) => analytics.trackPageView(pageName, properties);
export const trackArticleRead = (article) => analytics.trackArticleRead(article);
export const trackPurchase = (item, cost) => analytics.trackPurchase(item, cost);
export const trackAchievement = (achievement) => analytics.trackAchievement(achievement);
export const trackGradeUp = (oldGrade, newGrade) => analytics.trackGradeUp(oldGrade, newGrade);
export const trackDiversity = (score, counts) => analytics.trackDiversity(score, counts);
export const trackError = (error, context) => analytics.trackError(error, context);
export const setUser = (userId) => analytics.setUser(userId);

// Métriques de performance
export const measurePerformance = (name, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    analytics.trackPerformance(name, end - start);
    return result;
};

// Métriques de performance async
export const measurePerformanceAsync = async (name, fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    analytics.trackPerformance(name, end - start);
    return result;
};

export default analytics;