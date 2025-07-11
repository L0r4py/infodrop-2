// src/components/modals/Infodrop360.js

import React, { useState } from 'react';
import { Activity, X } from 'lucide-react';

// Couleurs des orientations politiques
const POLITICAL_COLORS = {
    'extreme-left': '#dc3545',
    'left': '#e74c3c',
    'center-left': '#ec7063',
    'center': '#6c757d',
    'center-right': '#5dade2',
    'right': '#3498db',
    'extreme-right': '#2980b9'
};

// INFODROP 360°
const Infodrop360 = ({ darkMode, onClose }) => {
    const [selectedTopic, setSelectedTopic] = useState(null);

    const topics = [
        {
            id: 1,
            title: "Crise de l'eau à Mayotte",
            date: "10 janvier 2025",
            divergenceScore: 78,
            analyses: [
                { source: "France Info", orientation: "center", angle: "Urgence humanitaire et responsabilité de l'État" },
                { source: "Valeurs Actuelles", orientation: "right", angle: "Échec de la gestion locale et immigration" },
                { source: "Libération", orientation: "left", angle: "Conséquences du changement climatique et inégalités" },
                { source: "Le Figaro", orientation: "center-right", angle: "Défaillances infrastructurelles et solutions techniques" }
            ]
        }
    ];

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-white'
                } shadow-2xl`}>
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Activity className="w-7 h-7" />
                            INFODROP 360°
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="mt-2 text-sm opacity-90">
                        Analyses multi-perspectives des sujets brûlants
                    </p>
                </div>

                <div className="p-6">
                    {selectedTopic ? (
                        <div>
                            <button
                                onClick={() => setSelectedTopic(null)}
                                className="mb-4 text-blue-500 hover:text-blue-600"
                            >
                                ← Retour aux sujets
                            </button>

                            <h3 className="text-2xl font-bold mb-4">{selectedTopic.title}</h3>
                            <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                                <span>{selectedTopic.date}</span>
                                <span className="flex items-center gap-2">
                                    Score de divergence:
                                    <span className={`font-bold ${selectedTopic.divergenceScore > 70 ? 'text-red-500' :
                                            selectedTopic.divergenceScore > 40 ? 'text-yellow-500' :
                                                'text-green-500'
                                        }`}>
                                        {selectedTopic.divergenceScore}%
                                    </span>
                                </span>
                            </div>

                            <div className="space-y-4">
                                {selectedTopic.analyses.map((analysis, index) => (
                                    <div key={index} className={`p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-gray-100'
                                        }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-bold">{analysis.source}</h4>
                                            <span
                                                className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                                                style={{ backgroundColor: POLITICAL_COLORS[analysis.orientation] }}
                                            >
                                                {analysis.orientation}
                                            </span>
                                        </div>
                                        <p className="text-sm">{analysis.angle}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {topics.map(topic => (
                                <div
                                    key={topic.id}
                                    onClick={() => setSelectedTopic(topic)}
                                    className={`p-6 rounded-lg cursor-pointer transition-all hover:shadow-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                >
                                    <h3 className="text-xl font-bold mb-2">{topic.title}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">{topic.date}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm">
                                                {topic.analyses.length} perspectives
                                            </span>
                                            <span className={`font-bold ${topic.divergenceScore > 70 ? 'text-red-500' :
                                                    topic.divergenceScore > 40 ? 'text-yellow-500' :
                                                        'text-green-500'
                                                }`}>
                                                {topic.divergenceScore}% divergence
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Infodrop360;