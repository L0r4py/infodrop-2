// Fichier : api/cron-fetch-articles.js
// VERSION FINALE CORRIGÉE (TA logique + MA correction de connexion)

// CHANGEMENT 1: On n'importe plus createClient, car la connexion se fait dans config.js
import { supabaseAdmin } from './config.js'; // ✅ On importe notre client pré-configuré
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js'; // ✅ On garde ta source de données locale

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    try {
        console.log('Cron job ULTIME 2.0 démarré - Double dédoublonnage activé.');
        const startTime = Date.now();

        // CHANGEMENT 2: Le bloc createClient() qui plantait est entièrement supprimé d'ici.

        const parser = new RssParser({ timeout: 8000 });

        // ✅ TOUTE TA LOGIQUE CI-DESSOUS EST CONSERVÉE À 100%
        const fetchFeed = async (source) => {
            if (!source || !source.url) return [];

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
                            tags: source.category ? [source.category] : []
                        };
                    }
                    return null;
                }).filter(Boolean);
            } catch (error) {
                console.warn(`⚠️ Le flux ${source.name} a échoué (ignoré): ${error.message}`);
                return [];
            }
        };

        const BATCH_SIZE = 10;
        let articlesFromFeeds = [];

        // Traitement par lots
        for (let i = 0; i < newsSources.length; i += BATCH_SIZE) {
            const batch = newsSources.slice(i, i + BATCH_SIZE);
            const promises = batch.map(fetchFeed);
            const results = await Promise.allSettled(promises);
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    articlesFromFeeds.push(...r.value);
                }
            });
            console.log(`📊 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(newsSources.length / BATCH_SIZE)} traité`);
        }

        console.log(`📋 Avant dédoublonnage: ${articlesFromFeeds.length} articles trouvés.`);

        const uniqueArticlesMap = new Map();
        const seenGuids = new Set();
        let duplicateLinks = 0;
        let duplicateGuids = 0;

        for (const article of articlesFromFeeds) {
            const isLinkDuplicate = uniqueArticlesMap.has(article.link);
            const isGuidDuplicate = seenGuids.has(article.guid);

            if (!isLinkDuplicate && !isGuidDuplicate) {
                uniqueArticlesMap.set(article.link, article);
                seenGuids.add(article.guid);
            } else {
                if (isLinkDuplicate) duplicateLinks++;
                if (isGuidDuplicate) duplicateGuids++;
            }
        }

        const allArticlesToInsert = Array.from(uniqueArticlesMap.values());
        console.log(`✨ Après double dédoublonnage: ${allArticlesToInsert.length} articles uniques`);
        console.log(`   - ${duplicateLinks} doublons de link éliminés`);
        console.log(`   - ${duplicateGuids} doublons de guid éliminés`);

        if (allArticlesToInsert.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun nouvel article unique trouvé.',
                stats: { articlesChecked: articlesFromFeeds.length, duplicatesRemoved: duplicateLinks + duplicateGuids }
            });
        }

        console.log(`📝 ${allArticlesToInsert.length} articles à insérer dans Supabase...`);

        // CHANGEMENT 3: On utilise "supabaseAdmin" (qui vient de config.js) au lieu de "supabase"
        const { data, error: dbError } = await supabaseAdmin
            .from('articles')
            .upsert(allArticlesToInsert, { onConflict: 'link' })
            .select();

        if (dbError) {
            throw new Error(`Erreur Supabase: ${dbError.message}`);
        }

        const insertedCount = data ? data.length : 0;
        const duration = Date.now() - startTime;

        console.log(`✅ CRON TERMINÉ AVEC SUCCÈS`);
        console.log(`   - Durée: ${duration}ms`);
        console.log(`   - Articles insérés: ${insertedCount}`);
        console.log(`   - Articles éliminés: ${duplicateLinks + duplicateGuids}`);

        return res.status(200).json({
            success: true,
            message: `${insertedCount} articles insérés avec succès`,
            stats: {
                duration: duration,
                articlesProcessed: articlesFromFeeds.length,
                articlesInserted: insertedCount,
                duplicatesRemoved: { byLink: duplicateLinks, byGuid: duplicateGuids, total: duplicateLinks + duplicateGuids }
            }
        });

    } catch (e) {
        console.error("❌ ERREUR FATALE:", e.message);
        console.error("Stack trace:", e.stack);

        return res.status(500).json({
            error: "Erreur critique dans le CRON",
            message: e.message,
            timestamp: new Date().toISOString()
        });
    }
}