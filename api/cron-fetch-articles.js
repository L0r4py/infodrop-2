// Fichier : api/cron-fetch-articles.js
// VERSION DE TEST "HELLO WORLD"

export default async function handler(req, res) {
    // On vérifie d'abord que le secret est bon
    if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
        // Si le secret est mauvais, on renvoie une erreur 401
        return res.status(401).json({ error: 'Accès non autorisé' });
    }

    // Si le secret est bon, on renvoie un simple message de succès.
    // Si cette étape fonctionne, le problème n'est PAS la sécurité, mais le code qui suit.
    console.log("Le test 'Hello World' a été appelé avec succès !");

    return res.status(200).json({
        message: "Hello World! Le secret est correct et la fonction a été exécutée."
    });
}