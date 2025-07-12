// Fichier : api/cron-fetch-articles.js
// Version FINALE ES6 : Traitement par lots + déduplication + optimisations

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js';

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    try {
        console.log('🚀 Cron job par LOTS + DÉDOUBLONNAGE démarré.');
        const startTime = Date.now();

        const supabase = createClient(
            process.env.REACT_APP_SUPABASE_URL,
            process.env.REACT_APP_SUPABASE_SERVICE_KEY
        );
        const parser = new RssParser({ timeout: 8000 });

        const fetchFeed = async (source) => {
            if (!source || !source.url) return [];

            try {
                const feed = await parser.parseURL(source.url);
                return (feed.items || []).map(item => {
                    if (item.title && item.link && item.pubDate) {
                        return {
                            title: item.title.substring(0, 500),
                            link: item.link,
                            pubDate: new Date(item.pubDate).toISOString(),
                            source_name: source.name,
                            image_url: item.enclosure?.url || null,
                            guid: item.guid || item.link,
                            orientation: source.orientation || 'neutre',
                            category: source.category || 'généraliste',
                            tags: source.category ? [source.category] : []
                        };
                    }
                    return null;
                }).filter(Boolean);
            } catch (error) {
                console.warn(`⚠️ Flux ${source.name} échoué: ${error.message.substring(0, 100)}`);
                return [];
            }
        };

        const BATCH_SIZE = 10;
        let articlesFromFeeds = [];
        let successCount = 0;
        let errorCount = 0;

        // Traitement par lots
        for (let i = 0; i < newsSources.length; i += BATCH_SIZE) {
            const batch = newsSources.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(newsSources.length / BATCH_SIZE);

            console.log(`📦 Traitement lot ${batchNum}/${totalBatches}...`);

            const promises = batch.map(fetchFeed);
            const results = await Promise.allSettled(promises);

            results.forEach(r => {
                if (r.status === 'fulfilled' && r.value.length > 0) {
                    articlesFromFeeds.push(...r.value);
                    successCount++;
                } else {
                    errorCount++;
                }
            });
        }

        console.log(`📊 Sources: ${successCount} succès, ${errorCount} échecs`);
        console.log(`📰 Avant déduplication: ${articlesFromFeeds.length} articles`);

        // Déduplication avec Map
        const uniqueArticlesMap = new Map();
        for (const article of articlesFromFeeds) {
            if (!uniqueArticlesMap.has(article.link)) {
                uniqueArticlesMap.set(article.link, article);
            }
        }

        const allArticlesToInsert = Array.from(uniqueArticlesMap.values());
        console.log(`✨ Après déduplication: ${allArticlesToInsert.length} articles uniques`);

        if (allArticlesToInsert.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun nouvel article trouvé',
                stats: {
                    sources_processed: newsSources.length,
                    sources_success: successCount,
                    sources_error: errorCount,
                    duration_ms: Date.now() - startTime
                }
            });
        }

        // Insertion sans .select() pour économiser de la bande passante
        console.log(`💾 Insertion de ${allArticlesToInsert.length} articles...`);

        const { error: dbError } = await supabase
            .from('articles')
            .upsert(allArticlesToInsert, { onConflict: 'link' });

        if (dbError) {
            throw new Error(`Erreur Supabase: ${dbError.message}`);
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Cron terminé avec succès en ${duration}ms`);

        return res.status(200).json({
            success: true,
            message: 'Articles traités avec succès',
            stats: {
                sources_processed: newsSources.length,
                sources_success: successCount,
                sources_error: errorCount,
                articles_found: articlesFromFeeds.length,
                articles_unique: allArticlesToInsert.length,
                duplicates_removed: articlesFromFeeds.length - allArticlesToInsert.length,
                duration_ms: duration
            }
        });

    } catch (e) {
        console.error("❌ ERREUR FATALE:", e.message);
        console.error("Stack:", e.stack);

        return res.status(500).json({
            error: "Erreur critique dans le CRON",
            message: e.message,
            timestamp: new Date().toISOString()
        });
    }
}