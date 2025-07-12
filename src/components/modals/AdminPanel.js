// src/components/modals/AdminPanel.js
// Exemple d'utilisation des fonctions CRUD

import React, { useState } from 'react';
import { X } from 'lucide-react';

const AdminPanel = ({ darkMode, news, onClose, onAddNews, onUpdateNews, onDeleteNews }) => {
    const [formData, setFormData] = useState({
        title: '',
        source: '',
        url: '',
        orientation: 'neutre',
        category: 'généraliste',
        tags: []
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Gérer l'ajout d'un article
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const result = await onAddNews({
                ...formData,
                tags: formData.tags.filter(tag => tag.trim() !== '')
            });

            if (result.success) {
                setMessage('✅ Article ajouté avec succès !');
                setFormData({
                    title: '',
                    source: '',
                    url: '',
                    orientation: 'neutre',
                    category: 'généraliste',
                    tags: []
                });
            } else {
                setMessage(`❌ Erreur : ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Erreur : ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Gérer la mise à jour
    const handleUpdate = async (id) => {
        setLoading(true);
        setMessage('');

        try {
            const result = await onUpdateNews(id, formData);

            if (result.success) {
                setMessage('✅ Article mis à jour !');
                setEditingId(null);
                setFormData({
                    title: '',
                    source: '',
                    url: '',
                    orientation: 'neutre',
                    category: 'généraliste',
                    tags: []
                });
            } else {
                setMessage(`❌ Erreur : ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Erreur : ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Gérer la suppression
    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;

        setLoading(true);
        setMessage('');

        try {
            const result = await onDeleteNews(id);

            if (result.success) {
                setMessage('✅ Article supprimé !');
            } else {
                setMessage(`❌ Erreur : ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Erreur : ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Préparer l'édition
    const startEdit = (article) => {
        setEditingId(article.id);
        setFormData({
            title: article.title,
            source: article.source,
            url: article.url,
            orientation: article.orientation,
            category: article.category,
            tags: article.tags || []
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className={`
                w-full max-w-4xl max-h-[90vh] m-4 rounded-lg overflow-hidden
                ${darkMode ? 'bg-slate-800' : 'bg-white'}
            `}>
                {/* Header */}
                <div className={`
                    flex items-center justify-between p-6 border-b
                    ${darkMode ? 'border-slate-700' : 'border-gray-200'}
                `}>
                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Administration
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenu */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                    {/* Message */}
                    {message && (
                        <div className={`
                            mb-4 p-3 rounded-lg text-sm
                            ${message.includes('✅')
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }
                        `}>
                            {message}
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={editingId ? (e) => {
                        e.preventDefault();
                        handleUpdate(editingId);
                    } : handleSubmit} className="mb-6 space-y-4">
                        <div>
                            <label className={`block mb-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Titre
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={`
                                    w-full px-3 py-2 rounded-lg border
                                    ${darkMode
                                        ? 'bg-slate-700 border-slate-600 text-white'
                                        : 'bg-white border-gray-300'
                                    }
                                `}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block mb-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Source
                                </label>
                                <input
                                    type="text"
                                    value={formData.source}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                    className={`
                                        w-full px-3 py-2 rounded-lg border
                                        ${darkMode
                                            ? 'bg-slate-700 border-slate-600 text-white'
                                            : 'bg-white border-gray-300'
                                        }
                                    `}
                                    required
                                />
                            </div>

                            <div>
                                <label className={`block mb-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className={`
                                        w-full px-3 py-2 rounded-lg border
                                        ${darkMode
                                            ? 'bg-slate-700 border-slate-600 text-white'
                                            : 'bg-white border-gray-300'
                                        }
                                    `}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block mb-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Orientation
                                </label>
                                <select
                                    value={formData.orientation}
                                    onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
                                    className={`
                                        w-full px-3 py-2 rounded-lg border
                                        ${darkMode
                                            ? 'bg-slate-700 border-slate-600 text-white'
                                            : 'bg-white border-gray-300'
                                        }
                                    `}
                                >
                                    <option value="extreme-gauche">Extrême Gauche</option>
                                    <option value="gauche">Gauche</option>
                                    <option value="centre-gauche">Centre Gauche</option>
                                    <option value="centre">Centre</option>
                                    <option value="centre-droit">Centre Droit</option>
                                    <option value="droite">Droite</option>
                                    <option value="extreme-droite">Extrême Droite</option>
                                    <option value="neutre">Neutre</option>
                                </select>
                            </div>

                            <div>
                                <label className={`block mb-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Catégorie
                                </label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className={`
                                        w-full px-3 py-2 rounded-lg border
                                        ${darkMode
                                            ? 'bg-slate-700 border-slate-600 text-white'
                                            : 'bg-white border-gray-300'
                                        }
                                    `}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    px-4 py-2 rounded-lg font-medium
                                    ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }
                                `}
                            >
                                {loading ? 'Chargement...' : (editingId ? 'Mettre à jour' : 'Ajouter')}
                            </button>

                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({
                                            title: '',
                                            source: '',
                                            url: '',
                                            orientation: 'neutre',
                                            category: 'généraliste',
                                            tags: []
                                        });
                                    }}
                                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
                                >
                                    Annuler
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Liste des articles récents */}
                    <div>
                        <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Articles récents
                        </h3>

                        <div className="space-y-2">
                            {news.slice(0, 10).map(article => (
                                <div
                                    key={article.id}
                                    className={`
                                        p-3 rounded-lg border
                                        ${darkMode
                                            ? 'bg-slate-700 border-slate-600'
                                            : 'bg-gray-50 border-gray-200'
                                        }
                                    `}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {article.title}
                                            </h4>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {article.source} • {article.orientation}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => startEdit(article)}
                                                className="text-blue-500 hover:text-blue-600 text-sm"
                                            >
                                                Éditer
                                            </button>
                                            <button
                                                onClick={() => handleDelete(article.id)}
                                                className="text-red-500 hover:text-red-600 text-sm"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;