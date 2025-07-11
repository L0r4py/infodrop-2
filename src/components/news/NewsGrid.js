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
