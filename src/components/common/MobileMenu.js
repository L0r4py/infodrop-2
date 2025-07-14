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

const MobileMenu = (props) => {
    const { logout } = useAuth(); // ✅ Récupération de la fonction logout

    if (!props.isOpen) return null;

    const menuClass = props.darkMode ? 'bg-slate-800' : 'bg-white';

    const handleBackdropClick = () => props.onClose();
    const handleMenuClick = (e) => e.stopPropagation();

    return (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={handleBackdropClick}>
            <div
                className={`absolute right-0 top-0 bottom-0 w-80 ${menuClass} shadow-2xl p-6`}
                onClick={handleMenuClick}
            >
                <h2 className="text-2xl font-bold mb-6">Menu</h2>

                <div className="space-y-4">
                    <button
                        onClick={() => {
                            props.onShow360();
                            props.onClose();
                        }}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center gap-2"
                    >
                        <Activity className="w-5 h-5" />
                        INFODROP 360
                    </button>

                    {props.isAdmin && (
                        <button
                            onClick={() => {
                                props.onShowAdmin();
                                props.onClose();
                            }}
                            className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold flex items-center gap-2"
                        >
                            <Settings className="w-5 h-5" />
                            Panel Admin
                        </button>
                    )}

                    <button
                        onClick={() => {
                            props.onShowReferral();
                            props.onClose();
                        }}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold flex items-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        Code de parrainage
                    </button>

                    <button
                        onClick={() => {
                            props.onShowBadgeShop();
                            props.onClose();
                        }}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold flex items-center gap-2"
                    >
                        <Gift className="w-5 h-5" />
                        Boutique et Récompenses
                    </button>
                    <a
                        href="https://buy.stripe.com/7sYcN6fh6ez47u5ejh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold flex items-center gap-2 block text-center"
                    >
                        <CircleDollarSign className="w-5 h-5" />
                        Soutenir
                    </a>

                    <button
                        onClick={() => {
                            props.onShowAbout();
                            props.onClose();
                        }}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold flex items-center gap-2"
                    >
                        <Info className="w-5 h-5" />
                        À propos
                    </button>

                    <button
                        onClick={() => {
                            logout(); // ✅ Appel de la vraie fonction logout
                            props.onClose();
                        }}
                        className="w-full p-4 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold flex items-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Déconnexion
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;