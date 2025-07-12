// Fichier : api/cron-fetch-articles.js
// Version finale, haute performance, avec tes améliorations de logging.

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js'; // Importe depuis le fichier local

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const parser = new RssParser({ timeout: 8000 }); // Timeout de 8s par flux

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
        }).filter(Boolean);
    } catch (error) {
        if (!error.message.includes('timeout')) {
            console.error(`Erreur pour ${source.name}:`, error.message);
        }
        return [];
    }
};

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    console.log('Cron job PARALLÈLE démarré.');
    const startTime = Date.now();

    const allPromises = newsSources.map(fetchFeed);
    const results = await Promise.allSettled(allPromises);

    let successCount = 0;
    let errorCount = 0;

    const allArticlesToInsert = results
        .filter(result => {
            if (result.status === 'fulfilled' && result.value) {
                successCount++;
                return true;
            } else {
                errorCount++;
                return false;
            }
        })
        .flatMap(result => result.value);

    if (allArticlesToInsert.length === 0) {
        console.log('Aucun nouvel article trouvé.');
        return res.status(200).json({
            message: 'Aucun nouvel article trouvé.',
            sources_processed: newsSources.length,
            sources_success: successCount,
            sources_error: errorCount,
            duration_ms: Date.now() - startTime
        });
    }

    console.log(`${allArticlesToInsert.length} articles prêts à être insérés.`);

    const { error } = await supabase
        .from('articles')
        .upsert(allArticlesToInsert, { onConflict: 'link' });

    if (error) {
        console.error('Erreur lors de l\'insertion Supabase:', error);
        return res.status(500).json({ error: `Erreur Supabase: ${error.message}` });
    }

    const duration = Date.now() - startTime;
    console.log(`Cron job PARALLÈLE terminé en ${duration}ms.`);

    return res.status(200).json({
        message: `Articles récupérés avec succès`,
        articles_inserted: allArticlesToInsert.length,
        sources_processed: newsSources.length,
        sources_success: successCount,
        sources_error: errorCount,
        duration_ms: duration
    });
}