// src/lib/supabase.js
// VERSION DE DIAGNOSTIC : On vérifie la validité des clés

import { createClient } from '@supabase/supabase-js';

console.log("Chargement du module Supabase...");

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabaseInstance = null;
let isConfigured = false;
let configError = null;

// 1. Vérification de l'existence des variables
if (!supabaseUrl || !supabaseAnonKey) {
    configError = "Erreur critique : REACT_APP_SUPABASE_URL ou REACT_APP_SUPABASE_ANON_KEY est manquante.";
    console.error(configError);
} else {
    // 2. Vérification de la validité du format (simple)
    console.log("✅ Variables d'environnement trouvées.");
    console.log("URL:", supabaseUrl);
    // On ne log que des parties non sensibles de la clé pour la sécurité
    console.log("Clé Anon (début):", supabaseAnonKey.substring(0, 8));
    console.log("Clé Anon (longueur):", supabaseAnonKey.length);

    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.endsWith('.supabase.co')) {
        configError = `Erreur de format : L'URL Supabase semble invalide. (${supabaseUrl})`;
        console.error(configError);
    } else if (supabaseAnonKey.length < 100) { // Une clé anon est généralement très longue
        configError = `Erreur de format : La clé Anon semble trop courte. Vérifiez qu'elle n'est pas tronquée.`;
        console.error(configError);
    } else {
        // 3. Si tout semble correct, on crée le client
        try {
            console.log("Tentative de création du client Supabase...");
            supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true,
                },
            });
            isConfigured = true;
            console.log("✅ Client Supabase créé avec succès !");
        } catch (e) {
            configError = `Erreur lors de createClient(): ${e.message}`;
            console.error(configError);
        }
    }
}

// On exporte l'instance et le statut
export const supabase = supabaseInstance;
export const isSupabaseConfigured = isConfigured;
export const supabaseConfigurationError = configError;