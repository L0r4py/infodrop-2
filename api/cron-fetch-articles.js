// Fichier : api/cron-fetch-articles.js
// Version FINALE BLINDÉE avec gestion d'erreurs ultra-robuste

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from './newsSources.js';

export default async function handler(req, res) {
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    try {
        // --- BLOC 1 : Initialisation ---
        console.log('Cron job PARALLÈLE BLINDÉ démarré.');
        const startTime = Date.now();

        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseServiceKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Les variables d'environnement Supabase sont manquantes.");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const parser = new RssParser({ timeout: 8000 });

        // --- BLOC 2 : Traitement Parallèle des Flux RSS ---
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

        const allPromises = (newsSources || []).map(fetchFeed);
        const results = await Promise.allSettled(allPromises);

        let successCount = 0;
        let errorCount = 0;

        const allArticlesToInsert = results
            .filter(r => {
                if (r.status === 'fulfilled') {
                    successCount++;
                    return true;
                }
                errorCount++;
                return false;
            })
            .flatMap(r => r.value);

        console.log(`📊 Flux traités: ${successCount} succès, ${errorCount} échecs`);

        if (allArticlesToInsert.length === 0) {
            return res.status(200).json({
                message: 'Aucun article trouvé, mais le script a fonctionné.',
                sources_success: successCount,
                sources_error: errorCount,
                duration_ms: Date.now() - startTime
            });
        }

        // --- BLOC 3 : Insertion dans Supabase ---
        console.log(`📝 ${allArticlesToInsert.length} articles à insérer...`);

        const { data, error: dbError } = await supabase
            .from('articles')
            .upsert(allArticlesToInsert, { onConflict: 'link' })
            .select();

        if (dbError) {
            throw new Error(`Erreur Supabase: ${dbError.message}`);
        }

        const insertedCount = data ? data.length : 0;
        const duration = Date.now() - startTime;

        console.log(`✅ Cron terminé en ${duration}ms`);

        return res.status(200).json({
            success: true,
            message: `${insertedCount} articles insérés avec succès`,
            articles_found: allArticlesToInsert.length,
            articles_inserted: insertedCount,
            sources_success: successCount,
            sources_error: errorCount,
            duration_ms: duration
        });

    } catch (e) {
        // --- BLOC 4 : Capture de toutes les erreurs ---
        console.error("❌ ERREUR FATALE:", e.message);
        console.error("Stack:", e.stack);

        return res.status(500).json({
            error: "Erreur critique dans le CRON",
            message: e.message,
            timestamp: new Date().toISOString()
        });
    }
}