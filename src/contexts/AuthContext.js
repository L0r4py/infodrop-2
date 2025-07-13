// src/contexts/AuthContext.js
// Version corrigée - Utilise uniquement signInWithOtp pour tous les cas

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);
const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL?.toLowerCase();

// Log pour vérifier que la variable est bien chargée (à retirer en production)
if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Admin email configuré:', ADMIN_EMAIL);
}

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

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase non configuré - Mode démo activé');
            setIsLoading(false);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔄 Auth state change:', event);
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            setIsAdmin(currentUser?.email?.toLowerCase() === ADMIN_EMAIL);

            // Si l'utilisateur vient de se connecter, vérifier s'il y a un code à marquer comme utilisé
            if (event === 'SIGNED_IN' && currentUser) {
                handlePostSignIn(currentUser);
            }

            setIsLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    // Fonction pour gérer les actions après connexion
    const handlePostSignIn = async (user) => {
        // Vérifier s'il y a un code en attente dans localStorage
        const pendingCode = localStorage.getItem('pending_invite_code');
        if (!pendingCode) return;

        try {
            // Récupérer les infos actuelles du code
            const { data: codeData, error: fetchError } = await supabase
                .from('referral_codes')
                .select('uses_count, max_uses')
                .eq('code', pendingCode)
                .single();

            if (!fetchError && codeData) {
                // Mettre à jour le code
                const newUsesCount = (codeData.uses_count || 0) + 1;
                await supabase.from('referral_codes').update({
                    uses_count: newUsesCount,
                    is_active: newUsesCount < codeData.max_uses,
                    last_used: new Date().toISOString()
                }).eq('code', pendingCode);

                console.log('✅ Code marqué comme utilisé:', pendingCode);
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du code:', error);
        } finally {
            // Nettoyer le localStorage
            localStorage.removeItem('pending_invite_code');
        }
    };

    const loginOrSignUp = async (email, inviteCode) => {
        if (!isSupabaseConfigured()) throw new Error('Supabase non configuré');
        setIsLoading(true);

        try {
            const normalizedEmail = email.toLowerCase().trim();
            const normalizedCode = inviteCode?.toUpperCase().trim();

            // CAS 1 : L'admin se connecte toujours avec un lien magique
            if (normalizedEmail === ADMIN_EMAIL) {
                console.log("🔑 Connexion admin...");
                const { error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;
                return { success: true, message: "Lien de connexion envoyé à l'admin." };
            }

            // CAS 2 : Utilisateur avec code d'invitation
            if (normalizedCode) {
                console.log("🔍 Vérification du code d'invitation...");

                // Vérifier le code dans la table 'referral_codes'
                const { data: codeData, error: codeError } = await supabase
                    .from('referral_codes')
                    .select('id, is_active, uses_count, max_uses')
                    .eq('code', normalizedCode)
                    .single();

                if (codeError || !codeData) {
                    throw new Error("Code d'invitation invalide.");
                }

                if (!codeData.is_active) {
                    throw new Error("Ce code d'invitation n'est plus actif.");
                }

                if (codeData.uses_count >= codeData.max_uses) {
                    throw new Error("Ce code d'invitation a atteint sa limite d'utilisations.");
                }

                // Code valide ! Sauvegarder le code pour le marquer comme utilisé après connexion
                localStorage.setItem('pending_invite_code', normalizedCode);

                // Envoyer le magic link (créera le compte si nécessaire)
                console.log("📧 Envoi du magic link...");
                const { error: magicLinkError } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: {
                            invite_code: normalizedCode // Métadonnée optionnelle
                        }
                    }
                });

                if (magicLinkError) {
                    localStorage.removeItem('pending_invite_code');
                    throw magicLinkError;
                }

                return {
                    success: true,
                    message: 'Code valide ! Vérifiez votre boîte mail pour le lien de connexion.'
                };

            } else {
                // CAS 3 : Connexion simple sans code
                console.log("📧 Tentative de connexion simple...");

                const { error } = await supabase.auth.signInWithOtp({
                    email: normalizedEmail,
                    options: {
                        emailRedirectTo: window.location.origin
                    }
                });

                if (error) {
                    // Si l'erreur indique que l'utilisateur n'existe pas
                    if (error.message?.includes('not found') || error.message?.includes('not exist')) {
                        throw new Error("Aucun compte trouvé. Un code d'invitation est requis pour créer un compte.");
                    }
                    throw error;
                }

                return {
                    success: true,
                    message: 'Lien de connexion envoyé !'
                };
            }

        } catch (error) {
            console.error("❌ Erreur Auth:", error);
            return {
                success: false,
                error: error.message || "Une erreur est survenue"
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        if (!isSupabaseConfigured()) return;
        await supabase.auth.signOut();
        localStorage.removeItem('pending_invite_code');
    };

    // Fonction de connexion avec lien magique (ancienne, on la garde pour compatibilité)
    const signInWithMagicLink = async (email, inviteCode = '') => {
        console.warn('⚠️ signInWithMagicLink est déprécié, utilisez loginOrSignUp');
        return loginOrSignUp(email, inviteCode);
    };

    const value = {
        user,
        session,
        isAdmin,
        isAuthenticated: !!user,
        isLoading,
        loginOrSignUp,
        signInWithMagicLink, // Gardée pour compatibilité
        logout,
        // Helpers
        userEmail: user?.email || null,
        userId: user?.id || null
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;