// testRSS.mjs
// Script pour tester si les flux RSS retournent des articles récents

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// Configuration
const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

const parser = new Parser({
    timeout: 10000,
    headers: {
        'User-Agent': 'INFODROP RSS Parser/2.0'
    }
});

async function testRSS() {
    console.log('🔍 Test des flux RSS\n');

    // Récupérer quelques sources pour tester
    const { data: sources, error } = await supabase
        .from('sources')
        .select('*')
        .eq('active', true)
        .limit(5);

    if (error) {
        console.error('❌ Erreur:', error.message);
        return;
    }

    console.log(`📋 Test de ${sources.length} sources:\n`);

    for (const source of sources) {
        console.log(`\n📡 ${source.name}`);
        console.log(`URL: ${source.url}`);

        try {
            const feed = await parser.parseURL(source.url);

            if (!feed.items || feed.items.length === 0) {
                console.log('⚠️  Aucun article dans le flux');
                continue;
            }

            console.log(`✅ ${feed.items.length} articles dans le flux`);

            // Analyser les dates des 3 premiers articles
            const now = new Date();
            console.log('\n📅 Dates des 3 premiers articles:');

            for (let i = 0; i < Math.min(3, feed.items.length); i++) {
                const item = feed.items[i];

                // Trouver la date
                let pubDate = null;
                if (item.isoDate) {
                    pubDate = new Date(item.isoDate);
                } else if (item.pubDate) {
                    pubDate = new Date(item.pubDate);
                } else if (item.pubdate) {
                    pubDate = new Date(item.pubdate);
                }

                if (pubDate && !isNaN(pubDate.getTime())) {
                    const hoursAgo = Math.floor((now - pubDate) / (1000 * 60 * 60));
                    console.log(`  ${i + 1}. "${item.title?.substring(0, 50)}..."`);
                    console.log(`     Publié il y a ${hoursAgo} heures (${pubDate.toLocaleString('fr-FR')})`);
                } else {
                    console.log(`  ${i + 1}. "${item.title?.substring(0, 50)}..." - ⚠️ Pas de date`);
                }
            }

        } catch (err) {
            console.log(`❌ Erreur: ${err.message}`);
        }
    }

    // Vérifier les articles dans la base
    console.log('\n\n📊 Articles dans la base de données:');

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentArticles, count } = await supabase
        .from('articles')
        .select('*', { count: 'exact' })
        .gte('published_at', oneDayAgo.toISOString())
        .order('published_at', { ascending: false })
        .limit(10);

    console.log(`\n📰 ${count || 0} articles des dernières 24h`);

    if (recentArticles && recentArticles.length > 0) {
        console.log('\nDerniers articles:');
        recentArticles.forEach((article, i) => {
            const pubDate = new Date(article.published_at);
            console.log(`${i + 1}. ${pubDate.toLocaleString('fr-FR')} | ${article.source_name}`);
            console.log(`   "${article.title.substring(0, 60)}..."`);
        });
    }
}

// Exécuter le test
testRSS().catch(console.error);