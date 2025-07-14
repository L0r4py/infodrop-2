// api/cron-purge-articles.js
// Logique de daily-purge.js (V1) adaptée

import { supabaseAdmin } from './config.mjs'; // ✅ On utilise la config centralisée

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Attention: le nom de la table `actu` vient de ton fichier V1. Si ta nouvelle table s'appelle `articles`, change-le ici.
        // Pareil pour la colonne `heure` qui s'appelle peut-être `pubDate`.
        const { data, error } = await supabaseAdmin
            .from('articles') // <-- VÉRIFIE CE NOM
            .delete()
            .lt('pubDate', twentyFourHoursAgo.toISOString()); // <-- VÉRIFIE CE NOM

        if (error) throw error;

        res.status(200).json({ success: true, deleted_count: data?.length || 0 });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}