// src/lib/supabase.js
// VERSION FINALE DÉFINITIVE - Utilise le préfixe REACT_APP_

import { createClient } from '@supabase/supabase-js';

// Lecture des variables avec le préfixe standard de Create React App
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// On exporte le client Supabase. Il sera `null` si les clés sont manquantes.
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
    })
    : null;

// Helper pour vérifier si la configuration est valide
export const isSupabaseConfigured = !!supabase;