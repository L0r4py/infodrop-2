// src/components/modals/ReferralModal.js

import React from 'react';
import { UserPlus, X } from 'lucide-react';

// Modal Code de Parrainage
const ReferralModal = ({ darkMode, userStats, onClose }) => {
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(userStats.referralCode);
        alert('Code copié !');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className={`w-full max-w-md rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-white'
                } shadow-2xl`}>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <UserPlus className="w-7 h-7" />
                            Code de parrainage
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <p className="text-lg mb-4">Votre code exclusif</p>
                        <div className="bg-purple-600 text-white px-6 py-3 rounded-lg text-2xl font-mono font-bold inline-block">
                            {userStats.referralCode}
                        </div>
                        <button
                            onClick={copyCode}
                            className="mt-3 block mx-auto text-sm text-purple-500 hover:text-purple-600"
                        >
                            📋 Copier le code
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <h3 className="font-bold mb-2">Comment ça marche ?</h3>
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <li>• Partagez votre code avec vos amis</li>
                                <li>• Ils l'utilisent lors de leur inscription</li>
                                <li>• Vous gagnez 200 IP par filleul actif</li>
                                <li>• Votre filleul obtient 50 IP de bonus</li>
                            </ul>
                        </div>

                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold">Parrain</span>
                                <span className="text-sm">{userStats.referredBy}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-bold">Filleuls actifs</span>
                                <span className="text-sm">{userStats.referredMembers}</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                INFODROP fonctionne sur invitation uniquement
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReferralModal;