// src/components/common/ProgressBar.js

import React from 'react';
import { Coins, Flame, Brain } from 'lucide-react';

// Progress Bar
const ProgressBar = ({ userStats, grades }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-800 to-slate-700 p-4 border-t border-slate-600">
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Brain className="w-5 h-5 text-emerald-400" />
                            <span className="text-white text-sm font-medium">
                                Grade {userStats.grade} - {userStats.gradeTitle}
                            </span>
                        </div>
                        <span className="text-white text-sm flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            {userStats.ip} IP
                        </span>
                        <span className="text-white text-sm flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            {userStats.streak}j streak
                        </span>
                    </div>
                    <span className="text-white text-sm">
                        Prochain grade : {grades[userStats.grade]?.title || 'Maître de l\'Information'} ({grades[userStats.grade]?.ipRequired || 20000} IP)
                    </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                        style={{ width: `${((userStats.ip - (grades[userStats.grade - 1]?.ipRequired || 0)) / ((grades[userStats.grade]?.ipRequired || 20000) - (grades[userStats.grade - 1]?.ipRequired || 0))) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProgressBar;