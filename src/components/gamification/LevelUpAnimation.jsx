// ========== src/components/gamification/LevelUpAnimation.jsx ==========
import React, { useEffect } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const LevelUpAnimation = ({ level }) => {
    useEffect(() => {
        // Déclencher les confettis
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            }));
            confetti(Object.assign({}, defaults, {
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            }));
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
                <motion.div
                    initial={{ y: 50 }}
                    animate={{ y: 0 }}
                    className="relative"
                >
                    {/* Cercles animés en arrière-plan */}
                    <motion.div
                        animate={{
                            scale: [1, 2, 2, 1, 1],
                            opacity: [0.3, 0.5, 0.5, 0.3, 0.3],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl"
                        style={{ width: 300, height: 300, left: -100, top: -100 }}
                    />

                    <motion.div
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="absolute inset-0"
                        style={{ width: 100, height: 100, left: 50, top: 50 }}
                    >
                        <Sparkles className="w-full h-full text-yellow-300" />
                    </motion.div>

                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                        className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 text-white px-12 py-8 rounded-3xl shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/20 blur-xl" />
                        <div className="relative text-center">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: 3 }}
                            >
                                <Trophy className="w-20 h-20 mx-auto mb-4" />
                            </motion.div>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl font-bold mb-2"
                            >
                                Niveau {level}!
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-xl"
                            >
                                Félicitations! 🎉
                            </motion.p>

                            {/* Étoiles animées */}
                            <div className="absolute -top-8 -left-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Star className="w-16 h-16 text-yellow-300" />
                                </motion.div>
                            </div>
                            <div className="absolute -bottom-8 -right-8">
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                    <Star className="w-12 h-12 text-yellow-300" />
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ========== src/components/gamification/ProgressBar.jsx ==========
import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProgressBar = ({ level, points }) => {
    const currentLevelPoints = (level - 1) * 100;
    const nextLevelPoints = level * 100;
    const progressInLevel = points - currentLevelPoints;
    const progressPercentage = (progressInLevel / 100) * 100;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 p-4 shadow-2xl">
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-white" />
                        <span className="text-white font-bold">Niveau {level}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                        <span className="text-sm">{progressInLevel}/100 pts</span>
                        <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                </div>

                <div className="relative">
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                        <motion.div
                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                            {/* Effet de brillance */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{
                                    x: ['-100%', '200%'],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                }}
                            />
                        </motion.div>
                    </div>

                    {/* Indicateurs de milestone */}
                    <div className="absolute top-0 left-0 w-full h-3 flex">
                        {[25, 50, 75].map((milestone) => (
                            <div
                                key={milestone}
                                className="absolute h-full w-px bg-white/40"
                                style={{ left: `${milestone}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Next level preview */}
                <div className="mt-2 text-xs text-white/80 text-center">
                    {100 - progressInLevel} points jusqu'au niveau {level + 1}
                </div>
            </div>
        </div>
    );
};

// ========== src/components/gamification/QuickActions.jsx ==========
import React from 'react';
import { Gift, Trophy, Zap, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export const QuickActions = ({ onShowRewards, onShowAchievements }) => {
    const actions = [
        {
            icon: Gift,
            label: 'Boutique',
            onClick: onShowRewards,
            gradient: 'from-yellow-500 to-orange-500',
            animation: 'bounce'
        },
        {
            icon: Trophy,
            label: 'Succès',
            onClick: onShowAchievements,
            gradient: 'from-purple-500 to-blue-500',
            animation: 'pulse'
        }
    ];

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex gap-4 justify-center">
                {actions.map((action, index) => (
                    <motion.button
                        key={action.label}
                        onClick={action.onClick}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${action.gradient} text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all overflow-hidden`}
                    >
                        {/* Effet de brillance au hover */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 0.5 }}
                        />

                        <action.icon className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">{action.label}</span>

                        {/* Badge de notification */}
                        {action.label === 'Succès' && (
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                            />
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Daily Bonus */}
            <DailyBonus />
        </div>
    );
};

const DailyBonus = () => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 max-w-md mx-auto"
        >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 blur-xl" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Bonus Quotidien
                        </h3>
                        <p className="text-sm opacity-90">Revenez chaque jour!</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">+10</div>
                        <div className="text-xs">points/jour</div>
                    </div>
                </div>
                <motion.div
                    className="mt-3 grid grid-cols-7 gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    {[...Array(7)].map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full ${i < 3 ? 'bg-yellow-400' : 'bg-white/30'
                                }`}
                        />
                    ))}
                </motion.div>
            </div>
        </motion.div>
    );
};

// ========== src/components/common/ScrollToTop.jsx ==========
import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ScrollToTop = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={scrollToTop}
                    className="fixed bottom-24 right-6 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all z-40"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronUp className="w-6 h-6" />
                </motion.button>
            )}
        </AnimatePresence>
    );
};

// ========== src/data/categories.js ==========
export const categories = [
    {
        id: 'all',
        name: 'Tout',
        icon: '🌍',
        color: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
        id: 'tech',
        name: 'Tech',
        icon: '💻',
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    },
    {
        id: 'crypto',
        name: 'Crypto',
        icon: '₿',
        color: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    },
    {
        id: 'science',
        name: 'Science',
        icon: '🔬',
        color: 'bg-gradient-to-r from-green-500 to-teal-500'
    },
    {
        id: 'sport',
        name: 'Sport',
        icon: '⚽',
        color: 'bg-gradient-to-r from-red-500 to-pink-500'
    },
    {
        id: 'business',
        name: 'Business',
        icon: '💼',
        color: 'bg-gradient-to-r from-indigo-500 to-purple-500'
    },
    {
        id: 'entertainment',
        name: 'Divertissement',
        icon: '🎬',
        color: 'bg-gradient-to-r from-pink-500 to-rose-500'
    }
];

// ========== src/components/news/CategoryFilter.jsx ==========
import React from 'react';
import { categories } from '../../data/categories';
import { motion } from 'framer-motion';

export const CategoryFilter = ({ selectedCategory, onSelectCategory, darkMode }) => {
    return (
        <div className="sticky top-[120px] lg:top-[64px] z-30 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-lg p-4">
            <div className="container mx-auto">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((category, index) => (
                        <motion.button
                            key={category.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelectCategory(category.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${selectedCategory === category.id
                                    ? `${category.color} text-white shadow-lg transform scale-110`
                                    : darkMode
                                        ? 'bg-gray-800 hover:bg-gray-700'
                                        : 'bg-white hover:bg-gray-100 shadow-md'
                                }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-xl">{category.icon}</span>
                            {category.name}
                            {selectedCategory === category.id && (
                                <motion.div
                                    layoutId="categoryIndicator"
                                    className="absolute inset-0 rounded-full ring-2 ring-white/50 ring-offset-2 ring-offset-transparent"
                                />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ========== src/components/news/NewsGrid.jsx ==========
import React from 'react';
import { NewsCard } from './NewsCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper } from 'lucide-react';

export const NewsGrid = ({ news, onReadNews, darkMode }) => {
    if (news.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20">
                <div className="text-center">
                    <Newspaper className="w-20 h-20 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-bold mb-2">Aucune actualité disponible</h3>
                    <p className="text-gray-500">
                        Les nouvelles actualités apparaîtront ici
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 pb-32">
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                layout
            >
                <AnimatePresence>
                    {news.map((item, index) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <NewsCard
                                news={item}
                                onRead={onReadNews}
                                darkMode={darkMode}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </main>
    );
};

// ========== src/components/layout/Layout.jsx ==========
import React from 'react';

export const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {children}
        </div>
    );
};

// ========== src/hooks/useTheme.js ==========
import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const toggleDarkMode = () => setDarkMode(!darkMode);

    return { darkMode, toggleDarkMode };
};

// ========== src/services/supabase.js (complet) ==========
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const initializeApp = async () => {
    // Vérifier la connexion à Supabase
    const { data, error } = await supabase.from('news').select('count');
    if (error) {
        console.error('Erreur de connexion à Supabase:', error);
    } else {
        console.log('Connecté à Supabase avec succès');
    }
};