// src/lib/supabase.js
// Configuration Supabase pour React (Create React App)

import { createClient } from '@supabase/supabase-js';

// Variables d'environnement React (commencent par REACT_APP_)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Vérification de la configuration
export const isSupabaseConfigured = () => {
    return !!(supabaseUrl && supabaseAnonKey);
};

// Création du client Supabase (uniquement si configuré)
export const supabase = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    })
    : null;

// Export pour debug (à retirer en production)
if (process.env.NODE_ENV === 'development') {
    console.log('Supabase config:', {
        url: supabaseUrl ? '✓ Configuré' : '✗ Manquant',
        key: supabaseAnonKey ? '✓ Configuré' : '✗ Manquant',
        configured: isSupabaseConfigured()
    });
}

export default supabase;