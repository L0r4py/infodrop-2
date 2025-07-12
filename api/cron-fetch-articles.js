// Fichier : api/cron-fetch-articles.js
// Version HAUTE PERFORMANCE avec parallélisation (Promise.allSettled)

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js'; // Chemin local direct

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const parser = new RssParser();

// Fonction pour traiter un seul flux, qu'on appellera en parallèle
const fetchFeed = async (source) => {
    if (!source.url) {
        console.warn(`Source "${source.name}" ignorée : URL manquante.`);
        return []; // Retourne un tableau vide si pas d'URL
    }
    try {
        const feed = await parser.parseURL(source.url);
        const articlesFromSource = [];
        for (const item of feed.items) {
            if (item.title && item.link && item.pubDate && item.guid) {
                articlesFromSource.push({
                    title: item.title,
                    link: item.link,
                    pubDate: new Date(item.pubDate),
                    source_name: source.name,
                    image_url: item.enclosure?.url || null,
                    guid: item.guid,
                    orientation: source.orientation || 'neutre',
                    category: source.category || 'généraliste',
                    tags: source.category ? [source.category] : [],
                });
            }
        }
        return articlesFromSource;
    } catch (error) {
        console.error(`Erreur lors du traitement pour ${source.name}:`, error.message);
        return []; // En cas d'erreur sur un flux, on retourne un tableau vide pour ne pas bloquer les autres
    }
};

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    console.log('Cron job PARALLÈLE démarré.');

    // On lance toutes les promesses de fetch en même temps
    const allPromises = newsSources.map(source => fetchFeed(source));

    // Promise.allSettled attend que toutes les promesses soient terminées (réussies ou échouées)
    const results = await Promise.allSettled(allPromises);

    // On rassemble tous les articles de tous les flux dans un seul tableau
    const allArticlesToInsert = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .flatMap(result => result.value);

    if (allArticlesToInsert.length === 0) {
        console.log('Aucun nouvel article trouvé à insérer.');
        return res.status(200).json({ message: 'Aucun nouvel article trouvé.' });
    }

    console.log(`${allArticlesToInsert.length} articles prêts à être insérés.`);

    const { error } = await supabase
        .from('articles')
        .upsert(allArticlesToInsert, { onConflict: 'link' });

    if (error) {
        console.error('Erreur lors de l\'insertion Supabase:', error);
        return res.status(500).json({ error: `Erreur Supabase: ${error.message}` });
    }

    console.log('Cron job PARALLÈLE terminé avec succès.');
    return res.status(200).json({ message: `Articles récupérés avec succès: ${allArticlesToInsert.length} articles traités.` });
}