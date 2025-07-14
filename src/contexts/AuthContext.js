// src/contexts/AuthContext.js
// Version adaptée pour fonctionner exactement comme la V1

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // ✅ On utilise l'instance existante

const AuthContext = createContext(null);

// Variables globales pour stocker la config
let ADMIN_EMAILS = [];
let STRIPE_LINK = '';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionLoaded, setSessionLoaded] = useState(false);

    // État pour les données d'invitation
    const [userInviteData, setUserInviteData] = useState({
        code: null,
        is_used: false,
        parrainEmail: null,
        filleulEmail: null
    });

    // Initialisation au montage (comme dans V1)
    useEffect(() => {
        initializeSupabase();
    }, []);

    // Fonction d'initialisation (adaptée de V1)
    const initializeSupabase = async () => {
        try {
            // Adapter l'URL selon l'environnement
            const apiUrl = process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000/api/config'
                : '/api/config';

            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const cfg = await res.json();

            ADMIN_EMAILS = cfg.adminEmails;
            STRIPE_LINK = cfg.stripeLink;

            // Configurer le listener d'authentification
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setSessionLoaded(true);

                if (event === 'SIGNED_IN' && currentUser) {
                    setIsAdmin(ADMIN_EMAILS.includes(currentUser.email?.toLowerCase()));
                    await loadUserInviteData(currentUser);
                }

                if (event === 'SIGNED_OUT') {
                    setUserInviteData({
                        code: null,
                        is_used: false,
                        parrainEmail: null,
                        filleulEmail: null
                    });
                }

                setIsLoading(false);
            });

            // Vérifier la session existante
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession) {
                setSession(existingSession);
                setUser(existingSession.user);
                setIsAdmin(ADMIN_EMAILS.includes(existingSession.user?.email?.toLowerCase()));
                await loadUserInviteData(existingSession.user);
            }

            setSessionLoaded(true);
            setIsLoading(false);

        } catch (err) {
            setSessionLoaded(true);
            setIsLoading(false);

            // Afficher une erreur visuelle (comme dans V1)
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); color: white; display: flex; align-items: center; justify-content: center; z-index: 9999; font-family: Arial;">
                    <div style="text-align: center; padding: 2rem;">
                        <h2>❌ Erreur de configuration</h2>
                        <p>Impossible de charger la configuration sécurisée.</p>
                        <p>Veuillez contacter l'administrateur.</p>
                        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Recharger la page
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(errorDiv);
        }
    };

    // Fonction login adaptée de V1
    const login = async (email, inviteCode) => {
        // ❌ SUPPRIMÉ : Plus besoin de vérifier si supabase existe

        try {
            const normalizedEmail = email.toLowerCase().trim();

            // Vérifie si l'email existe déjà
            const apiUrl = process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000/api/check-email'
                : '/api/check-email';

            const checkRes = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail })
            });

            if (!checkRes.ok) {
                const err = await checkRes.json();
                throw new Error(err.error || 'Erreur de communication.');
            }

            const { exists } = await checkRes.json();

            // Si l'utilisateur n'existe pas, il faut un code valide
            if (!exists) {
                if (!inviteCode) {
                    throw new Error("Code d'invitation requis pour les nouveaux utilisateurs.");
                }

                const validateApiUrl = process.env.NODE_ENV === 'development'
                    ? 'http://localhost:3000/api/validate-invite'
                    : '/api/validate-invite';

                const validateRes = await fetch(validateApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: inviteCode, email: normalizedEmail })
                });

                const validationResult = await validateRes.json();
                if (!validationResult.success) {
                    throw new Error(validationResult.error);
                }
            }

            // On envoie l'OTP (lien magique) seulement si tout est OK
            const { error: otpError } = await supabase.auth.signInWithOtp({
                email: normalizedEmail,
                options: {
                    emailRedirectTo: 'https://infodrop2.vercel.app'
                }
            });

            if (otpError) throw otpError;

            return {
                success: true,
                message: 'Vérifiez vos emails ! Un lien de connexion a été envoyé.'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message || 'Une erreur est survenue.'
            };
        }
    };

    // Chargement des données d'invitation (copié de V1)
    const loadUserInviteData = async (currentUser) => {
        if (!currentUser || !currentUser.email) {
            return;
        }

        // Vérification admin
        const userIsAdmin = ADMIN_EMAILS.includes(currentUser.email?.toLowerCase());

        if (userIsAdmin) {
            try {
                const { data: adminCode, error: adminError } = await supabase
                    .from('invitation_codes')
                    .select('*')
                    .ilike('owner_email', currentUser.email.toLowerCase())
                    .maybeSingle();

                if (adminError && adminError.code !== 'PGRST116') {
                    return;
                }

                if (adminCode) {
                    setUserInviteData(prev => ({
                        ...prev,
                        code: adminCode.code,
                        is_used: adminCode.is_used || false,
                        filleulEmail: adminCode.is_used ? adminCode.used_by_email : null
                    }));
                }

                return;

            } catch (error) {
                return;
            }
        }

        // Traitement pour utilisateurs normaux
        try {
            // Récupérer le code d'invitation du compte connecté
            const { data: ownCode, error: ownCodeError } = await supabase
                .from('invitation_codes')
                .select('*')
                .ilike('owner_email', currentUser.email.toLowerCase())
                .maybeSingle();

            if (!ownCodeError && ownCode) {
                setUserInviteData(prev => ({
                    ...prev,
                    code: ownCode.code,
                    is_used: ownCode.is_used || false,
                    filleulEmail: ownCode.is_used ? ownCode.used_by_email : null
                }));
            }

            // Récupérer le parrain
            const { data: usedCode, error: usedCodeError } = await supabase
                .from('invitation_codes')
                .select('owner_email')
                .ilike('used_by_email', currentUser.email.toLowerCase())
                .maybeSingle();

            if (!usedCodeError && usedCode) {
                setUserInviteData(prev => ({
                    ...prev,
                    parrainEmail: usedCode.owner_email
                }));
            }

        } catch (error) {
            // Erreur silencieuse
        }
    };

    // Fonction pour générer un code (admin)
    const generateInviteCode = async () => {
        if (!isAdmin || !session) return null;

        try {
            const apiUrl = process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000/api/generate-invite'
                : '/api/generate-invite';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                return result.code;
            }

            throw new Error(result.error || 'Erreur lors de la génération');

        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    // Alias pour compatibilité avec V2
    const loginOrSignUp = login;
    const signInWithMagicLink = login;

    const value = {
        // État
        user,
        session,
        isAdmin,
        isAuthenticated: !!user,
        isLoading,
        sessionLoaded,
        userInviteData,

        // Méthodes
        login,
        loginOrSignUp,
        signInWithMagicLink,
        logout,
        generateInviteCode,

        // Helpers
        userEmail: user?.email || null,
        userId: user?.id || null,

        // Config
        STRIPE_LINK
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;