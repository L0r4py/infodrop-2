// src/components/stats/StatsSection.js

import React, { useState, useEffect } from 'react';

// Section Stats
const StatsSection = ({ darkMode }) => {
    const [stats, setStats] = useState({
        articlesLast24h: 234,
        activeSources: 65,
        connectedMembers: 11
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                connectedMembers: prev.connectedMembers + Math.floor(Math.random() * 5 - 2)
            }));
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-50'} mb-6`}>
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{stats.articlesLast24h}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Articles publiés ces 24h</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-500">{stats.activeSources}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sources actives</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">{stats.connectedMembers}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Membres connectés</div>
                </div>
            </div>
        </div>
    );
};

export default StatsSection;