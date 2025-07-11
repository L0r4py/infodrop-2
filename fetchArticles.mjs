// fetchArticles.mjs
// Script pour récupérer les articles depuis les flux RSS

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Configuration Supabase
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY
);

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
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (const item of feed.items || []) {
            // Récupérer la date de publication
            let pubDate = item.isoDate ? new Date(item.isoDate) :
                item.pubDate ? new Date(item.pubDate) :
                    new Date();

            // Ne garder que les articles des 24 dernières heures
            if (pubDate < twentyFourHoursAgo) continue;

            // Créer l'objet article
            const article = {
                title: item.title || 'Sans titre',
                url: item.link || item.guid,
                source_name: source.name,
                orientation: source.orientation,
                tags: source.tags || [],
                published_at: pubDate.toISOString(),
                summary: createSummary(item.contentSnippet || item.content || item.description || item.title),
                image_url: item.enclosure?.url || null
            };

            articles.push(article);
        }

        console.log(`✅ ${source.name}: ${articles.length} articles trouvés`);
        return articles;
    } catch (error) {
        console.error(`❌ Erreur pour ${source.name}:`, error.message);
        return [];
    }
}

// Fonction principale
async function fetchAllArticles() {
    console.log('🚀 Début de la récupération des articles...\n');

    try {
        // Récupérer toutes les sources actives
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('*')
            .eq('active', true)
            .order('name');

        if (sourcesError) {
            throw sourcesError;
        }

        console.log(`📋 ${sources.length} sources actives trouvées\n`);

        // Parser les flux en parallèle par batch de 5
        const allArticles = [];
        const batchSize = 5;

        for (let i = 0; i < sources.length; i += batchSize) {
            const batch = sources.slice(i, i + batchSize);
            const promises = batch.map(source => parseFeed(source));
            const results = await Promise.all(promises);

            // Aplatir les résultats
            results.forEach(articles => {
                allArticles.push(...articles);
            });

            // Petite pause entre les batches
            if (i + batchSize < sources.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`\n📊 Total: ${allArticles.length} articles trouvés`);

        // Insérer les articles dans Supabase
        if (allArticles.length > 0) {
            console.log('\n💾 Insertion dans Supabase...');

            // Insérer par batch de 100
            let insertedCount = 0;
            for (let i = 0; i < allArticles.length; i += 100) {
                const batch = allArticles.slice(i, i + 100);

                const { data, error } = await supabase
                    .from('articles')
                    .upsert(batch, {
                        onConflict: 'url',
                        ignoreDuplicates: true
                    });

                if (error) {
                    console.error(`❌ Erreur d'insertion batch ${Math.floor(i / 100) + 1}:`, error.message);

                    // Si c'est une erreur RLS, ajouter une politique
                    if (error.message.includes('row-level security')) {
                        console.log('\n⚠️  Erreur RLS détectée. Exécutez cette commande SQL dans Supabase:');
                        console.log(`CREATE POLICY "Allow insert articles" ON articles FOR INSERT WITH CHECK (true);`);
                        break;
                    }
                } else {
                    insertedCount += batch.length;
                    console.log(`✅ Batch ${Math.floor(i / 100) + 1} inséré (${batch.length} articles)`);
                }
            }

            console.log(`\n✅ ${insertedCount} articles insérés au total`);
        }

        // Statistiques finales
        const { count } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true });

        console.log(`\n📈 Total dans la base: ${count} articles`);

        // Afficher les derniers articles
        const { data: recentArticles } = await supabase
            .from('articles')
            .select('title, source_name, published_at')
            .order('published_at', { ascending: false })
            .limit(5);

        if (recentArticles && recentArticles.length > 0) {
            console.log('\n📰 Derniers articles:');
            recentArticles.forEach(article => {
                const date = new Date(article.published_at);
                console.log(`  - ${article.title.substring(0, 60)}... (${article.source_name}) - ${date.toLocaleString('fr-FR')}`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

// Lancer le fetch
fetchAllArticles()
    .then(() => {
        console.log('\n✨ Terminé!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n💥 Erreur fatale:', err);
        process.exit(1);
    });