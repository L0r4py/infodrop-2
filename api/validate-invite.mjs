// api/validate-invite.js
// Logique V1 adaptée pour la nouvelle config

import { supabaseAdmin } from './config.mjs'; // ✅ On utilise la config centralisée

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { code, email } = req.body;
    if (!code || !email) {
        return res.status(400).json({ error: 'Un code et un email sont requis' });
    }
    const emailLC = email.toLowerCase();

    try {
        const { data: codeData, error: fetchError } = await supabaseAdmin
            .from('invitation_codes')
            .select('*')
            .eq('code', code)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!codeData) return res.status(400).json({ error: 'Ce code d\'invitation est invalide.' });
        if (codeData.is_used) return res.status(400).json({ error: 'Ce code d\'invitation a déjà été utilisé.' });

        const { error: updateError } = await supabaseAdmin
            .from('invitation_codes')
            .update({ is_used: true, used_by_email: emailLC, used_at: new Date().toISOString() })
            .eq('id', codeData.id);
        if (updateError) throw updateError;

        // La V1 ne semble pas recréer de code ici, on s'arrête là pour coller à la logique.
        res.status(200).json({ success: true, message: 'Code validé avec succès.' });

    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur.', details: error.message });
    }
}