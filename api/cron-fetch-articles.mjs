// api/cron-fetch-articles.js
// Logique de parse-rss.js (V1) adaptée pour la nouvelle config

import { supabaseAdmin } from './config.mjs'; // ✅ On utilise la config centralisée
import Parser from 'rss-parser';

// La liste des flux de la V1
const RSS_FEEDS = [
    // === GENERALISTES ===
    { name: 'France Info', url: 'https://www.francetvinfo.fr/titres.rss', orientation: 'centre', tags: ['national'] },
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml', orientation: 'centre-gauche', tags: ['national'] },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml', orientation: 'gauche', tags: ['national'] },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml', orientation: 'droite', tags: ['national'] },
    { name: 'Le Parisien', url: 'https://feeds.leparisien.fr/leparisien/rss', orientation: 'centre-droit', tags: ['national'] },
    { name: 'Ouest France', url: 'https://www.ouest-france.fr/rss-en-continu.xml', orientation: 'centre', tags: ['regional'] },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml', orientation: 'centre-gauche', tags: ['traduction'] },
    { name: 'France Inter', url: 'https://www.radiofrance.fr/franceinter/rss', orientation: 'centre-gauche', tags: ['national'] },
    { name: "France24", url: 'https://www.france24.com/fr/france/rss', orientation: 'centre-gauche', tags: ['national'] },
    { name: "L'Obs", url: 'https://www.nouvelobs.com/rss.xml', orientation: 'centre-gauche', tags: ['national'] },
    { name: "France Info", url: 'https://www.francetvinfo.fr/titres.rss', orientation: 'centre', tags: ['national'] },
    { name: 'Euronews', url: 'https://fr.euronews.com/rss', orientation: 'centre', tags: ['international'] },

    // === RÉGIONALES ===
    { name: "La Depeche", url: 'https://www.ladepeche.fr/rss.xml', orientation: 'centre-gauche', tags: ['regional'] },
    { name: "Sud Ouest", url: 'https://www.sudouest.fr/rss.xml', orientation: 'centre-gauche', tags: ['regional'] },
    { name: "La Republique des Pyrenees", url: 'https://www.larepubliquedespyrenees.fr/rss.xml', orientation: 'centre-gauche', tags: ['regional'] },
    { name: 'La Semaine des Pyrénées', url: 'https://www.lasemainedespyrenees.fr/feed', orientation: 'centre', tags: ['regional'] },
    { name: 'Corse Net Infos', url: 'https://www.corsenetinfos.corsica/xml/syndication.rss', orientation: 'neutre', tags: ['Corse'] },

    // === LA PRESSE (Canada) ===
    { name: 'La Presse', url: 'https://www.lapresse.ca/actualites/rss', orientation: 'centre', tags: ['canada'] },
    { name: 'Radio-Canada', url: 'https://ici.radio-canada.ca/rss/4159', orientation: 'centre', tags: ['canada'] },
    { name: 'Le Devoir', url: 'https://www.ledevoir.com/rss/manchettes.xml', orientation: 'gauche', tags: ['canada'] },
    { name: 'Journal de Montréal', url: 'https://www.journaldemontreal.com/rss.xml', orientation: 'droite', tags: ['canada'] },

    // === SOURCES OFFICIELLES & PARLEMENTAIRES ===
    { name: 'Sénat (Textes)', url: 'https://www.senat.fr/rss/textes.xml', orientation: 'gouvernement', tags: ['officiel'] },
    { name: 'Sénat (Presse)', url: 'https://www.senat.fr/rss/presse.xml', orientation: 'gouvernement', tags: ['officiel'] },
    { name: 'Assemblée Nat. (Docs)', url: 'https://www2.assemblee-nationale.fr/feeds/detail/documents-parlementaires', orientation: 'gouvernement', tags: ['officiel'] },
    { name: 'Assemblée Nat. (CRs)', url: 'https://www2.assemblee-nationale.fr/feeds/detail/crs', orientation: 'gouvernement', tags: ['officiel'] },

    // === CULTURE / SCIENCES / SOCIÉTÉ ===
    { name: 'France Culture', url: 'https://www.radiofrance.fr/franceculture/rss', orientation: 'centre-gauche', tags: ['culture'] },
    { name: 'Futura Sciences', url: 'https://www.futura-sciences.com/rss/actualites.xml', orientation: 'centre', tags: ['sciences'] },
    { name: 'Sciences et Avenir', url: 'https://www.sciencesetavenir.fr/rss.xml', orientation: 'centre', tags: ['sciences'] },
    { name: 'Konbini', url: 'https://www.konbini.com/fr/feed/', orientation: 'centre', tags: ['pop', 'tendance'] },
    { name: 'Numerama', url: 'https://www.numerama.com/feed/', orientation: 'centre', tags: ['tech'] },
    { name: 'Zataz', url: 'https://www.zataz.com/feed/', orientation: 'neutre', tags: ['tech'] },
    { name: 'Reflets', url: 'https://reflets.info/feeds/public', orientation: 'gauche', tags: ['hacktivisme'] },
    { name: 'Journal du Geek', url: 'https://www.journaldugeek.com/feed/', orientation: 'neutre', tags: ['tech'] },


    // === ECO & CRYPTO ===
    { name: 'Journal du coin', url: 'https://journalducoin.com/feed/', orientation: 'neutre', tags: ['crypto'] },
    { name: 'Cryptoast', url: 'https://cryptoast.fr/feed/', orientation: 'neutre', tags: ['crypto'] },
    { name: 'Capital.fr', url: 'https://feed.prismamediadigital.com/v1/cap/rss', orientation: 'centre-droit', tags: ['économie'] },

    // === SPORT ===
    { name: "L'Équipe", url: "https://dwh.lequipe.fr/api/edito/rss?path=/Tous%20sports", orientation: "centre", tags: ["sport"] },

    // === DÉFENSE / MILITAIRE ===
    { name: 'Cyber.gouv.fr (ANSSI)', url: 'https://cyber.gouv.fr/actualites/feed', orientation: 'gouvernement', tags: ['cyber'] },
    { name: 'OPEX360', url: 'https://feeds.feedburner.com/ZoneMilitaire', orientation: 'droite', tags: ['militaire'] },

    // === INDÉPENDANTS ===
    { name: 'Reporterre', url: 'https://reporterre.net/spip.php?page=backend', orientation: 'gauche', tags: ['écologie'] },
    { name: 'Blast', url: 'https://api.blast-info.fr/rss.xml', orientation: 'gauche', tags: ['independant'] },
    { name: 'Arrêt sur Images', url: 'https://api.arretsurimages.net/api/public/rss/all-content', orientation: 'centre-gauche', tags: ['investigation'] },
    { name: 'Apar.tv', url: 'https://www.apar.tv/latest/rss/', orientation: 'centre-gauche', tags: ['pop'] },
    { name: 'Le Média en 4-4-2', url: 'https://lemediaen442.fr/feed/', orientation: 'centre-gauche', tags: ['independant'] },

    // === PRESSE D’OPINION & IDÉOLOGIQUE ===
    { name: "L'Humanité", url: 'https://www.humanite.fr/sections/politique/feed', orientation: 'gauche', tags: ['politique'] },
    { name: "L'Humanité", url: 'https://www.humanite.fr/sections/social-et-economie/feed', orientation: 'gauche', tags: ['économie'] },
    { name: "L'Humanité", url: 'https://www.humanite.fr/mot-cle/extreme-droite/feed', orientation: 'gauche', tags: ['opinion'] },
    { name: 'Politis', url: 'https://www.politis.fr/flux-rss-apps/', orientation: 'gauche', tags: ['opinion'] },
    { name: 'Regards', url: 'https://regards.fr/category/l-actu/feed/', orientation: 'gauche', tags: ['opinion'] },
    { name: 'La Croix', url: 'https://www.la-croix.com/feeds/rss/societe.xml', orientation: 'centre-droit', tags: ['société'] },
    { name: 'La Croix', url: 'https://www.la-croix.com/feeds/rss/politique.xml', orientation: 'centre-droit', tags: ['politique'] },
    { name: 'La Croix', url: 'https://www.la-croix.com/feeds/rss/culture.xml', orientation: 'centre-droit', tags: ['culture'] },
    { name: "L'Opinion", url: 'https://feeds.feedburner.com/lopinion', orientation: 'droite', tags: ['opinion'] },
    { name: 'Valeurs Actuelles', url: 'https://www.valeursactuelles.com/feed?post_type=post', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'Causeur', url: 'https://www.causeur.fr/feed', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/news-24-7/', orientation: 'centre-droit', tags: ['tv'] },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/people/', orientation: 'centre-droit', tags: ['people'] },
    { name: 'BFMTV', url: 'https://www.bfmtv.com/rss/crypto/', orientation: 'centre-droit', tags: ['crypto'] },
    { name: 'RMC', url: 'https://rmc.bfmtv.com/rss/actualites/', orientation: 'centre', tags: ['radio', 'tv'] },
    { name: 'Révolution Permanente', url: 'https://www.revolutionpermanente.fr/spip.php?page=backend_portada', orientation: 'extrême-gauche', tags: ['opinion'] },
    { name: 'Cnews', url: 'https://www.cnews.fr/rss.xml', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'Basta!', url: 'https://basta.media/spip.php?page=backend', orientation: 'extrême-gauche', tags: ['opinion'] },
    { name: 'Ballast', url: 'https://www.revue-ballast.fr/feed/', orientation: 'extrême-gauche', tags: ['opinion'] },

    // === PRESSE ÉTRANGÈRE ===
    { name: 'RTBF', url: 'https://rss.rtbf.be/article/rss/highlight_rtbf_info.xml?source=internal', orientation: 'centre-gauche', tags: ['belgique'] },

    // === ZAP ===
    { name: 'VU FranceTV', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqt99sKYNTxqlHtzV9weUYA', orientation: 'neutre', tags: ['zap'] },

    // === OUTRE-MER ===
    { name: 'Mayotte Hebdo', url: 'https://mayottehebdo.com/feed/', orientation: 'centre', tags: ['outre-mer'] },
    { name: "L'Info Kwezi", url: 'https://www.linfokwezi.fr/feed/', orientation: 'centre', tags: ['outre-mer'] },
    { name: 'France-Antilles', url: 'https://www.martinique.franceantilles.fr/actualite/rss.xml', orientation: 'centre', tags: ['outre-mer'] },
    { name: 'RCI.fm', url: 'https://rci.fm/martinique/fb/articles_rss_mq', orientation: 'centre', tags: ['outre-mer'] },
    { name: 'Tahiti Infos', url: 'https://www.tahiti-infos.com/xml/syndication.rss', orientation: 'centre', tags: ['outre-mer'] },
    { name: 'Outremers360', url: 'https://api.outremers360.com/rss/fil-info.xml', orientation: 'centre', tags: ['outre-mer'] },

    // === ALTERNATIF / INDÉPENDANT ===
    { name: 'Le Gossip', url: 'https://www.legossip.net/spip.php?page=backend', orientation: 'neutre', tags: ['people'] },
    { name: 'Public', url: 'https://www.public.fr/feed', orientation: 'neutre', tags: ['people'] },

    // --- ALTERNATIF / OPINION / GÉOPOLITIQUE ---
    { name: 'Réseau International', url: 'https://reseauinternational.net/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Le Saker Francophone', url: 'https://lesakerfrancophone.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Geopolintel', url: 'https://geopolintel.fr/spip.php?page=backend', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Nexus', url: 'https://nexus.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Enquête du Jour', url: 'https://enquetedujour.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },

    // --- EUROPÉEN / SCIENCE / COMMUNICATION ---
    { name: 'Le Grand Continent', url: 'https://legrandcontinent.eu/fr/feed/', orientation: 'centre-gauche', tags: ['europe'] },
    { name: 'The Conversation France', url: 'https://theconversation.com/fr/articles.atom', orientation: 'centre', tags: ['sciences'] },
    { name: 'Intelligence Online', url: 'https://feeds.feedburner.com/IntelligenceOnline-fr', orientation: 'centre', tags: ['tech'] },
    { name: 'CNRS Le Journal', url: 'https://lejournal.cnrs.fr/rss', orientation: 'neutre', tags: ['sciences'] }
];

const parser = new Parser({ timeout: 10000 });

export default async function handler(req, res) {
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const fetchPromises = RSS_FEEDS.map(feed => parser.parseURL(feed.url).catch(e => {
            console.warn(`Erreur parsing ${feed.name}: ${e.message}`);
            return null; // En cas d'erreur, on retourne null
        }));

        const results = await Promise.all(fetchPromises);
        let articlesToInsert = [];
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        results.forEach((feedData, index) => {
            if (!feedData) return;
            const sourceInfo = RSS_FEEDS[index];
            feedData.items.forEach(item => {
                const pubDate = item.isoDate ? new Date(item.isoDate) : new Date();
                if (pubDate >= twentyFourHoursAgo && item.link && item.title) {
                    articlesToInsert.push({
                        // Attention: le nom des colonnes doit correspondre à ta table `articles`
                        title: item.title,
                        link: item.link,
                        pubDate: pubDate.toISOString(),
                        source_name: sourceInfo.name,
                        orientation: sourceInfo.orientation,
                        category: sourceInfo.tags[0] || 'généraliste',
                        tags: sourceInfo.tags,
                        guid: item.guid || item.link
                    });
                }
            });
        });

        // Dé-doublonnage avant insertion
        const uniqueArticles = Array.from(new Map(articlesToInsert.map(a => [a.link, a])).values());

        if (uniqueArticles.length > 0) {
            await supabaseAdmin.from('articles').upsert(uniqueArticles, { onConflict: 'link' });
        }

        res.status(200).json({ success: true, inserted: uniqueArticles.length });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}