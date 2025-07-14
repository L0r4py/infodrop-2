// src/components/common/MobileMenu.js
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
    darkMode,
    isAdmin,
    onShow360,
    onShowAdmin,
    onShowReferral,
    onShowBadgeShop,
    onShowAbout
}) => {
    const { logout, user } = useAuth(); // ✅ On récupère aussi user du contexte

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
                        {/* INFODROP 360 */}
                        <button
                            onClick={() => {
                                onShow360();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Activity size={20} />
                            <span>INFODROP 360</span>
                        </button>

                        {/* Panel Admin - Seulement si admin */}
                        {isAdmin && (
                            <button
                                onClick={() => {
                                    onShowAdmin();
                                    onClose();
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Settings size={20} />
                                <span>Panel Admin</span>
                            </button>
                        )}

                        {/* Code de parrainage */}
                        <button
                            onClick={() => {
                                onShowReferral();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <UserPlus size={20} />
                            <span>Code de parrainage</span>
                        </button>

                        {/* Boutique et Récompenses */}
                        <button
                            onClick={() => {
                                onShowBadgeShop();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Gift size={20} />
                            <span>Boutique et Récompenses</span>
                        </button>

                        {/* Lien de donation Stripe */}
                        <a
                            href="https://buy.stripe.com/7sYcN6fh6ez47u5ejh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <CircleDollarSign size={20} />
                            <span>Soutenir</span>
                        </a>

                        {/* À propos */}
                        <button
                            onClick={() => {
                                onShowAbout();
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
                                logout();
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