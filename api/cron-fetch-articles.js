// Fichier : api/cron-fetch-articles.js
// Version ULTIME : Traitement par lots pour respecter les limites de Vercel.

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js';

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    try {
        console.log('Cron job par LOTS démarré.');
        const startTime = Date.now();

        const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_SERVICE_KEY);
        const parser = new RssParser({ timeout: 8000 });

        const fetchFeed = async (source) => {
            if (!source || !source.url) return [];
            try {
                const feed = await parser.parseURL(source.url);
                return (feed.items || []).map(item => {
                    if (item.title && item.link && item.pubDate && item.guid) {
                        return { title: item.title, link: item.link, pubDate: new Date(item.pubDate), source_name: source.name, image_url: item.enclosure?.url || null, guid: item.guid, orientation: source.orientation || 'neutre', category: source.category || 'généraliste', tags: source.category ? [source.category] : [] };
                    }
                    return null;
                }).filter(Boolean);
            } catch (error) {
                console.warn(`⚠️ Le flux ${source.name} a échoué (ignoré): ${error.message}`);
                return [];
            }
        };

        const BATCH_SIZE = 10; // On traite 10 flux à la fois.
        let allArticlesToInsert = [];
        let totalSuccess = 0;
        let totalErrors = 0;

        for (let i = 0; i < newsSources.length; i += BATCH_SIZE) {
            const batch = newsSources.slice(i, i + BATCH_SIZE);
            console.log(`Traitement du lot ${i / BATCH_SIZE + 1}... (${batch.length} sources)`);

            const promises = batch.map(fetchFeed);
            const results = await Promise.allSettled(promises);

            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    allArticlesToInsert.push(...r.value);
                    totalSuccess++;
                } else {
                    totalErrors++;
                }
            });
        }

        console.log(`📊 Traitement des flux terminé: ${totalSuccess} succès, ${totalErrors} échecs.`);

        if (allArticlesToInsert.length === 0) {
            return res.status(200).json({ message: 'Aucun article trouvé, mais le script a fonctionné.' });
        }

        console.log(`📝 ${allArticlesToInsert.length} articles à insérer...`);
        const { data, error: dbError } = await supabase.from('articles').upsert(allArticlesToInsert, { onConflict: 'link' }).select();

        if (dbError) throw new Error(`Erreur Supabase: ${dbError.message}`);

        const insertedCount = data ? data.length : 0;
        const duration = Date.now() - startTime;
        console.log(`✅ Cron terminé en ${duration}ms`);

        return res.status(200).json({ success: true, message: `${insertedCount} articles insérés avec succès`, articles_found: allArticlesToInsert.length, articles_inserted: insertedCount });

    } catch (e) {
        console.error("❌ ERREUR FATALE:", e.message);
        return res.status(500).json({ error: "Erreur critique dans le CRON", message: e.message });
    }
}