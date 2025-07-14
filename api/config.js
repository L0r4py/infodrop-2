// api/config.js
// API pour fournir la configuration de manière sécurisée (Version Vercel)

export default async function handler(req, res) {
    // CORS headers pour Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Gérer les requêtes OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Vérifier la méthode HTTP
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Récupérer TOUTES les variables d'environnement
        const config = {
            supabaseUrl: process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            adminEmails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : ['l0r4.py@gmail.com'],
            stripeLink: process.env.STRIPE_LINK || 'https://buy.stripe.com/votre-lien'
        };

        // Vérifier que les variables essentielles existent
        if (!config.supabaseUrl || !config.supabaseAnonKey) {
            return res.status(500).json({ error: 'Configuration Supabase manquante' });
        }

        // Ajouter des headers de sécurité
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');

        // Retourner la configuration complète
        res.status(200).json(config);

    } catch (error) {
        console.error('Erreur config API:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
}