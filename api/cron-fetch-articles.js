// Fichier : /api/cron-fetch-articles.js
// Ce fichier est une fonction serverless pour Vercel.
// Son but est de récupérer et de stocker les articles depuis différentes sources.
// Il est destiné à être appelé automatiquement par un service de cron (comme cron-job.org).

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

// Initialisation du client Supabase
// Ces variables d'environnement doivent être configurées dans les "Environment Variables" de ton projet sur Vercel.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialisation du parser RSS
const parser = new Parser();

// La fonction 'handler' est le point d'entrée exécuté par Vercel
export default async function handler(request, response) {
    // Une petite sécurité : on pourrait vérifier un "token" secret dans l'URL 
    // pour s'assurer que seul cron-job.org peut appeler cette fonction.
    // Exemple: /api/cron-fetch-articles?token=VOTRE_SECRET_PARTAGE

    console.log("CRON JOB: Démarrage de la récupération des articles.");

    try {
        // 1. Récupérer toutes les sources depuis la table 'sources' de Supabase
        const { data: sources, error: sourcesError } = await supabase
            .from('sources')
            .select('id, url, name, language');

        if (sourcesError) {
            // Si on ne peut pas récupérer les sources, on arrête tout.
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
                    continue; // Passe à la source suivante
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
                // `upsert` avec `onConflict: 'link'` permet d'éviter les doublons si un article avec le même lien existe déjà.
                const { error: insertError, count } = await supabase
                    .from('articles')
                    .upsert(articlesToInsert, { onConflict: 'link', ignoreDuplicates: false });

                if (insertError) {
                    // On log l'erreur pour cette source, mais on continue le script pour les autres
                    console.error(`Erreur d'insertion pour la source ${source.name}:`, insertError.message);
                } else {
                    if (count) {
                        totalArticlesAdded += count;
                        console.log(`${count} nouveaux articles ajoutés pour ${source.name}.`);
                    } else {
                        console.log(`Aucun nouvel article à ajouter pour ${source.name}.`);
                    }
                }

            } catch (parseError) {
                // Si un flux RSS ne fonctionne pas, on le signale et on continue
                console.error(`Erreur de parsing RSS pour ${source.name} (${source.url}):`, parseError.message);
            }
        }

        console.log(`CRON JOB: Tâche terminée. ${totalArticlesAdded} articles ont été ajoutés au total.`);
        // 4. Envoyer une réponse de succès
        response.status(200).json({ status: 'success', message: `Tâche terminée. ${totalArticlesAdded} articles ajoutés.` });

    } catch (error) {
        console.error("CRON JOB: Erreur critique dans la tâche.", error);
        // 5. Envoyer une réponse d'erreur en cas de problème majeur
        response.status(500).json({ status: 'error', message: error.message });
    }
}