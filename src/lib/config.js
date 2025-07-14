// api/config.js
// Ce fichier centralise la création du client Supabase pour TOUTES les fonctions de l'API (backend).
// Il utilise les variables d'environnement serveur (sans REACT_APP_).

import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement pour le serveur
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Vérifier que les variables sont bien chargées
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL ou Service Key manquant. Vérifiez les variables d\'environnement sur Vercel.');
}

// Créer un client "admin" avec la service key qui a tous les droits
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);