// Fichier : api/cron-fetch-articles.js
// Description : Ce script est appelé par cron-job.org. Il récupère les articles des flux RSS
// et les sauvegarde dans Supabase, en évitant les doublons.

import { createClient } from '@supabase/supabase-js';
import RssParser from 'rss-parser';
import { newsSources } from '../../src/data/newsSources.js'; // Chemin relatif pour Vercel

// Initialisation du client Supabase
// Il faut que tes variables d'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY soient bien configurées sur Vercel
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Initialisation du parseur RSS
const parser = new RssParser();

// Handler de la fonction serverless Vercel
export default async function handler(req, res) {
    // Sécurité simple : on vérifie si la requête contient un secret
    // pour s'assurer qu'elle vient bien de notre cron-job.
    // Configure cette variable d'environnement dans Vercel !
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    console.log('Cron job démarré : Récupération des articles.');
    const allArticlesToInsert = [];

    // Boucle sur chaque source de média définie dans newsSources.js
    for (const source of newsSources) {
        try {
            console.log(`Traitement de la source : ${source.name}`);
            const feed = await parser.parseURL(source.url);

            // Pour chaque article dans le flux RSS...
            for (const item of feed.items) {
                // On s'assure que les champs essentiels sont présents
                if (item.title && item.link && item.pubDate && item.guid) {
                    allArticlesToInsert.push({
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.pubDate), // Conversion en objet Date
                        source_name: source.name,
                        image_url: item.enclosure?.url || null, // Récupère l'image si elle existe
                        guid: item.guid,
                    });
                }
            }
        } catch (error) {
            console.error(`Erreur lors du traitement de ${source.name}:`, error.message);
            // On continue avec la source suivante même si une échoue
        }
    }

    if (allArticlesToInsert.length === 0) {
        console.log('Aucun article trouvé à insérer.');
        return res.status(200).json({ message: 'Aucun article trouvé à insérer.' });
    }

    console.log(`${allArticlesToInsert.length} articles prêts à être insérés/mis à jour.`);

    // Insertion en masse dans Supabase avec "upsert"
    // `upsert` va insérer les nouveaux articles. Si un article avec le même `link` existe déjà,
    // il sera ignoré grâce à la contrainte UNIQUE qu'on a mise sur la table.
    const { data, error } = await supabase
        .from('articles')
        .upsert(allArticlesToInsert, {
            onConflict: 'link', // La colonne qui détermine un conflit/doublon
        });

    if (error) {
        console.error('Erreur lors de l\'insertion dans Supabase:', error);
        return res.status(500).json({ error: error.message });
    }

    console.log('Cron job terminé avec succès.');
    return res.status(200).json({ message: 'Articles récupérés avec succès.' });
}