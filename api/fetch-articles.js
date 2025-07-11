// api/fetch-articles.js
// Endpoint API pour cron-job.org - Récupère les articles et nettoie les anciens

export default async function handler(req, res) {
    // CORS pour cron-job.org
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

    try {
        // Import des dépendances
        const Parser = (await import('rss-parser')).default;
        const { createClient } = await import('@supabase/supabase-js');

        // Vérifier le token (optionnel mais recommandé)
        const token = req.headers['x-cron-token'] || req.query.token;
        if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Configuration
        const supabase = createClient(
            process.env.REACT_APP_SUPABASE_URL,
            process.env.REACT_APP_SUPABASE_ANON_KEY
        );

        const parser = new Parser({
            timeout: 10000,
            headers: { 'User-Agent': 'INFODROP RSS Parser/2.0' }
        });

        const startTime = Date.now();
        console.log('🚀 Début de la récupération RSS...');

        // 1. RÉCUPÉRER LES SOURCES
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('*')
            .eq('active', true);

        if (sourcesError) throw sourcesError;

        // 2. PARSER LES FLUX RSS
        const allArticles = [];
        const results = { sources_ok: 0, sources_error: 0 };
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Parser par batch de 5 pour éviter la surcharge
        const batchSize = 5;
        for (let i = 0; i < sources.length; i += batchSize) {
            const batch = sources.slice(i, i + batchSize);

            const promises = batch.map(async (source) => {
                try {
                    const feed = await parser.parseURL(source.url);
                    const articles = [];

                    for (const item of feed.items || []) {
                        let pubDate = item.isoDate ? new Date(item.isoDate) :
                            item.pubDate ? new Date(item.pubDate) :
                                new Date();

                        // Garder seulement les articles des 24 dernières heures
                        if (pubDate >= twentyFourHoursAgo && pubDate <= now) {
                            articles.push({
                                title: item.title || 'Sans titre',
                                url: item.link || item.guid,
                                source_name: source.name,
                                source_id: source.id,
                                orientation: source.orientation,
                                tags: source.tags || [],
                                published_at: pubDate.toISOString(),
                                summary: createSummary(item),
                                image_url: item.enclosure?.url || null
                            });
                        }
                    }

                    results.sources_ok++;
                    return articles;
                } catch (error) {
                    console.error(`❌ Erreur ${source.name}:`, error.message);
                    results.sources_error++;
                    return [];
                }
            });

            const batchResults = await Promise.all(promises);
            batchResults.forEach(articles => allArticles.push(...articles));
        }

        // 3. INSÉRER LES NOUVEAUX ARTICLES
        let inserted = 0;
        if (allArticles.length > 0) {
            // Insérer par batch de 100
            for (let i = 0; i < allArticles.length; i += 100) {
                const batch = allArticles.slice(i, i + 100);
                const { error } = await supabase
                    .from('articles')
                    .upsert(batch, {
                        onConflict: 'url',
                        ignoreDuplicates: true
                    });

                if (!error) {
                    inserted += batch.length;
                }
            }
        }

        // 4. NETTOYER LES ARTICLES DE PLUS DE 24H
        const { data: deletedData, error: deleteError } = await supabase
            .from('articles')
            .delete()
            .lt('published_at', twentyFourHoursAgo.toISOString())
            .select();

        const deleted = deletedData ? deletedData.length : 0;

        // 5. STATISTIQUES FINALES
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        const response = {
            success: true,
            duration: `${duration}s`,
            sources: {
                total: sources.length,
                ok: results.sources_ok,
                error: results.sources_error
            },
            articles: {
                found: allArticles.length,
                inserted: inserted,
                deleted: deleted
            },
            timestamp: new Date().toISOString()
        };

        console.log('✅ Terminé:', response);
        return res.status(200).json(response);

    } catch (error) {
        console.error('💥 Erreur:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// Fonction helper pour créer un résumé
function createSummary(item) {
    const text = item.contentSnippet || item.content || item.description || item.title || '';

    // Nettoyer le HTML et limiter à 180 caractères
    let clean = text.replace(/<[^>]*>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (clean.length > 180) {
        clean = clean.substring(0, 177) + '...';
    }

    return clean;
}