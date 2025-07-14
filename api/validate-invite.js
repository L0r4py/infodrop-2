// api/validate-invite.js
// Valide et consomme un code d'invitation (Version Vercel)

import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase en dehors du handler pour réutilisation
let supabase = null;

const getSupabase = () => {
    if (!supabase) {
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Configuration Supabase manquante');
        }

        supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return supabase;
};

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

    const { code, email } = req.body;
    if (!code || !email) {
        return res.status(400).json({ error: 'Un code et un email sont requis' });
    }

    const emailLC = email.toLowerCase(); // Force l'email en minuscules

    try {
        const supabase = getSupabase();

        // --- Étape A : Vérifier le code d'invitation ---
        const { data: codeData, error: fetchError } = await supabase
            .from('invitation_codes')
            .select('*')
            .eq('code', code)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (!codeData) {
            return res.status(400).json({ error: 'Ce code d\'invitation est invalide ou n\'existe pas.' });
        }

        if (codeData.is_used) {
            return res.status(400).json({ error: 'Ce code d\'invitation a déjà été utilisé.' });
        }

        // --- Étape B : Marquer le code comme "utilisé" ---
        const { error: updateError } = await supabase
            .from('invitation_codes')
            .update({
                is_used: true,
                used_by_email: emailLC,
                used_at: new Date().toISOString()
            })
            .eq('id', codeData.id);

        if (updateError) throw updateError;

        // --- Étape C : Créer un nouveau code pour le nouvel utilisateur ---
        const { data: newCodeData, error: rpcError } = await supabase.rpc('generate_invitation_code');
        if (rpcError) throw rpcError;

        const { error: insertError } = await supabase
            .from('invitation_codes')
            .insert({
                code: newCodeData,
                owner_email: emailLC,
                parent_code_id: codeData.id,
                generation: codeData.generation + 1
            });

        if (insertError) throw insertError;

        // --- Étape D : Succès ---
        res.status(200).json({ success: true, message: 'Code validé avec succès.' });

    } catch (error) {
        console.error('Erreur inattendue dans validate-invite:', error);
        res.status(500).json({ error: 'Erreur serveur inattendue.', details: error.message });
    }
}