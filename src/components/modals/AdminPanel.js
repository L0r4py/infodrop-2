// src/components/modals/AdminPanel.js

import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, UserPlus } from 'lucide-react';

// Panel Admin
const AdminPanel = ({ darkMode, news, onClose, onAddNews, onUpdateNews, onDeleteNews }) => {
    const [editingNews, setEditingNews] = useState(null);
    const [newNews, setNewNews] = useState({
        title: '',
        source: '',
        category: 'tech',
        orientation: 'center',
        tags: [],
        url: ''
    });

    // Fermer au clic extérieur
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleAddNews = () => {
        if (newNews.title) { 
            onAddNews({
                ...newNews,
                id: Date.now(),
                timestamp: Date.now(),
                views: 0,
                tags: newNews.tags.filter(t => t) 
            });
            setNewNews({ title: '', source: '', category: 'tech', orientation: 'center', tags: [], url: '' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-slate-900' : 'bg-white'
                } shadow-2xl`}>
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Panel Admin</h2>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className={`mb-8 p-6 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <h3 className="text-xl font-bold mb-4">Ajouter une actualité</h3>
                        <div className="grid gap-4">
                            <input
                                type="text"
                                placeholder="Titre *"
                                value={newNews.title}
                                onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                                className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-white'
                                    } focus:ring-2 focus:ring-purple-500 outline-none`}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Source"
                                    value={newNews.source}
                                    onChange={(e) => setNewNews({ ...newNews, source: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-white'
                                        }`}
                                />
                                <select
                                    value={newNews.category}
                                    onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-white'
                                        }`}
                                >
                                    <option value="tech">Tech</option>
                                    <option value="politique">Politique</option>
                                    <option value="économie">Économie</option>
                                    <option value="société">Société</option>
                                    <option value="environnement">Environnement</option>
                                </select>
                            </div>

                            <input
                                type="url"
                                placeholder="URL de l'article"
                                value={newNews.url}
                                onChange={(e) => setNewNews({ ...newNews, url: e.target.value })}
                                className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-white'
                                    }`}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleAddNews}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all"
                                >
                                    <Plus className="w-5 h-5 inline mr-2" />
                                    Ajouter
                                </button>
                                <button
                                    onClick={() => {
                                        const code = `INF-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
                                        alert(`Nouveau code de parrainage généré : ${code}`);
                                    }}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-[1.02] transition-all"
                                >
                                    <UserPlus className="w-5 h-5 inline mr-2" />
                                    Générer Code
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-4">Actualités existantes</h3>
                        {news.map(item => (
                            <div key={item.id} className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                                {editingNews?.id === item.id ? (
                                    <div className="grid gap-3">
                                        <input
                                            type="text"
                                            value={editingNews.title}
                                            onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })}
                                            className={`w-full px-3 py-2 rounded-lg ${darkMode ? 'bg-slate-700 text-white' : 'bg-white'
                                                }`}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    onUpdateNews(editingNews.id, editingNews);
                                                    setEditingNews(null);
                                                }}
                                                className="px-4 py-2 bg-green-500 text-white rounded-lg"
                                            >
                                                Sauvegarder
                                            </button>
                                            <button
                                                onClick={() => setEditingNews(null)}
                                                className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold">{item.title}</h4>
                                            <p className="text-sm text-gray-500">{item.source} • {item.category}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingNews(item)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteNews(item.id)}
                                                className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;