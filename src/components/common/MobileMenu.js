// src/components/common/MobileMenu.js
// VERSION CORRIGÉE - Utilise directement le contexte pour les infos utilisateur

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
    X as CloseIcon // Renommer X pour éviter les conflits
} from 'lucide-react';

const MobileMenu = ({
    isOpen,
    onClose,
    onShow360,
    onShowAdmin,
    onShowReferral,
    onShowBadgeShop,
    onShowAbout
}) => {
    // ✅ On récupère toutes les infos directement depuis le contexte
    const { logout, user, isAdmin, userProfile } = useAuth();

    if (!isOpen) return null;

    // Utilise le 'username' du profil public s'il existe, sinon l'email
    const displayName = userProfile?.username || user?.email?.split('@')[0] || 'Utilisateur';
    const displayEmail = user?.email || 'Non connecté';

    return (
        <>
            {/* Overlay sombre */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Menu mobile */}
            <aside className={`fixed right-0 top-0 h-full w-72 bg-white dark:bg-slate-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* En-tête du menu */}
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                                {displayName}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
                                aria-label="Fermer le menu"
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {displayEmail}
                        </p>
                    </div>

                    {/* Contenu principal du menu (scrollable) */}
                    <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                        <MenuItem icon={<Activity size={20} />} label="INFODROP 360" onClick={onShow360} onClose={onClose} />
                        {isAdmin && <MenuItem icon={<Settings size={20} />} label="Panel Admin" onClick={onShowAdmin} onClose={onClose} />}
                        <MenuItem icon={<UserPlus size={20} />} label="Code de parrainage" onClick={onShowReferral} onClose={onClose} />
                        <MenuItem icon={<Gift size={20} />} label="Boutique et Récompenses" onClick={onShowBadgeShop} onClose={onClose} />
                        <MenuItem icon={<Info size={20} />} label="À propos" onClick={onShowAbout} onClose={onClose} />

                        {/* Lien externe (pas un bouton) */}
                        <a
                            href="https://buy.stripe.com/7sYcN6fh6ez4g65ejh" // Lien corrigé
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <CircleDollarSign size={20} />
                            <span>Soutenir le projet</span>
                        </a>
                    </nav>

                    {/* Footer du menu (déconnexion) */}
                    <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                        <button
                            onClick={() => {
                                logout();
                                onClose();
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Déconnexion</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

// Composant interne pour la consistance des items du menu
const MenuItem = ({ icon, label, onClick, onClose }) => (
    <button
        onClick={() => { onClick(); onClose(); }}
        className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
    >
        {icon}
        <span>{label}</span>
    </button>
);


export default MobileMenu;