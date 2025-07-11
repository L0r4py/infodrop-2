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
