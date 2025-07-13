// src/components/auth/AuthForm.js
// Formulaire de connexion par lien magique

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Loader, CheckCircle, AlertCircle, Info, Key } from 'lucide-react';

const AuthForm = ({ darkMode = true }) => {
    const { loginOrSignUp } = useAuth(); // ✅ On utilise la nouvelle fonction
    const [email, setEmail] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation basique
        if (!email || !email.includes('@')) {
            setError('Veuillez entrer une adresse email valide');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        // ✅ On utilise loginOrSignUp avec email et code
        const result = await loginOrSignUp(email, inviteCode);

        if (result.success) {
            setEmailSent(true);
            setMessage(result.message || 'Lien de connexion envoyé ! Consultez votre boîte mail.');
        } else {
            setError(result.error || 'Une erreur est survenue. Réessayez plus tard.');
        }

        setLoading(false);
    };

    const resetForm = () => {
        setEmail('');
        setInviteCode('');
        setEmailSent(false);
        setMessage('');
        setError('');
    };

    return (
        <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-slate-950' : 'bg-gray-50'
            }`}>
            <div className="w-full max-w-md px-4">
                {/* Logo et titre */}
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 ${darkMode ? 'bg-slate-800' : 'bg-white shadow-lg'
                        }`}>
                        <span className="text-4xl">📰</span>
                    </div>
                    <h1 className={`text-4xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        INFODROP
                    </h1>
                    <p className={`mt-2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Le Club privé de l'actu gamifiée
                    </p>
                </div>

                {/* Card principale */}
                <div className={`rounded-2xl shadow-xl overflow-hidden ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'
                    }`}>
                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Titre de la card */}
                            <div className="text-center">
                                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                    Accès membres
                                </h2>
                                <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Connectez-vous avec votre lien magique
                                </p>
                            </div>

                            {/* Champ email */}
                            <div>
                                <label htmlFor="email" className="sr-only">
                                    Adresse email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                                            }`} />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                        className={`block w-full pl-10 pr-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                                                ? 'bg-slate-800 border border-slate-700 text-white placeholder-gray-500'
                                                : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                        placeholder="votre@email.com"
                                    />
                                </div>
                            </div>

                            {/* Champ code d'invitation - VISIBLE */}
                            <div>
                                <label htmlFor="inviteCode" className="sr-only">
                                    Code d'invitation
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'
                                            }`} />
                                    </div>
                                    <input
                                        id="inviteCode"
                                        name="inviteCode"
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                        className={`block w-full pl-10 pr-3 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                                                ? 'bg-slate-800 border border-slate-700 text-white placeholder-gray-500'
                                                : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                                            }`}
                                        placeholder="Code d'invitation (si nouveau)"
                                    />
                                </div>
                            </div>

                            {/* Messages d'erreur améliorés */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-red-500 font-medium">{error}</p>
                                        {error.includes('invitation') && (
                                            <p className="text-xs text-red-400 mt-1">
                                                Les codes sont distribués lors d'événements spéciaux.
                                                Suivez-nous pour ne pas les manquer !
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Bouton de connexion */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${loading
                                        ? 'bg-blue-800 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
                                    } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${darkMode ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'
                                    }`}
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

                            {/* Info supplémentaire */}
                            <div className={`flex items-start gap-3 p-4 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-blue-50'
                                }`}>
                                <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`} />
                                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                    <p className="font-medium mb-1">Comment ça marche ?</p>
                                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        • <strong>Première connexion :</strong> Entrez votre email + code d'invitation<br />
                                        • <strong>Connexions suivantes :</strong> Email uniquement, pas besoin du code<br />
                                        • Pas de mot de passe, juste un lien magique par email
                                    </p>
                                </div>
                            </div>
                        </form>
                    ) : (
                        /* Écran de confirmation */
                        <div className="p-8 text-center">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${darkMode ? 'bg-green-900/20' : 'bg-green-100'
                                }`}>
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>

                            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                Email envoyé !
                            </h3>

                            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                Vérifiez votre boîte mail<br />
                                <span className="font-medium">{email}</span>
                            </p>

                            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-slate-800' : 'bg-gray-50'
                                }`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'
                                    }`}>
                                    Cliquez sur le lien dans l'email pour vous connecter.
                                    Le lien expire dans <strong>60 minutes</strong>.
                                </p>
                            </div>

                            <button
                                onClick={resetForm}
                                className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                                    }`}
                            >
                                Utiliser une autre adresse email
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                        Un projet 3C by Emile Marclin & L0r4.py
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;