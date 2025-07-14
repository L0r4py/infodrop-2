// src/lib/supabase.js
// CONFIGURATION UNIQUE ET FINALE POUR LE FRONTEND (REACT)

import { createClient } from '@supabase/supabase-js';

// Lecture des variables d'environnement préfixées par REACT_APP_
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// On exporte une seule chose : le client Supabase pour le frontend.
// S'il ne peut pas être créé, on exporte `null`.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    })
    : null;

// Helper pour vérifier si la configuration est valide (utilisé dans AuthContext)
export const isSupabaseConfigured = !!supabase;