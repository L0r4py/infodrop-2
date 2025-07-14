// api/config.js
// RÔLE : Configuration UNIQUE pour le BACKEND (CRON, etc.)

import { createClient } from '@supabase/supabase-js';

// Lecture des variables d'environnement serveur (SANS le préfixe REACT_APP_)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Vérification cruciale
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variables Supabase pour le backend manquantes (SUPABASE_URL, SUPABASE_SERVICE_KEY)');
}

// On exporte un client avec les droits d'admin pour les autres fichiers de l'api
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);