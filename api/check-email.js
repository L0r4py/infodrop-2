// api/check-email.js
// Vérifie si un email existe déjà dans la base (Version Vercel)

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Format d\'email invalide.' });
    }

    try {
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Configuration Supabase manquante');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // On liste tous les users (jusqu'à 1000, attention en cas de très grosse base)
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('[check-email] Erreur API Supabase:', error);
            return res.status(500).json({ error: 'Erreur serveur lors de la vérification.', details: error.message });
        }

        // On vérifie si au moins un utilisateur a le même email
        const userExists = users && users.some(u => u.email?.toLowerCase() === email.toLowerCase());

        console.log(`[check-email] Vérification pour ${email}: ${userExists ? 'trouvé' : 'non trouvé'}.`);
        return res.status(200).json({ exists: userExists });

    } catch (error) {
        console.error('[check-email] Erreur dans le bloc try/catch:', error);
        return res.status(500).json({ error: 'Erreur serveur inattendue.', details: error.message });
    }
}