// api/config.js
// CONFIGURATION UNIQUE ET FINALE POUR LE BACKEND (FONCTIONS API / CRON)

import { createClient } from '@supabase/supabase-js';

// Lecture des variables d'environnement serveur (SANS le préfixe REACT_APP_)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Vérification cruciale
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variables Supabase pour le backend manquantes (SUPABASE_URL, SUPABASE_SERVICE_KEY)');
}

// On exporte un client avec les droits d'admin
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);