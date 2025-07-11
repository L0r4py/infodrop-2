// src/components/TestSupabase.js
import React, { useState, useEffect } from 'react';
import { testConnection, db, isSupabaseConfigured } from '../lib/supabase';

const TestSupabase = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        setLoading(true);
        setError(null);

        try {
            // Vérifier si Supabase est configuré
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase non configuré. Vérifiez vos variables d\'environnement.');
            }

            // Tester la connexion
            const connected = await testConnection();
            setIsConnected(connected);

            // Si connecté, récupérer les sources
            if (connected) {
                const { data, error: sourcesError } = await db.sources.getAll({ active: true });

                if (sourcesError) {
                    throw sourcesError;
                }

                setSources(data || []);
            }
        } catch (err) {
            console.error('Erreur:', err);
            setError(err.message);
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    };

    // Grouper les sources par orientation
    const groupSourcesByOrientation = () => {
        const grouped = {};
        sources.forEach(source => {
            const orientation = source.orientation || 'non-défini';
            if (!grouped[orientation]) {
                grouped[orientation] = [];
            }
            grouped[orientation].push(source);
        });
        return grouped;
    };

    if (loading) {
        return <div className="p-4">⏳ Chargement...</div>;
    }

    const groupedSources = groupSourcesByOrientation();

    return (
        <div className="p-4 bg-gray-900 text-white rounded-lg">
            <h2 className="text-xl font-bold mb-4">🔌 Test Connexion Supabase</h2>

            <div className="mb-4">
                <p className="flex items-center gap-2">
                    État: {isConnected ? (
                        <span className="text-green-400">✅ Connecté</span>
                    ) : (
                        <span className="text-red-400">❌ Déconnecté</span>
                    )}
                </p>

                {error && (
                    <p className="text-red-400 text-sm mt-2">
                        Erreur: {error}
                    </p>
                )}
            </div>

            {isConnected && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">
                        📰 Sources ({sources.length})
                    </h3>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {Object.entries(groupedSources).map(([orientation, sources]) => (
                            <div key={orientation} className="bg-gray-800 p-3 rounded">
                                <h4 className={`font-semibold mb-2 ${orientation === 'gauche' || orientation === 'extrême-gauche' ? 'text-red-400' :
                                        orientation === 'droite' || orientation === 'extrême-droite' ? 'text-blue-400' :
                                            orientation === 'centre' ? 'text-gray-400' :
                                                orientation === 'gouvernement' ? 'text-purple-400' :
                                                    'text-green-400'
                                    }`}>
                                    {orientation.charAt(0).toUpperCase() + orientation.slice(1)} ({sources.length})
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {sources.map((source) => (
                                        <div
                                            key={source.id}
                                            className="bg-gray-700 p-2 rounded text-sm"
                                        >
                                            <div className="font-medium">{source.name}</div>
                                            <div className="text-xs text-gray-400">
                                                {source.tags?.join(', ')}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={checkConnection}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                disabled={loading}
            >
                🔄 Rafraîchir
            </button>
        </div>
    );
};

export default TestSupabase;