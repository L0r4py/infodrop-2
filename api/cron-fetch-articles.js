// Fichier : /api/cron-fetch-articles.js
// Version corrigée pour utiliser la syntaxe CommonJS (require) attendue par Vercel.

const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

// Initialisation du client Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialisation du parser RSS
const parser = new Parser();

// La fonction handler doit être exportée de cette manière en CommonJS
module.exports = async (request, response) => {
    console.log("CRON JOB: Démarrage de la récupération des articles.");

    try {
        // 1. Récupérer toutes les sources depuis la table 'sources' de Supabase
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('id, url, name, language');

        if (sourcesError) {
            throw new Error(`Erreur Supabase lors de la récupération des sources : ${sourcesError.message}`);
        }

        if (!sources || sources.length === 0) {
            console.log("CRON JOB: Aucune source à traiter dans la base de données.");
            return response.status(200).json({ message: 'Aucune source trouvée, tâche terminée.' });
        }

        let totalArticlesAdded = 0;

        // 2. Boucler sur chaque source pour parser son flux RSS
        for (const source of sources) {
            console.log(`Traitement de la source : ${source.name}`);
            try {
                const feed = await parser.parseURL(source.url);

                if (!feed.items || feed.items.length === 0) {
                    console.log(`Aucun article trouvé pour la source : ${source.name}`);
                    continue;
                }

                const articlesToInsert = feed.items.map(item => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                    content: item.contentSnippet || item.content || 'Contenu non disponible',
                    source_id: source.id,
                    language: source.language
                }));

                // 3. Insérer les nouveaux articles dans Supabase
                const { error, count } = await supabase
                    .from('articles')
                    .upsert(articlesToInsert, { onConflict: 'link', ignoreDuplicates: false });

                if (error) {
                    console.error(`Erreur d'insertion pour la source ${source.name}:`, error.message);
                } else {
                    if (count) {
                        totalArticlesAdded += count;
                        console.log(`${count} nouveaux articles ajoutés pour ${source.name}.`);
                    } else {
                        console.log(`Aucun nouvel article à ajouter pour ${source.name}.`);
                    }
                }

            } catch (parseError) {
                console.error(`Erreur de parsing RSS pour ${source.name} (${source.url}):`, parseError.message);
            }
        }

        console.log(`CRON JOB: Tâche terminée. ${totalArticlesAdded} articles ont été ajoutés au total.`);
        response.status(200).json({ status: 'success', message: `Tâche terminée. ${totalArticlesAdded} articles ajoutés.` });

    } catch (error) {
        console.error("CRON JOB: Erreur critique dans la tâche.", error);
        response.status(500).json({ status: 'error', message: error.message });
    }
};