// api/generate-invite.js
// Permet à un admin de générer un nouveau code d'invitation (Version Vercel)

import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase
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

// Récupère la liste des emails admin depuis les variables d'environnement
const getAdminEmails = () => {
    const adminEmails = process.env.ADMIN_EMAILS || 'l0r4.py@gmail.com';
    return adminEmails.split(',').map(email => email.trim().toLowerCase());
};

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 1. Uniquement pour les requêtes POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // 2. Vérifier si l'appelant est bien un admin authentifié
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token d\'authentification manquant' });
        }

        const token = authHeader.replace('Bearer ', '');
        const supabase = getSupabase();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }

        // On vérifie si l'email de l'utilisateur fait partie de la liste des admins
        const adminEmails = getAdminEmails();
        if (!adminEmails.includes(user.email.toLowerCase())) {
            return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas administrateur.' });
        }

        // --- Si l'utilisateur est bien un admin, on continue ---

        // 3. On appelle la fonction SQL pour générer un code
        const { data: newCode, error: rpcError } = await supabase.rpc('generate_invitation_code');

        if (rpcError) {
            throw rpcError;
        }

        // 4. On enregistre ce nouveau code dans la base de données
        const { data: insertedCode, error: insertError } = await supabase
            .from('invitation_codes')
            .insert({
                code: newCode,
                owner_email: user.email.toLowerCase(), // Le code appartient à l'admin qui l'a créé
                generation: 1 // C'est un code de première génération
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        // 5. On renvoie le code généré avec succès
        res.status(200).json({ success: true, code: insertedCode.code });

    } catch (error) {
        console.error('Erreur dans generate-invite:', error);
        res.status(500).json({ error: 'Erreur serveur lors de la génération du code.', details: error.message });
    }
}