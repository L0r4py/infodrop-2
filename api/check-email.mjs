// api/check-email.js
// Logique V1 adaptée pour la nouvelle config

import { supabaseAdmin } from './config.mjs'; // ✅ On utilise la config centralisée

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Format d\'email invalide.' });
    }

    try {
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;

        const userExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase());
        return res.status(200).json({ exists: userExists });

    } catch (error) {
        return res.status(500).json({ error: 'Erreur serveur.', details: error.message });
    }
}