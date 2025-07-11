// src/components/modals/AboutPage.js

import React from 'react';
import { X } from 'lucide-react';

// Page À Propos
const AboutPage = ({ darkMode, onClose }) => {
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-white'
                } shadow-2xl`}>
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">À propos d'INFODROP</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <section>
                        <h3 className="text-xl font-bold mb-3">Le Projet</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            INFODROP est un club privé d'actualités gamifiées qui transforme la consommation d'information en mission d'intelligence.
                            Notre objectif : vous aider à sortir de votre bulle de filtre et développer une vision équilibrée de l'actualité.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold mb-3">Comment ça marche ?</h3>
                        <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                            <li>• Lisez des articles de sources variées pour gagner des IP (Insight Points)</li>
                            <li>• Diversifiez vos lectures pour améliorer votre Score de Diversité</li>
                            <li>• Montez en grade de Recrue à Maître de l'Information</li>
                            <li>• Débloquez des badges et succès exclusifs</li>
                            <li>• Analysez les sujets sous tous les angles avec INFODROP 360°</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold mb-3">Le Système de Parrainage</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                            INFODROP fonctionne sur invitation uniquement. Chaque membre reçoit 3 codes d'invitation à partager.
                        </p>
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                            <p className="font-semibold text-emerald-800 dark:text-emerald-400">
                                Bonus Parrain : 200 IP par nouveau membre actif !
                            </p>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold mb-3">L'Équipe</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Un projet 3C - By Emile Marclin & L0r4.py [AI]
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;