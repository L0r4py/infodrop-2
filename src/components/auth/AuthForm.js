// src/components/auth/AuthForm.js
// Formulaire de connexion adapté pour fonctionner comme la V1

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Loader, CheckCircle, AlertCircle, Info, Key } from 'lucide-react';

const AuthForm = ({ darkMode = true }) => {
    const { login } = useAuth(); // ✅ On utilise login comme dans V1
    const [email, setEmail] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation basique
        if (!email || !email.includes('@')) {
            setMessage('Veuillez entrer une adresse email valide');
            setMessageType('error');
            return;
        }

        setLoading(true);
        setMessage('');

        // ✅ On utilise login avec email et code (comme dans V1)
        const result = await login(email.toLowerCase(), inviteCode);

        if (result.success) {
            setEmailSent(true);
            setMessage(result.message);
            setMessageType('success');
        } else {
            setMessage(result.error);
            setMessageType('error');
        }

        setLoading(false);
    };

    const resetForm = () => {
        setEmail('');
        setInviteCode('');
        setEmailSent(false);
        setMessage('');
        setMessageType('');
    };

    return (
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="w-full max-w-md px-4">
                {/* Logo et titre */}
                <div className="text-center mb-8">
                    <h1 className={`text-3xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        📰 INFODROP
                    </h1>
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Le Club privé de l'actu centralisée
                    </p>
                </div>

                {/* Card principale */}
                <div className={`rounded-lg shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700' : 'bg-white'}`}>
                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="p-8 space-y-4">
                            {/* Champ email */}
                            <div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${darkMode
                                        ? 'bg-gray-900 border border-gray-600 text-white placeholder-gray-500'
                                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                                        }`}
                                    placeholder="votre@email.com"
                                />
                            </div>

                            {/* Champ code d'invitation */}
                            <div>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${darkMode
                                        ? 'bg-gray-900 border border-gray-600 text-white placeholder-gray-500'
                                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                                        }`}
                                    placeholder="Code d'invitation (si nouveau)"
                                />
                            </div>

                            {/* Bouton de connexion */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading
                                    ? 'bg-indigo-800 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700'
                                    } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader className="w-5 h-5 animate-spin" />
                                        Envoi en cours...
                                    </span>
                                ) : (
                                    'Recevoir le lien magique'
                                )}
                            </button>

                            {/* Lien d'aide */}
                            <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                                💡 Pas de code ? Suivez{' '}
                                <a
                                    href="https://x.com/LOR4_14"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    nos annonces
                                </a>{' '}
                                pour en gagner un !
                            </p>

                            {/* Messages de retour */}
                            {message && (
                                <div className={`mt-4 p-3 rounded-lg text-sm ${messageType === 'error'
                                        ? 'bg-red-900/50 text-red-300 border border-red-700'
                                        : 'bg-green-900/50 text-green-300 border border-green-700'
                                    }`}>
                                    {message}
                                </div>
                            )}
                        </form>
                    ) : (
                        /* Écran de confirmation */
                        <div className="p-8 text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${darkMode ? 'bg-green-900/20' : 'bg-green-100'}`}>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>

                            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Email envoyé !
                            </h3>

                            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Vérifiez votre boîte mail<br />
                                <span className="font-medium">{email}</span>
                            </p>

                            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Cliquez sur le lien dans l'email pour vous connecter.
                                    Le lien expire dans <strong>60 minutes</strong>.
                                </p>
                            </div>

                            <button
                                onClick={resetForm}
                                className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                            >
                                Utiliser une autre adresse email
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        © 2025 INFODROP. Tous droits réservés.
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        Un projet 3C - By Emile Marclin & L0r4.py [AI]
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;