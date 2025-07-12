// Fichier : api/cron-fetch-articles.js
// VERSION D'AUTOPSIE : On exécute chaque bloc et on rapporte le résultat.
// Source de test : Le Parisien (stable)

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
// On importe newsSources juste pour s'assurer que l'import lui-même ne plante pas.
import { newsSources } from './newsSources.js';

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    const report = {
        step1_auth: 'Succès',
        step2_supabase_client_init: 'Pas encore testé',
        step3_rss_parser_init: 'Pas encore testé',
        step4_single_feed_parse: 'Pas encore testé',
        step5_supabase_insert: 'Pas encore testé',
        final_result: 'Incomplet'
    };

    try {
        // --- ÉTAPE 2 : Initialisation du client Supabase ---
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) throw new Error("Variables Supabase manquantes");

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        report.step2_supabase_client_init = 'Succès';

        // --- ÉTAPE 3 : Initialisation du RssParser ---
        const parser = new RssParser({ timeout: 10000 }); // Timeout augmenté à 10s pour être sûr
        report.step3_rss_parser_init = 'Succès';

        // --- ÉTAPE 4 : Test de parsing sur UNE SEULE source ---
        let articlesToInsert = [];
        try {
            // ✅ CORRECTION : Utilisation du flux du Parisien
            const singleSource = { name: "Le Parisien", url: "https://feeds.leparisien.fr/leparisien/rss" };
            const feed = await parser.parseURL(singleSource.url);

            articlesToInsert = (feed.items || []).map(item => {
                if (item.title && item.link && item.pubDate && item.guid) {
                    return { title: item.title, link: item.link, pubDate: new Date(item.pubDate), guid: item.guid, source_name: singleSource.name };
                }
                return null;
            }).filter(Boolean); // Retire les éléments nuls

            report.step4_single_feed_parse = `Succès - ${articlesToInsert.length} articles trouvés`;
        } catch (parseError) {
            report.step4_single_feed_parse = `ÉCHEC: ${parseError.message}`;
            throw parseError; // On arrête ici si le parsing échoue
        }

        // --- ÉTAPE 5 : Test d'insertion dans Supabase ---
        if (articlesToInsert.length > 0) {
            const { error: dbError } = await supabase.from('articles').upsert(articlesToInsert, { onConflict: 'link' });
            if (dbError) {
                report.step5_supabase_insert = `ÉCHEC: ${dbError.message}`;
                throw dbError;
            } else {
                report.step5_supabase_insert = 'Succès';
            }
        } else {
            report.step5_supabase_insert = 'Ignoré (aucun article à insérer)';
        }

        report.final_result = 'Toutes les étapes ont réussi !';
        return res.status(200).json({ report });

    } catch (e) {
        // Si une erreur se produit, on renvoie le rapport dans son état actuel.
        report.final_result = `ÉCHEC à l'étape en cours: ${e.message}`;
        return res.status(500).json({ report });
    }
}