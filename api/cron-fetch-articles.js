// api/cron-fetch-articles.js
// VERSION FINALE - Fetch, double dé-doublonnage ET nettoyage.

import { supabaseAdmin } from './config.js';
import RssParser from 'rss-parser';

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    try {
        console.log('CRON Démarré : Récupération et Nettoyage.');
        const startTime = Date.now();

        const { data: sources, error: sourcesError } = await supabaseAdmin.from('sources').select('*').eq('is_active', true);
        if (sourcesError) throw sourcesError;
        if (!sources || sources.length === 0) {
            return res.status(200).json({ message: 'Aucune source active à traiter.' });
        }
        
        const parser = new RssParser({ timeout: 8000 });
        const BATCH_SIZE = 10;
        let articlesFromFeeds = [];

        const fetchFeed = async (source) => { /* ... (Code de fetchFeed masqué pour la lisibilité) */ };

        for (let i = 0; i < sources.length; i += BATCH_SIZE) {
            const batch = sources.slice(i, i + BATCH_SIZE);
            const promises = batch.map(fetchFeed);
            const results = await Promise.allSettled(promises);
            results.forEach(r => r.status === 'fulfilled' && r.value && articlesFromFeeds.push(...r.value));
        }

        const uniqueArticlesMap = new Map();
        const seenGuids = new Set();
        
        for (const article of articlesFromFeeds) {
            if (!uniqueArticlesMap.has(article.link) && !seenGuids.has(article.guid)) {
                uniqueArticlesMap.set(article.link, article);
                seenGuids.add(article.guid);
            }
        }
        
        const articlesToInsert = Array.from(uniqueArticlesMap.values());
        if (articlesToInsert.length > 0) {
            const { error: dbError } = await supabaseAdmin.from('articles').upsert(articlesToInsert, { onConflict: 'link' });
            if (dbError) throw dbError;
        }

        console.log('🗑️ Nettoyage des articles de plus de 24h...');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: deletedCount, error: deleteError } = await supabaseAdmin.from('articles').delete({ count: 'exact' }).lt('pubDate', twentyFourHoursAgo);
        if (deleteError) console.error('Erreur lors de la suppression:', deleteError);
        else console.log(`✅ ${deletedCount} articles anciens supprimés.`);

        const duration = Date.now() - startTime;
        return res.status(200).json({ success: true, inserted: articlesToInsert.length, deleted: deletedCount || 0, durationMs: duration });

    } catch (e) {
        return res.status(500).json({ error: "Erreur critique du serveur", message: e.message });
    }
}
async function fetchFeed(source) {
    if (!source || !source.url) return [];
    try {
        const parser = new RssParser({ timeout: 8000 });
        const feed = await parser.parseURL(source.url);
        return (feed.items || []).map(item => {
            if (item.title && item.link && item.pubDate && item.guid) {
                return { title: item.title.trim(), link: item.link, pubDate: new Date(item.pubDate), source_name: source.name, image_url: item.enclosure?.url || null, guid: item.guid, orientation: source.orientation, category: source.category, tags: source.tags || [] };
            } return null;
        }).filter(Boolean);
    } catch (error) {
        console.warn(`⚠️ Flux ${source.name} ignoré: ${error.message}`); return [];
    }
}