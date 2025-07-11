// ========== src/components/modals/AchievementsPanel.jsx ==========
import React, { useState } from 'react';
import { X, Trophy, Lock, CheckCircle, Star, TrendingUp } from 'lucide-react';
import { achievements } from '../../data/achievements';
import { motion } from 'framer-motion';

export const AchievementsPanel = ({
    darkMode,
    userStats,
    onClose
}) => {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = [
        { id: 'all', name: 'Tous', count: achievements.length },
        { id: 'reading', name: 'Lecture', count: 3 },
        { id: 'social', name: 'Social', count: 2 },
        { id: 'progress', name: 'Progression', count: 4 }
    ];

    const unlockedCount = userStats.unlockedAchievements?.length || 0;
    const totalPoints = achievements
        .filter(a => userStats.unlockedAchievements?.includes(a.id))
        .reduce((sum, a) => sum + a.points, 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl ${darkMode ? 'bg-gray-900' : 'bg-white'
                    } shadow-2xl flex flex-col`}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold">Succès</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold">{unlockedCount}</div>
                            <div className="text-sm opacity-90">Débloqués</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">{achievements.length}</div>
                            <div className="text-sm opacity-90">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">{totalPoints}</div>
                            <div className="text-sm opacity-90">Points gagnés</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Progression globale</span>
                            <span>{Math.round((unlockedCount / achievements.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="flex gap-2 overflow-x-auto">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id
                                    ? 'bg-purple-500 text-white'
                                    : darkMode
                                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name} ({cat.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Achievements List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid gap-4">
                        {achievements.map(achievement => {
                            const isUnlocked = userStats.unlockedAchievements?.includes(achievement.id);
                            const progress = getAchievementProgress(achievement, userStats);

                            return (
                                <motion.div
                                    key={achievement.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`relative p-6 rounded-2xl border-2 transition-all ${isUnlocked
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : darkMode
                                            ? 'border-gray-700 bg-gray-800/50'
                                            : 'border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-4 rounded-xl ${isUnlocked
                                            ? 'bg-purple-500/20 text-purple-600'
                                            : 'bg-gray-500/20 text-gray-500'
                                            }`}>
                                            {isUnlocked ? (
                                                <achievement.icon className="w-8 h-8" />
                                            ) : (
                                                <Lock className="w-8 h-8" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className={`font-bold text-lg ${!isUnlocked && 'opacity-75'
                                                        }`}>
                                                        {achievement.name}
                                                    </h3>
                                                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                                        }`}>
                                                        {achievement.description}
                                                    </p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className={`font-bold ${isUnlocked ? 'text-purple-600' : 'text-gray-500'
                                                        }`}>
                                                        +{achievement.points} pts
                                                    </div>
                                                    {isUnlocked && (
                                                        <CheckCircle className="w-5 h-5 text-green-500 ml-auto mt-1" />
                                                    )}
                                                </div>
                                            </div>

                                            {!isUnlocked && progress !== null && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span>Progression</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className={`w-full rounded-full h-2 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                                        }`}>
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// Helper function to calculate achievement progress
const getAchievementProgress = (achievement, userStats) => {
    switch (achievement.id) {
        case 1: // Premier Pas
            return Math.min(userStats.readCount * 100, 100);
        case 2: // Lecteur Assidu
            return Math.min((userStats.readCount / 10) * 100, 100);
        case 3: // Expert Info
            return Math.min((userStats.readCount / 50) * 100, 100);
        case 4: // Streak Master
            return Math.min((userStats.streak / 7) * 100, 100);
        case 9: // Légende
            return Math.min((userStats.level / 50) * 100, 100);
        default:
            return null;
    }
};