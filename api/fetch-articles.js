// api/fetch-articles.js
// Endpoint Vercel pour récupérer les articles RSS

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// IMPORTANT: Exporter une fonction handler par défaut
export default async function handler(req, res) {
    // Log pour debug
    console.log('🚀 Endpoint fetch-articles appelé à', new Date().toISOString());

    // Configuration CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    try {
        // Configuration Supabase
        const supabase = createClient(
            process.env.REACT_APP_SUPABASE_URL,
            process.env.REACT_APP_SUPABASE_ANON_KEY
        );

        // Vérifier la connexion Supabase
        const { error: testError } = await supabase
            .from('sources')
            .select('count')
            .limit(1)
            .single();

        if (testError) {
            throw new Error(`Erreur Supabase: ${testError.message}`);
        }

        // Configuration du parser RSS
        const parser = new Parser({
            timeout: 10000,
            headers: {
                'User-Agent': 'INFODROP RSS Parser/2.0'
            }
        });

        // Fonction pour nettoyer le HTML et créer un résumé
        function createSummary(text) {
            if (!text) return '';

            // Retirer les balises HTML
            let cleanText = text.replace(/<[^>]*>/g, ' ');

            // Décoder les entités HTML
            cleanText = cleanText
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&nbsp;/g, ' ')
                .replace(/&#39;/g, "'")
                .replace(/&rsquo;/g, "'")
                .replace(/&lsquo;/g, "'")
                .replace(/&rdquo;/g, '"')
                .replace(/&ldquo;/g, '"')
                .replace(/&hellip;/g, '...');

            // Retirer les espaces multiples
            cleanText = cleanText.replace(/\s+/g, ' ').trim();

            // Limiter à 180 caractères
            if (cleanText.length > 180) {
                cleanText = cleanText.substring(0, 177) + '...';
            }

            return cleanText;
        }

        // Fonction pour parser un flux RSS
        async function parseFeed(source) {
            try {
                console.log(`📡 Parsing ${source.name}...`);
                const feed = await parser.parseURL(source.url);

                const articles = [];
                const now = new Date();

                // IMPORTANT: Augmenter la fenêtre de temps à 48h pour ne pas rater d'articles
                const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

                for (const item of feed.items || []) {
                    // Récupérer la date de publication
                    let pubDate;
                    if (item.isoDate) {
                        pubDate = new Date(item.isoDate);
                    } else if (item.pubDate) {
                        pubDate = new Date(item.pubDate);
                    } else if (item.pubdate) {
                        pubDate = new Date(item.pubdate);
                    } else {
                        // Si pas de date, utiliser maintenant
                        pubDate = new Date();
                    }

                    // Vérifier si la date est valide
                    if (isNaN(pubDate.getTime())) {
                        pubDate = new Date();
                    }

                    // Garder les articles des 48 dernières heures
                    if (pubDate < fortyEightHoursAgo) continue;

                    // Créer l'objet article
                    const article = {
                        title: item.title || 'Sans titre',
                        url: item.link || item.guid || '',
                        source_name: source.name,
                        source_id: source.id,
                        orientation: source.orientation || 'neutre',
                        tags: source.tags || [],
                        published_at: pubDate.toISOString(),
                        summary: createSummary(
                            item.contentSnippet ||
                            item.content ||
                            item.summary ||
                            item.description ||
                            item.title ||
                            ''
                        ),
                        image_url: item.enclosure?.url || null
                    };

                    // Vérifier que l'article a une URL valide
                    if (article.url && article.title) {
                        articles.push(article);
                    }
                }

                console.log(`✅ ${source.name}: ${articles.length} articles trouvés`);
                return articles;
            } catch (error) {
                console.error(`❌ Erreur pour ${source.name}:`, error.message);
                return [];
            }
        }

        // Récupérer toutes les sources actives
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('*')
            .eq('active', true)
            .order('name');

        if (sourcesError) {
            throw new Error(`Erreur sources: ${sourcesError.message}`);
        }

        console.log(`📋 ${sources.length} sources actives trouvées`);

        // Parser les flux en parallèle par batch
        const allArticles = [];
        const batchSize = 5;

        for (let i = 0; i < sources.length; i += batchSize) {
            const batch = sources.slice(i, i + batchSize);
            const promises = batch.map(source => parseFeed(source));
            const results = await Promise.all(promises);

            results.forEach(articles => {
                allArticles.push(...articles);
            });

            // Pause entre les batches
            if (i + batchSize < sources.length) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log(`\n📊 Total: ${allArticles.length} articles trouvés`);

        if (allArticles.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucun nouvel article trouvé',
                stats: {
                    sources: sources.length,
                    articles: 0,
                    timestamp: new Date().toISOString()
                }
            });
        }

        // Insérer les articles avec upsert pour éviter les doublons
        let inserted = 0;
        let updated = 0;
        const batchInsertSize = 50; // Réduire la taille des batches

        for (let i = 0; i < allArticles.length; i += batchInsertSize) {
            const batch = allArticles.slice(i, i + batchInsertSize);

            try {
                const { data, error } = await supabase
                    .from('articles')
                    .upsert(batch, {
                        onConflict: 'url',
                        ignoreDuplicates: false // Mettre à jour si existe
                    })
                    .select();

                if (error) {
                    console.error(`❌ Erreur batch ${i}:`, error.message);
                } else if (data) {
                    inserted += data.length;
                }
            } catch (err) {
                console.error(`❌ Erreur insertion:`, err.message);
            }
        }

        // Nettoyer les vieux articles (plus de 7 jours)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        try {
            const { count } = await supabase
                .from('articles')
                .delete()
                .lt('published_at', sevenDaysAgo.toISOString())
                .select('*', { count: 'exact', head: true });

            console.log(`🗑️ ${count || 0} anciens articles supprimés`);
        } catch (err) {
            console.error('❌ Erreur suppression:', err.message);
        }

        // Résultat final
        const result = {
            success: true,
            message: 'Mise à jour terminée',
            stats: {
                sources: sources.length,
                articlesFound: allArticles.length,
                articlesInserted: inserted,
                timestamp: new Date().toISOString()
            }
        };

        console.log('✅ Résultat:', result);

        return res.status(200).json(result);

    } catch (error) {
        console.error('❌ Erreur globale:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}