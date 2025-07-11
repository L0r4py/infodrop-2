// checkRightSources.mjs
// Script pour diagnostiquer pourquoi il n'y a pas d'articles à droite/centre-droit

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkRightSources() {
    console.log('🔍 Diagnostic des sources droite/centre-droit\n');

    // 1. Vérifier quelles sources devraient être à droite/centre-droit
    const expectedRightSources = [
        { name: 'Le Figaro', expected: 'droite' },
        { name: 'Le Parisien', expected: 'centre-droit' },
        { name: 'BFMTV', expected: 'centre-droit' },
        { name: 'Capital.fr', expected: 'centre-droit' },
        { name: "L'Opinion", expected: 'droite' },
        { name: 'Valeurs Actuelles', expected: 'extrême-droite' },
        { name: 'Causeur', expected: 'extrême-droite' },
        { name: 'RMC', expected: 'centre' },
        { name: 'Journal de Montréal', expected: 'droite' }
    ];

    console.log('📋 VÉRIFICATION DES SOURCES:\n');

    for (const expected of expectedRightSources) {
        // Chercher la source
        const { data: sources } = await supabase
            .from('sources')
            .select('*')
            .ilike('name', `%${expected.name}%`);

        if (sources && sources.length > 0) {
            sources.forEach(source => {
                const isCorrect = source.orientation === expected.expected;
                console.log(
                    `${isCorrect ? '✅' : '❌'} ${source.name}: "${source.orientation}" ${isCorrect ? '' : `(devrait être "${expected.expected}")`
                    }`
                );
            });
        } else {
            console.log(`⚠️ "${expected.name}" non trouvé dans les sources`);
        }
    }

    // 2. Lister TOUTES les sources actuellement marquées comme droite/centre-droit
    console.log('\n\n📊 SOURCES ACTUELLEMENT À DROITE/CENTRE-DROIT:\n');

    const { data: rightSources } = await supabase
        .from('sources')
        .select('name, orientation, url')
        .in('orientation', ['droite', 'centre-droit', 'centre-droite'])
        .order('name');

    if (rightSources && rightSources.length > 0) {
        console.log('Sources à droite/centre-droit:');
        rightSources.forEach(source => {
            console.log(`  - ${source.name} (${source.orientation})`);
        });
    } else {
        console.log('❌ AUCUNE source trouvée avec orientation droite ou centre-droit!');
    }

    // 3. Vérifier les variantes d'orthographe possibles
    console.log('\n\n🔤 VÉRIFICATION DES VARIANTES D\'ORTHOGRAPHE:\n');

    const { data: allOrientations } = await supabase
        .from('sources')
        .select('orientation');

    const uniqueOrientations = [...new Set(allOrientations.map(s => s.orientation))];
    console.log('Orientations uniques trouvées:', uniqueOrientations);

    // Chercher des variantes possibles
    const variants = uniqueOrientations.filter(o =>
        o && (o.includes('droit') || o.includes('right'))
    );

    if (variants.length > 0) {
        console.log('\nVariantes contenant "droit/right":', variants);
    }

    // 4. Compter les articles par source pour les sources qui devraient être à droite
    console.log('\n\n📈 ARTICLES PAR SOURCE (sources qui devraient être à droite):\n');

    for (const expected of expectedRightSources.filter(e => ['droite', 'centre-droit'].includes(e.expected))) {
        const { count } = await supabase
            .from('articles')
            .select('*', { count: 'exact', head: true })
            .ilike('source_name', `%${expected.name}%`);

        console.log(`${expected.name}: ${count || 0} articles`);
    }

    // 5. Script de correction
    console.log('\n\n🔧 SCRIPT DE CORRECTION SQL:\n');
    console.log('-- Copiez et exécutez ceci dans Supabase SQL Editor:');
    console.log('');

    expectedRightSources.forEach(source => {
        console.log(`UPDATE sources SET orientation = '${source.expected}' WHERE name ILIKE '%${source.name}%';`);
        console.log(`UPDATE articles SET orientation = '${source.expected}' WHERE source_name ILIKE '%${source.name}%';`);
    });

    // 6. Vérifier s'il y a des tirets au lieu d'espaces
    console.log('\n\n🔍 RECHERCHE DE PROBLÈMES DE FORMAT:\n');

    const { data: problematicSources } = await supabase
        .from('sources')
        .select('name, orientation')
        .or('orientation.eq.centre-droit,orientation.eq.centre-droite,orientation.eq.center-right');

    if (problematicSources && problematicSources.length > 0) {
        console.log('⚠️ Sources avec tirets dans l\'orientation:');
        problematicSources.forEach(s => {
            console.log(`  - ${s.name}: "${s.orientation}"`);
        });

        console.log('\n💡 Correction suggérée:');
        console.log("UPDATE sources SET orientation = 'centre droit' WHERE orientation IN ('centre-droit', 'centre-droite', 'center-right');");
        console.log("UPDATE articles SET orientation = 'centre droit' WHERE orientation IN ('centre-droit', 'centre-droite', 'center-right');");
    }
}

// Exécuter
checkRightSources()
    .then(() => {
        console.log('\n✅ Diagnostic terminé');
        process.exit(0);
    })
    .catch(err => {
        console.error('Erreur:', err);
        process.exit(1);
    });