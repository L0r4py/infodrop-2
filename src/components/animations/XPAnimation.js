// src/components/animations/XPAnimation.js

import React from 'react';
import { CheckCircle } from 'lucide-react';

// Animation XP
const XPAnimation = ({ show, points }) => {
    if (!show) return null;

    return (
        <div className="fixed bottom-4 right-4 animate-slide-up z-50">
            <div className="bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-bold">+{points} IP</span>
            </div>
        </div>
    );
};

export default XPAnimation;