// Fichier : api/cron-fetch-articles.js
// Version HAUTE PERFORMANCE avec parallélisation (Promise.allSettled)

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js'; // Chemin local direct

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const parser = new RssParser({ timeout: 8000 }); // On ajoute un timeout de 8s par flux

// Fonction pour traiter un seul flux, qu'on appellera en parallèle
const fetchFeed = async (source) => {
    if (!source.url) return [];
    try {
        const feed = await parser.parseURL(source.url);
        return (feed.items || []).map(item => {
            if (item.title && item.link && item.pubDate && item.guid) {
                return {
                    title: item.title,
                    link: item.link,
                    pubDate: new Date(item.pubDate),
                    source_name: source.name,
                    image_url: item.enclosure?.url || null,
                    guid: item.guid,
                    orientation: source.orientation || 'neutre',
                    category: source.category || 'généraliste',
                    tags: source.category ? [source.category] : [],
                };
            }
            return null;
        }).filter(Boolean); // Retire les articles nuls
    } catch (error) {
        // On ne logue l'erreur que si ce n'est pas un simple timeout, pour ne pas polluer les logs
        if (!error.message.includes('timeout')) {
            console.error(`Erreur pour ${source.name}:`, error.message);
        }
        return []; // En cas d'erreur, on continue avec les autres
    }
};

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    console.log('Cron job PARALLÈLE démarré.');

    // On lance toutes les requêtes en même temps
    const allPromises = newsSources.map(fetchFeed);

    // On attend que toutes soient terminées
    const results = await Promise.allSettled(allPromises);

    // On rassemble tous les articles dans un seul grand tableau
    const allArticlesToInsert = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .flatMap(result => result.value);

    if (allArticlesToInsert.length === 0) {
        console.log('Aucun nouvel article trouvé.');
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