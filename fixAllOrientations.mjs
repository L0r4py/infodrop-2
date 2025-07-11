// fixAllOrientations.mjs
// Script pour corriger toutes les orientations mal importées

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function fixAllOrientations() {
    console.log('🔧 Correction complète des orientations...\n');

    // Mapping complet des sources vers leurs orientations correctes
    const corrections = [
        // DROITE
        { names: ['Le Figaro'], orientation: 'droite' },
        { names: ["L'Opinion"], orientation: 'droite' },
        { names: ['Journal de Montréal'], orientation: 'droite' },
        { names: ['OPEX360'], orientation: 'droite' },

        // CENTRE-DROIT
        { names: ['Le Parisien'], orientation: 'centre-droit' },
        { names: ['BFMTV (24/7)', 'BFMTV (People)', 'BFMTV (Crypto)', 'BFMTV'], orientation: 'centre-droit' },
        { names: ['Capital.fr'], orientation: 'centre-droit' },
        { names: ['La Croix (Société)', 'La Croix (Politique)', 'La Croix (Culture)', 'La Croix'], orientation: 'centre-droit' },
        { names: ['Les Échos'], orientation: 'centre-droit' },

        // EXTRÊME-DROITE
        { names: ['Valeurs Actuelles'], orientation: 'extrême-droite' },
        { names: ['Causeur'], orientation: 'extrême-droite' },
        { names: ['Cnews'], orientation: 'extrême-droite' },
        { names: ['Réseau International'], orientation: 'extrême-droite' },
        { names: ['Le Saker Francophone'], orientation: 'extrême-droite' },

        // CENTRE
        { names: ['France Info'], orientation: 'centre' },
        { names: ['Ouest France'], orientation: 'centre' },
        { names: ['RMC'], orientation: 'centre' },
        { names: ['Euronews'], orientation: 'centre' },

        // CENTRE-GAUCHE
        { names: ['Le Monde'], orientation: 'centre-gauche' },
        { names: ['Courrier International'], orientation: 'centre-gauche' },
        { names: ['France Inter'], orientation: 'centre-gauche' },
        { names: ['France24'], orientation: 'centre-gauche' },
        { names: ["L'Obs"], orientation: 'centre-gauche' },

        // GAUCHE
        { names: ['Libération'], orientation: 'gauche' },
        { names: ["L'Humanité", "L'Humanité (Politique)", "L'Humanité (Économie)", "L'Humanité (Opinion)"], orientation: 'gauche' },
        { names: ['Reporterre'], orientation: 'gauche' },
        { names: ['Politis'], orientation: 'gauche' },
        { names: ['Le Devoir'], orientation: 'gauche' },

        // EXTRÊME-GAUCHE
        { names: ['Révolution Permanente'], orientation: 'extrême-gauche' },
        { names: ['Basta!'], orientation: 'extrême-gauche' },
        { names: ['Ballast'], orientation: 'extrême-gauche' }
    ];

    let totalSourcesFixed = 0;
    let totalArticlesFixed = 0;

    // Corriger chaque groupe
    for (const correction of corrections) {
        console.log(`\n📌 Correction vers "${correction.orientation}":`);

        for (const name of correction.names) {
            // Corriger les sources
            const { data: sourcesData, error: sourcesError } = await supabase
                .from('sources')
                .update({ orientation: correction.orientation })
                .ilike('name', `%${name}%`)
                .select();

            if (sourcesError) {
                console.error(`❌ Erreur source "${name}":`, sourcesError.message);
            } else if (sourcesData && sourcesData.length > 0) {
                console.log(`✅ Source "${name}" → ${correction.orientation} (${sourcesData.length} mise(s) à jour)`);
                totalSourcesFixed += sourcesData.length;
            }

            // Corriger les articles
            const { data: articlesData, error: articlesError } = await supabase
                .from('articles')
                .update({ orientation: correction.orientation })
                .ilike('source_name', `%${name}%`)
                .select();

            if (!articlesError && articlesData) {
                console.log(`   📄 ${articlesData.length} articles mis à jour`);
                totalArticlesFixed += articlesData.length;
            }
        }
    }

    // Vérifier le résultat final
    console.log('\n\n📊 RÉSULTAT FINAL:\n');

    // Compter les sources par orientation
    const { data: sourceStats } = await supabase
        .from('sources')
        .select('orientation');

    const sourceCounts = {};
    sourceStats.forEach(s => {
        sourceCounts[s.orientation] = (sourceCounts[s.orientation] || 0) + 1;
    });

    console.log('Sources par orientation:');
    Object.entries(sourceCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([orientation, count]) => {
            console.log(`  ${orientation}: ${count} sources`);
        });

    // Compter les articles par orientation
    const { data: articleStats } = await supabase
        .from('articles')
        .select('orientation')
        .limit(2000);

    const articleCounts = {};
    articleStats.forEach(a => {
        articleCounts[a.orientation] = (articleCounts[a.orientation] || 0) + 1;
    });

    console.log('\nArticles par orientation:');
    Object.entries(articleCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([orientation, count]) => {
            console.log(`  ${orientation}: ${count} articles`);
        });

    console.log(`\n✅ Correction terminée!`);
    console.log(`   Sources corrigées: ${totalSourcesFixed}`);
    console.log(`   Articles corrigés: ${totalArticlesFixed}`);
}

// Exécuter
fixAllOrientations()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Erreur:', err);
        process.exit(1);
    });