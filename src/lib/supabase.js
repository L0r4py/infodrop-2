// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Vérifier la configuration
const configured = !!(supabaseUrl && supabaseAnonKey);

if (!configured) {
    console.warn('⚠️ Variables Supabase manquantes. Configurez REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY');
}

// Créer le client Supabase (ou null si non configuré)
export const supabase = configured
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    })
    : null;

// Helper pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => configured;

// Export par défaut
export default supabase;