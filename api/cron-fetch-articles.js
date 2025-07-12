// Fichier : api/cron-fetch-articles.js
// VERSION DE DIAGNOSTIC : On vérifie les imports et les variables.

// On importe tout ce dont le vrai script a besoin...
import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js'; // ... y compris les sources.

export default async function handler(req, res) {
    // 1. On vérifie le secret, comme d'habitude.
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    console.log("Démarrage du script de DIAGNOSTIC...");

    // 2. On espionne les variables critiques.
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

    // On prépare un rapport détaillé.
    const diagnostics = {
        message: "Rapport de l'espion :",
        supabaseUrlExists: !!supabaseUrl,
        supabaseServiceKeyExists: !!supabaseServiceKey,
        newsSourcesIsArray: Array.isArray(newsSources),
        newsSourcesLength: newsSources ? newsSources.length : 'ERREUR: newsSources est undefined',
    };
    
    // On affiche le rapport dans les logs de Vercel.
    console.log(diagnostics);
    
    // 3. On s'arrête ici et on renvoie le rapport.
    // On ne lance PAS le RssParser ni la connexion à Supabase.
    // Si ce script réussit, le problème est dans la partie "fetch".
    
    return res.status(200).json({ 
        report: diagnostics
    });
}