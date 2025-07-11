// src/components/modals/RewardsCenter.js

import React, { useState } from 'react';
import { X, Gift, Trophy, Award, Coins, Unlock, Lock } from 'lucide-react';
import { Shield, Target, Crown, Diamond, Users, Activity, Moon, Brain } from 'lucide-react';

// Badges disponibles dans la boutique
const badges = [
    { id: 1, name: "Badge Analyste", description: "Badge de base pour les analystes confirmés", cost: 100, icon: <Shield className="w-6 h-6" />, color: "text-blue-500" },
    { id: 2, name: "Badge Diversité", description: "Pour les champions de la diversité", cost: 500, icon: <Target className="w-6 h-6" />, color: "text-emerald-500" },
    { id: 3, name: "Badge Elite", description: "Réservé aux meilleurs analystes", cost: 1000, icon: <Crown className="w-6 h-6" />, color: "text-yellow-500" },
    { id: 4, name: "Badge Influenceur", description: "Pour les recruteurs talentueux", cost: 750, icon: <Users className="w-6 h-6" />, color: "text-purple-500" },
    { id: 5, name: "Badge Légendaire", description: "Le badge ultime d'INFODROP", cost: 5000, icon: <Diamond className="w-6 h-6" />, color: "text-pink-500" }
];

// Succès difficiles
const succes = [
    { id: 1, name: "Marathon de l'Info", description: "Lire 50 articles en 24h", icon: <Activity className="w-8 h-8" />, points: 500, unlocked: false },
    { id: 2, name: "Équilibriste Parfait", description: "Maintenir 100% de diversité pendant 30 jours", icon: <Target className="w-8 h-8" />, points: 1000, unlocked: false },
    { id: 3, name: "Ambassadeur d'Élite", description: "Parrainer 10 analystes actifs", icon: <Users className="w-8 h-8" />, points: 2000, unlocked: false },
    { id: 4, name: "Noctambule de l'Info", description: "Se connecter entre 2h et 5h du matin 7 jours consécutifs", icon: <Moon className="w-8 h-8" />, points: 750, unlocked: false },
    { id: 5, name: "Caméléon Politique", description: "Lire 100 articles de chaque orientation", icon: <Shield className="w-8 h-8" />, points: 3000, unlocked: false }
];

// Accréditations
const accreditations = [
    { id: 1, name: "Détective Débutant", description: "Lire 10 articles", points: 10, locked: true },
    { id: 2, name: "Journaliste d'Investigation", description: "Lire 100 articles", points: 50, locked: true },
    { id: 3, name: "Archiviste en Chef", description: "Lire 500 articles", points: 200, locked: true },
    { id: 4, name: "Agent Ponctuel", description: "7 jours de streak", points: 100, locked: true },
    { id: 5, name: "Esprit Ouvert", description: "Diversité Score > 70%", points: 75, locked: true },
    { id: 6, name: "Recruteur d'Élite", description: "Parrainer 1 agent", points: 200, locked: true }
];

// Composant unifié Boutique & Récompenses
const RewardsCenter = ({ darkMode, userStats, onClose, onPurchase }) => {
    const [activeTab, setActiveTab] = useState('boutique');

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-white'
                } shadow-2xl`}>
                <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Centre de Récompenses</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <Coins className="w-5 h-5" />
                        <span className="text-xl font-bold">{userStats.ip} IP</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('boutique')}
                        className={`flex-1 py-4 font-semibold transition-colors ${activeTab === 'boutique'
                                ? 'text-yellow-500 border-b-2 border-yellow-500'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <Gift className="w-5 h-5 inline mr-2" />
                        Boutique
                    </button>
                    <button
                        onClick={() => setActiveTab('succes')}
                        className={`flex-1 py-4 font-semibold transition-colors ${activeTab === 'succes'
                                ? 'text-purple-500 border-b-2 border-purple-500'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <Trophy className="w-5 h-5 inline mr-2" />
                        Succès
                    </button>
                    <button
                        onClick={() => setActiveTab('accreditations')}
                        className={`flex-1 py-4 font-semibold transition-colors ${activeTab === 'accreditations'
                                ? 'text-emerald-500 border-b-2 border-emerald-500'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        <Award className="w-5 h-5 inline mr-2" />
                        Accréditations
                    </button>
                </div>

                <div className="p-6">
                    {/* Boutique */}
                    {activeTab === 'boutique' && (
                        <div className="grid gap-4">
                            {badges.map(badge => {
                                const canAfford = userStats.ip >= badge.cost;
                                const isPurchased = userStats.purchasedBadges?.includes(badge.id);

                                return (
                                    <div
                                        key={badge.id}
                                        className={`p-4 rounded-xl border-2 ${isPurchased ? 'border-green-500 bg-green-500/10' :
                                                canAfford ? 'border-gray-300 hover:border-yellow-500' :
                                                    'border-gray-300 opacity-50'
                                            } transition-all`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${isPurchased ? 'bg-green-500/20' :
                                                        canAfford ? 'bg-yellow-500/20' :
                                                            'bg-gray-500/20'
                                                    }`}>
                                                    <div className={badge.color}>{badge.icon}</div>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg">{badge.name}</h3>
                                                    <p className="text-sm text-gray-500">{badge.description}</p>
                                                </div>
                                            </div>

                                            {isPurchased ? (
                                                <div className="flex items-center gap-2 text-green-500">
                                                    <Unlock className="w-5 h-5" />
                                                    <span className="font-bold">Possédé</span>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => onPurchase(badge)}
                                                    disabled={!canAfford}
                                                    className={`px-6 py-2 rounded-lg font-bold transition-all ${canAfford
                                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:shadow-lg transform hover:scale-105'
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {badge.cost} IP
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Succès */}
                    {activeTab === 'succes' && (
                        <div className="grid gap-4">
                            {succes.map(achievement => {
                                const isUnlocked = userStats.unlockedSucces?.includes(achievement.id);

                                return (
                                    <div
                                        key={achievement.id}
                                        className={`p-4 rounded-xl border-2 transition-all ${isUnlocked
                                                ? 'border-purple-500 bg-purple-500/10'
                                                : 'border-gray-300 dark:border-gray-700 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-purple-500/20 text-purple-600' : 'bg-gray-500/20 text-gray-500'
                                                }`}>
                                                {isUnlocked ? achievement.icon : <Lock className="w-8 h-8" />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{achievement.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${isUnlocked ? 'text-purple-600' : 'text-gray-500'}`}>
                                                    +{achievement.points} IP
                                                </div>
                                                {isUnlocked && <div className="text-xs text-green-500">✓ Débloqué</div>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Accréditations */}
                    {activeTab === 'accreditations' && (
                        <div className="grid gap-4">
                            {accreditations.map(accreditation => {
                                const isUnlocked = userStats.unlockedAccreditations?.includes(accreditation.id);

                                return (
                                    <div
                                        key={accreditation.id}
                                        className={`p-4 rounded-xl border-2 transition-all ${isUnlocked
                                                ? 'border-emerald-500 bg-emerald-500/10'
                                                : 'border-gray-300 dark:border-gray-700 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${isUnlocked ? 'bg-emerald-500/20' : 'bg-gray-500/20'
                                                }`}>
                                                {isUnlocked ? <Unlock className="w-6 h-6 text-emerald-600" /> : <Lock className="w-6 h-6 text-gray-500" />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg">{accreditation.name}</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{accreditation.description}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`font-bold ${isUnlocked ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                    +{accreditation.points} IP
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RewardsCenter;