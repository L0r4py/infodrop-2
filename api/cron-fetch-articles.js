// Fichier : api/cron-fetch-articles.js
// Version Finale Complète : Enrichit les données avec les tags.

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
// ✅ CORRECTION DU CHEMIN : On duplique le fichier pour être sûr que Vercel le trouve.
import { newsSources } from './newsSources.js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const parser = new RssParser();

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    console.log('Cron job démarré : Récupération et enrichissement complet des articles.');
    const allArticlesToInsert = [];

    for (const source of newsSources) {
        if (!source.url) {
            console.warn(`Source "${source.name}" ignorée : URL manquante.`);
            continue;
        }

        try {
            const feed = await parser.parseURL(source.url);
            for (const item of feed.items) {
                if (item.title && item.link && item.pubDate && item.guid) {
                    allArticlesToInsert.push({
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.pubDate),
                        source_name: source.name,
                        image_url: item.enclosure?.url || null,
                        guid: item.guid,
                        orientation: source.orientation || 'neutre',
                        category: source.category || 'généraliste',
                        // ✅ AJOUT : On crée un tableau de tags en utilisant la catégorie.
                        tags: source.category ? [source.category] : []
                    });
                }
            }
        } catch (error) {
            console.error(`Erreur lors du traitement pour ${source.name}:`, error.message);
        }
    }

    if (allArticlesToInsert.length === 0) {
        console.log('Aucun nouvel article trouvé à insérer.');
        return res.status(200).json({ message: 'Aucun nouvel article trouvé.' });
    }

    console.log(`${allArticlesToInsert.length} articles prêts à être insérés.`);

    const { data, error } = await supabase
        .from('articles')
        .upsert(allArticlesToInsert, { onConflict: 'link' });

    if (error) {
        console.error('Erreur lors de l\'insertion Supabase:', error);
        return res.status(500).json({ error: `Erreur Supabase: ${error.message}` });
    }

    console.log('Cron job terminé avec succès.');
    return res.status(200).json({ message: 'Articles récupérés avec succès.' });
}