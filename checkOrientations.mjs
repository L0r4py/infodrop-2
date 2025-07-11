// checkOrientations.mjs
// Script pour vérifier et corriger les orientations dans Supabase

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkOrientations() {
    console.log('🔍 Vérification des orientations dans Supabase...\n');

    // 1. Vérifier les sources
    console.log('📰 SOURCES:');
    const { data: sources, error: sourcesError } = await supabase
        .from('sources')
        .select('name, orientation')
        .order('orientation');

    if (sourcesError) {
        console.error('Erreur:', sourcesError);
        return;
    }

    // Grouper par orientation
    const sourcesByOrientation = {};
    sources.forEach(source => {
        const orientation = source.orientation || 'non-défini';
        if (!sourcesByOrientation[orientation]) {
            sourcesByOrientation[orientation] = [];
        }
        sourcesByOrientation[orientation].push(source.name);
    });

    // Afficher
    Object.entries(sourcesByOrientation).forEach(([orientation, names]) => {
        console.log(`\n${orientation} (${names.length} sources):`);
        names.slice(0, 5).forEach(name => console.log(`  - ${name}`));
        if (names.length > 5) console.log(`  ... et ${names.length - 5} autres`);
    });

    // 2. Vérifier les articles
    console.log('\n\n📄 ARTICLES:');
    const { data: articlesStats } = await supabase
        .from('articles')
        .select('orientation')
        .limit(1000);

    const articlesByOrientation = {};
    articlesStats.forEach(article => {
        const orientation = article.orientation || 'non-défini';
        articlesByOrientation[orientation] = (articlesByOrientation[orientation] || 0) + 1;
    });

    console.log('\nRépartition des articles:');
    Object.entries(articlesByOrientation)
        .sort((a, b) => b[1] - a[1])
        .forEach(([orientation, count]) => {
            console.log(`  ${orientation}: ${count} articles`);
        });

    // 3. Identifier les problèmes
    console.log('\n\n⚠️ PROBLÈMES IDENTIFIÉS:');

    // Sources qui devraient être à droite/centre-droit
    const expectedRight = ['Le Figaro', 'Le Parisien', 'BFMTV', 'Capital.fr'];
    const problemSources = [];

    for (const source of sources) {
        if (expectedRight.some(name => source.name.includes(name))) {
            if (!['droite', 'centre-droit'].includes(source.orientation)) {
                problemSources.push({
                    name: source.name,
                    current: source.orientation,
                    expected: source.name.includes('Figaro') ? 'droite' : 'centre-droit'
                });
            }
        }
    }

    if (problemSources.length > 0) {
        console.log('\nSources avec orientation incorrecte:');
        problemSources.forEach(p => {
            console.log(`  ❌ ${p.name}: "${p.current}" → devrait être "${p.expected}"`);
        });
    }

    // 4. Proposer des corrections
    console.log('\n\n💡 CORRECTIONS SUGGÉRÉES:');
    console.log('Voulez-vous corriger automatiquement ? (décommentez la ligne ci-dessous)');
    console.log('// await fixOrientations();');
}

// Fonction pour corriger les orientations
async function fixOrientations() {
    console.log('\n🔧 Correction des orientations...');

    const corrections = [
        { name: 'Le Figaro', orientation: 'droite' },
        { name: 'Le Parisien', orientation: 'centre-droit' },
        { name: 'BFMTV', orientation: 'centre-droit' },
        { name: 'Capital.fr', orientation: 'centre-droit' },
        { name: "L'Opinion", orientation: 'droite' },
        { name: 'RMC', orientation: 'centre' }
    ];

    for (const correction of corrections) {
        // Corriger dans les sources
        const { error: sourceError } = await supabase
            .from('sources')
            .update({ orientation: correction.orientation })
            .ilike('name', `%${correction.name}%`);

        if (sourceError) {
            console.error(`❌ Erreur correction source ${correction.name}:`, sourceError);
        } else {
            console.log(`✅ Source ${correction.name} → ${correction.orientation}`);
        }

        // Corriger dans les articles
        const { error: articleError } = await supabase
            .from('articles')
            .update({ orientation: correction.orientation })
            .ilike('source_name', `%${correction.name}%`);

        if (!articleError) {
            console.log(`✅ Articles de ${correction.name} mis à jour`);
        }
    }

    console.log('\n✨ Corrections terminées!');
}

// Exécuter
checkOrientations()
    .then(() => {
        console.log('\n✅ Vérification terminée');
        process.exit(0);
    })
    .catch(err => {
        console.error('Erreur:', err);
        process.exit(1);
    });