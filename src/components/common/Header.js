// src/components/common/Header.js

import React from 'react';
import { Menu } from 'lucide-react';
import InfodropLogo from './Logo';

const Header = ({ userStats, onMenuClick }) => {
    return (
        <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg border-b border-slate-700">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <InfodropLogo onClick={() => window.location.reload()} />

                    <button
                        onClick={onMenuClick}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;