// Fichier : api/cron-fetch-articles.js
// VERSION "ULTRA-MINIMALISTE" - On élimine toutes les variables

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';

export default async function handler(req, res) {
    // 1. Vérification du secret (on sait que ça marche)
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Auth a échoué' });
    }

    try {
        console.log('--- DÉBUT DU TEST ULTRA-MINIMALISTE ---');

        // 2. Initialisation directe
        const supabase = createClient(
            process.env.REACT_APP_SUPABASE_URL,
            process.env.REACT_APP_SUPABASE_SERVICE_KEY
        );
        console.log('Étape A: Client Supabase créé.');

        const parser = new RssParser();
        console.log('Étape B: Parser RSS créé.');

        // 3. Parsing d'UNE SEULE source, en dur
        const sourceUrl = 'https://feeds.leparisien.fr/leparisien/rss';
        console.log(`Étape C: Parsing de l'URL: ${sourceUrl}`);
        const feed = await parser.parseURL(sourceUrl);
        console.log(`Étape D: Feed parsé. ${feed.items.length} articles trouvés.`);

        // 4. Préparation d'UN SEUL article
        const firstItem = feed.items[0];
        if (!firstItem) {
            return res.status(200).json({ message: 'SUCCÈS, mais le flux est vide.' });
        }

        const articleToInsert = {
            title: firstItem.title,
            link: firstItem.link,
            pubDate: new Date(firstItem.pubDate),
            guid: firstItem.guid || firstItem.link, // Fallback pour le guid
            source_name: 'Le Parisien (Test)'
        };
        console.log('Étape E: Article préparé pour insertion.');

        // 5. Insertion de cet unique article
        const { error } = await supabase
            .from('articles')
            .upsert(articleToInsert, { onConflict: 'link' });

        if (error) {
            console.error('ERREUR SUPABASE:', error);
            throw new Error(`Échec de l'insertion Supabase: ${error.message}`);
        }
        console.log('Étape F: Insertion dans Supabase réussie.');

        // 6. Si on arrive ici, TOUT a fonctionné.
        console.log('--- FIN DU TEST ULTRA-MINIMALISTE : SUCCÈS TOTAL ---');
        return res.status(200).json({
            message: 'VICTOIRE ! Le test minimaliste a réussi et a inséré un article.'
        });

    } catch (e) {
        // Si QUOIQUE CE SOIT plante, on le verra ici.
        console.error('--- ERREUR FATALE DANS LE TEST MINIMALISTE ---');
        console.error('Message:', e.message);
        console.error('Stack Trace:', e.stack);

        return res.status(500).json({
            error: 'Le test minimaliste a échoué',
            message: e.message,
            stack: e.stack // On renvoie toute l'erreur pour la voir dans cron-job.org
        });
    }
}