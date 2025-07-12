// api/parse-rss.js
// Version corrigée pour INFODROP v2

import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
);

const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'INFODROP RSS Parser/2.0' }
});

// Liste des flux RSS
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

    // === PRESSE D'OPINION & IDÉOLOGIQUE ===
    { name: "L'Humanité (Politique)", url: 'https://www.humanite.fr/sections/politique/feed', orientation: 'gauche', tags: ['politique'] },
    { name: "L'Humanité (Économie)", url: 'https://www.humanite.fr/sections/social-et-economie/feed', orientation: 'gauche', tags: ['économie'] },
    { name: "L'Humanité (Opinion)", url: 'https://www.humanite.fr/mot-cle/extreme-droite/feed', orientation: 'gauche', tags: ['opinion'] },
    { name: 'Politis', url: 'https://www.politis.fr/flux-rss-apps/', orientation: 'gauche', tags: ['opinion'] },
    { name: 'Regards', url: 'https://regards.fr/category/l-actu/feed/', orientation: 'gauche', tags: ['opinion'] },
    { name: 'La Croix (Société)', url: 'https://www.la-croix.com/feeds/rss/societe.xml', orientation: 'centre-droit', tags: ['société'] },
    { name: 'La Croix (Politique)', url: 'https://www.la-croix.com/feeds/rss/politique.xml', orientation: 'centre-droit', tags: ['politique'] },
    { name: 'La Croix (Culture)', url: 'https://www.la-croix.com/feeds/rss/culture.xml', orientation: 'centre-droit', tags: ['culture'] },
    { name: "L'Opinion", url: 'https://feeds.feedburner.com/lopinion', orientation: 'droite', tags: ['opinion'] },
    { name: 'Valeurs Actuelles', url: 'https://www.valeursactuelles.com/feed?post_type=post', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'Causeur', url: 'https://www.causeur.fr/feed', orientation: 'extrême-droite', tags: ['opinion'] },
    { name: 'BFMTV (24/7)', url: 'https://www.bfmtv.com/rss/news-24-7/', orientation: 'centre-droit', tags: ['tv'] },
    { name: 'BFMTV (People)', url: 'https://www.bfmtv.com/rss/people/', orientation: 'centre-droit', tags: ['people'] },
    { name: 'BFMTV (Crypto)', url: 'https://www.bfmtv.com/rss/crypto/', orientation: 'centre-droit', tags: ['crypto'] },
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

    // === ALTERNATIF / OPINION / GÉOPOLITIQUE ===
    { name: 'Réseau International', url: 'https://reseauinternational.net/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Le Saker Francophone', url: 'https://lesakerfrancophone.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Geopolintel', url: 'https://geopolintel.fr/spip.php?page=backend', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Nexus', url: 'https://nexus.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },
    { name: 'Enquête du Jour', url: 'https://enquetedujour.fr/feed/', orientation: 'extrême-droite', tags: ['alternatif'] },

    // === EUROPÉEN / SCIENCE / COMMUNICATION ===
    { name: 'Le Grand Continent', url: 'https://legrandcontinent.eu/fr/feed/', orientation: 'centre-gauche', tags: ['europe'] },
    { name: 'The Conversation France', url: 'https://theconversation.com/fr/articles.atom', orientation: 'centre', tags: ['sciences'] },
    { name: 'Intelligence Online', url: 'https://feeds.feedburner.com/IntelligenceOnline-fr', orientation: 'centre', tags: ['tech'] },
    { name: 'CNRS Le Journal', url: 'https://lejournal.cnrs.fr/rss', orientation: 'neutre', tags: ['sciences'] }
];

// Fonction pour décoder les entités HTML
function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&eacute;/g, 'é')
        .replace(/&egrave;/g, 'è')
        .replace(/&ecirc;/g, 'ê')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&hellip;/g, '…')
        .replace(/&nbsp;/g, ' ')
        .replace(/&ndash;/g, '-')
        .replace(/&mdash;/g, '—')
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&agrave;/g, 'à')
        .replace(/&acirc;/g, 'â')
        .replace(/&ocirc;/g, 'ô')
        .replace(/&ucirc;/g, 'û')
        .replace(/&iuml;/g, 'ï')
        .replace(/&euml;/g, 'ë')
        .replace(/&ccedil;/g, 'ç')
        .replace(/&Agrave;/g, 'À')
        .replace(/&Eacute;/g, 'É')
        .replace(/&Egrave;/g, 'È');
}

// Règles de filtrage
const FILTER_RULES = {
    'Le Parisien': ['météo', 'horoscope']
};

const GLOBAL_FILTER_KEYWORDS = [
    'horoscope', 'astrologie', 'loterie', 'programme tv', 'recette', 'mots croisés', 'sudoku'
];

// Fonction pour créer un résumé
function createSummary(text) {
    if (!text) return '';

    // Décoder les entités HTML
    text = decodeHtmlEntities(text);

    // Remplacer les caractères spéciaux
    text = text
        .replace(/'/g, "'")
        .replace(/–/g, '-')
        .replace(/…/g, '...')
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/«/g, '"')
        .replace(/»/g, '"');

    // Retirer les balises HTML
    let cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s\s+/g, ' ').trim();

    // Limiter à 180 caractères
    if (cleanText.length > 180) {
        cleanText = cleanText.substring(0, 177) + '...';
    }

    return cleanText;
}

// Fonction pour filtrer les articles
function shouldFilterArticle(title, source) {
    const lowerTitle = (title || '').toLowerCase();

    // Filtrage global
    if (GLOBAL_FILTER_KEYWORDS.some(keyword => lowerTitle.includes(keyword))) {
        return true;
    }

    // Filtrage par source
    const sourceFilters = FILTER_RULES[source];
    if (sourceFilters && sourceFilters.some(keyword => lowerTitle.includes(keyword))) {
        return true;
    }

    return false;
}

// Fetch RSS avec timeout
function fetchRssWithTimeout(feed, timeout = 5000) {
    return new Promise((resolve) => {
        let finished = false;
        const timer = setTimeout(() => {
            if (!finished) {
                finished = true;
                resolve({ feed, error: `Timeout after ${timeout}ms` });
            }
        }, timeout);

        parser.parseURL(feed.url)
            .then(feedData => {
                if (!finished) {
                    finished = true;
                    clearTimeout(timer);
                    resolve({ feed, feedData });
                }
            })
            .catch(e => {
                if (!finished) {
                    finished = true;
                    clearTimeout(timer);
                    resolve({ feed, error: e.message });
                }
            });
    });
}

// Handler principal
export default async function handler(req, res) {
    // Vérification de la méthode
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const start = Date.now();
    console.log('[INFODROP v2] Début du parsing RSS...');

    // Traiter tous les flux en parallèle
    const results = await Promise.allSettled(
        RSS_FEEDS.map(feed => fetchRssWithTimeout(feed, 5000))
    );

    let articlesToInsert = [];
    let filteredCount = 0;
    let fluxOk = 0, fluxTimeout = 0, fluxError = 0;
    const now = new Date();

    // Traiter les résultats
    for (const result of results) {
        if (result.status !== "fulfilled" || !result.value) {
            fluxError++;
            continue;
        }

        const { feed, feedData, error } = result.value;

        if (error) {
            if (error.includes("Timeout")) {
                fluxTimeout++;
            } else {
                fluxError++;
            }
            console.error(`[RSS] Erreur ${feed.name}: ${error}`);
            continue;
        }

        if (!feedData?.items) continue;
        fluxOk++;

        // Traiter les articles du flux
        for (const item of feedData.items) {
            // Filtrer les articles indésirables
            if (shouldFilterArticle(item.title, feed.name)) {
                filteredCount++;
                continue;
            }

            // Déterminer la date de publication
            let pubDate = null;
            if (item.isoDate) {
                pubDate = new Date(item.isoDate);
            } else if (item.pubDate) {
                pubDate = new Date(item.pubDate);
            } else {
                pubDate = new Date();
            }

            // Vérifier la validité de la date
            if (isNaN(pubDate.getTime()) || pubDate > now) {
                pubDate = new Date();
            }

            // Garder seulement les articles des 6 dernières heures
            const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
            if (pubDate < sixHoursAgo) continue;

            // Vérifier que l'article a une URL
            if (!item.link && !item.guid) continue;

            // Nettoyer le titre
            let titleToUse = item.title || 'Sans titre';
            if (feed.name === 'Konbini') {
                titleToUse = decodeHtmlEntities(titleToUse);
            }

            // Créer l'objet article
            articlesToInsert.push({
                title: titleToUse,
                summary: createSummary(
                    item.contentSnippet ||
                    item.content ||
                    item.description ||
                    titleToUse
                ),
                source_name: feed.name,
                url: item.link || item.guid,
                published_at: pubDate.toISOString(),
                orientation: feed.orientation,
                tags: feed.tags || [],
                image_url: item.enclosure?.url || null
            });
        }
    }

    // Insérer dans la base de données
    let insertedCount = 0;
    if (articlesToInsert.length > 0) {
        try {
            const { data, error } = await supabase
                .from('articles')
                .upsert(articlesToInsert, {
                    onConflict: 'url',
                    ignoreDuplicates: false
                })
                .select();

            if (error) {
                console.error('[Supabase] Erreur insertion:', error);
            } else {
                insertedCount = data ? data.length : 0;
            }
        } catch (err) {
            console.error('[Supabase] Exception:', err);
        }
    }

    // Nettoyer les anciens articles
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count } = await supabase
            .from('articles')
            .delete()
            .lt('published_at', sevenDaysAgo.toISOString())
            .select('*', { count: 'exact', head: true });

        console.log(`[Nettoyage] ${count || 0} anciens articles supprimés`);
    } catch (err) {
        console.error('[Nettoyage] Erreur:', err);
    }

    const duration = ((Date.now() - start) / 1000).toFixed(2);

    // Log du résultat
    console.log(`[INFODROP v2] Terminé en ${duration}s - OK: ${fluxOk}, Timeout: ${fluxTimeout}, Erreurs: ${fluxError}`);
    console.log(`[INFODROP v2] ${articlesToInsert.length} articles trouvés, ${insertedCount} insérés, ${filteredCount} filtrés`);

    // Réponse
    return res.status(200).json({
        success: true,
        stats: {
            flux_ok: fluxOk,
            flux_timeout: fluxTimeout,
            flux_error: fluxError,
            articles_found: articlesToInsert.length,
            articles_inserted: insertedCount,
            articles_filtered: filteredCount,
            duration_seconds: duration
        }
    });
}