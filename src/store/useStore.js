// src/store/useStore.js

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Store global de l'application avec Zustand
const useStore = create(
    persist(
        (set, get) => ({
            // === État de l'authentification ===
            user: null,
            isAuthenticated: false,
            isAdmin: false,

            // === État des actualités ===
            news: [],
            selectedCategory: 'all',
            selectedTags: [],
            newsLoading: false,
            newsError: null,

            // === État de la gamification ===
            userStats: {
                ip: 0,
                grade: 1,
                gradeTitle: 'Recrue',
                streak: 0,
                readCount: 0,
                diversityScore: 41,
                unlockedAccreditations: [],
                unlockedSucces: [],
                purchasedBadges: [],
                readOrientations: [],
                orientationCounts: {},
                referralCode: 'NYO-BX89',
                referredBy: '10r4.py@gmail.com',
                referredMembers: 0
            },

            // === État de l'interface ===
            darkMode: true,
            menuOpen: false,
            showAdmin: false,
            showBadgeShop: false,
            showReferral: false,
            show360: false,
            showAbout: false,

            // === Actions Auth ===
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setIsAdmin: (isAdmin) => set({ isAdmin }),
            logout: () => set({
                user: null,
                isAuthenticated: false,
                isAdmin: false,
                userStats: get().getDefaultStats()
            }),

            // === Actions News ===
            setNews: (news) => set({ news }),
            addNews: (article) => set((state) => ({
                news: [article, ...state.news]
            })),
            updateNews: (id, updates) => set((state) => ({
                news: state.news.map(item =>
                    item.id === id ? { ...item, ...updates } : item
                )
            })),
            deleteNews: (id) => set((state) => ({
                news: state.news.filter(item => item.id !== id)
            })),
            setSelectedCategory: (category) => set({ selectedCategory: category }),
            toggleTag: (tag) => set((state) => ({
                selectedTags: state.selectedTags.includes(tag)
                    ? state.selectedTags.filter(t => t !== tag)
                    : [...state.selectedTags, tag]
            })),
            clearTags: () => set({ selectedTags: [] }),
            setNewsLoading: (loading) => set({ newsLoading: loading }),
            setNewsError: (error) => set({ newsError: error }),

            // === Actions Gamification ===
            setUserStats: (stats) => set({ userStats: stats }),
            updateUserStats: (updates) => set((state) => ({
                userStats: { ...state.userStats, ...updates }
            })),
            addIP: (points) => set((state) => ({
                userStats: { ...state.userStats, ip: state.userStats.ip + points }
            })),
            spendIP: (points) => set((state) => {
                if (state.userStats.ip >= points) {
                    return {
                        userStats: { ...state.userStats, ip: state.userStats.ip - points }
                    };
                }
                return state;
            }),
            recordArticleRead: (orientation) => set((state) => {
                const newOrientationCounts = {
                    ...state.userStats.orientationCounts,
                    [orientation]: (state.userStats.orientationCounts[orientation] || 0) + 1
                };

                const orientationsWithArticles = Object.keys(newOrientationCounts)
                    .filter(o => newOrientationCounts[o] > 0);

                const diversityScore = Math.min(100,
                    Math.round((orientationsWithArticles.length / 7) * 100)
                );

                return {
                    userStats: {
                        ...state.userStats,
                        ip: state.userStats.ip + 5,
                        readCount: state.userStats.readCount + 1,
                        readOrientations: [...new Set([...state.userStats.readOrientations, orientation])],
                        orientationCounts: newOrientationCounts,
                        diversityScore
                    }
                };
            }),
            purchaseBadge: (badgeId) => set((state) => ({
                userStats: {
                    ...state.userStats,
                    purchasedBadges: [...state.userStats.purchasedBadges, badgeId]
                }
            })),
            unlockAchievement: (achievementId) => set((state) => ({
                userStats: {
                    ...state.userStats,
                    unlockedSucces: [...state.userStats.unlockedSucces, achievementId]
                }
            })),
            unlockAccreditation: (accreditationId) => set((state) => ({
                userStats: {
                    ...state.userStats,
                    unlockedAccreditations: [...state.userStats.unlockedAccreditations, accreditationId]
                }
            })),

            // === Actions Interface ===
            toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
            setMenuOpen: (open) => set({ menuOpen: open }),
            toggleMenu: () => set((state) => ({ menuOpen: !state.menuOpen })),
            setShowAdmin: (show) => set({ showAdmin: show }),
            setShowBadgeShop: (show) => set({ showBadgeShop: show }),
            setShowReferral: (show) => set({ showReferral: show }),
            setShow360: (show) => set({ show360: show }),
            setShowAbout: (show) => set({ showAbout: show }),

            // === Helpers ===
            getDefaultStats: () => ({
                ip: 0,
                grade: 1,
                gradeTitle: 'Recrue',
                streak: 0,
                readCount: 0,
                diversityScore: 41,
                unlockedAccreditations: [],
                unlockedSucces: [],
                purchasedBadges: [],
                readOrientations: [],
                orientationCounts: {},
                referralCode: 'NYO-BX89',
                referredBy: '10r4.py@gmail.com',
                referredMembers: 0
            }),

            // === Getters calculés ===
            getFilteredNews: () => {
                const state = get();
                let filtered = state.news;

                if (state.selectedCategory !== 'all') {
                    filtered = filtered.filter(item => item.category === state.selectedCategory);
                }

                if (state.selectedTags.length > 0) {
                    filtered = filtered.filter(item =>
                        item.tags?.some(tag => state.selectedTags.includes(tag))
                    );
                }

                return filtered;
            },

            getAllTags: () => {
                const state = get();
                const tags = new Set();
                state.news.forEach(item => {
                    item.tags?.forEach(tag => tags.add(tag));
                });
                return Array.from(tags);
            }
        }),
        {
            name: 'infodrop-store', // nom pour localStorage
            partialize: (state) => ({
                // Ne persister que certaines parties
                darkMode: state.darkMode,
                userStats: state.userStats
            })
        }
    )
);

export default useStore;