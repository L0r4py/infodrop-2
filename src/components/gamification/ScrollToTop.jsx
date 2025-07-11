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