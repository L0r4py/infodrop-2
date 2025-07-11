// src/components/common/Logo.js

import React from 'react';
import { Newspaper } from 'lucide-react';

// Logo INFODROP
const InfodropLogo = ({ onClick }) => {
    return (
        <button onClick={onClick} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="relative w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-white" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-slate-300 to-white bg-clip-text text-transparent">
                INFODROP
            </span>
        </button>
    );
};

export default InfodropLogo;