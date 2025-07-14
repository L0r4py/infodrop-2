// src/components/common/MobileMenu.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext'; // ✅ Import du hook useAuth
import {
    Activity,
    Settings,
    UserPlus,
    Gift,
    CircleDollarSign,
    Info,
    LogOut,
} from 'lucide-react';

const MobileMenu = ({
    isOpen,
    onClose,
    user,
    handleSettingsClick,
    handleParrainageClick,
    handleRewardsClick,
    handleDonateClick,
    handleAboutClick,
    handleStatsClick
}) => {
    // ✅ Récupération directe de la fonction logout depuis le contexte
    const { logout } = useAuth();

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay sombre */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Menu mobile */}
            <div className={`fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4">
                    {/* En-tête avec infos utilisateur */}
                    <div className="mb-6 pb-4 border-b dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {user?.username || 'Utilisateur'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {user?.email}
                        </p>
                    </div>

                    {/* Menu items */}
                    <nav className="space-y-2">
                        <button
                            onClick={() => {
                                handleStatsClick();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Activity size={20} />
                            <span>Mes Statistiques</span>
                        </button>

                        <button
                            onClick={() => {
                                handleSettingsClick();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Settings size={20} />
                            <span>Paramètres</span>
                        </button>

                        <button
                            onClick={() => {
                                handleParrainageClick();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <UserPlus size={20} />
                            <span>Parrainer</span>
                        </button>

                        <button
                            onClick={() => {
                                handleRewardsClick();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Gift size={20} />
                            <span>Récompenses</span>
                        </button>

                        <button
                            onClick={() => {
                                handleDonateClick();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <CircleDollarSign size={20} />
                            <span>Faire un don</span>
                        </button>

                        <button
                            onClick={() => {
                                handleAboutClick();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Info size={20} />
                            <span>À propos</span>
                        </button>

                        {/* Séparateur */}
                        <div className="my-4 border-t dark:border-gray-700" />

                        {/* Bouton de déconnexion */}
                        <button
                            onClick={() => {
                                logout(); // ✅ Appel direct de la fonction logout du contexte
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        >
                            <LogOut size={20} />
                            <span>Déconnexion</span>
                        </button>
                    </nav>
                </div>
            </div>
        </>
    );
};

export default MobileMenu;